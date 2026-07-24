import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimitDistributed } from '@/lib/rate-limit-upstash';
import { getClientId } from '@/lib/rate-limit';
import { buildRagContext } from '@/lib/ask-ai/rag/retrieve';
import { retrieveCombined } from '@/lib/ask-ai/rag/embeddings';
import { askAiTools } from '@/lib/ask-ai/tools/registry';
import { generateConversationSummary, shouldSummarize } from '@/lib/ask-ai/memory/conversation-memory';

export const maxDuration = 30;

// ─── Model Pool Configuration ───────────────────────────────────────────────
// Free models (suffix :free) cost $0 on OpenRouter. Configurable via env vars.
// The pool is tried in order; if one fails, the next is attempted automatically.

const FREE_MODEL_POOL = (
  process.env.OPENROUTER_MODEL_POOL ||
  'openrouter/free,google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free,inclusionai/ling-3.0-flash:free'
).split(',').map(s => s.trim()).filter(Boolean);

/** Paid fallback model (used only if all free models fail) */
const PAID_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-3.6-flash';

// OpenRouter provider factory — reuses API key, creates provider per model attempt
function createProvider(apiKey?: string) {
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey || process.env.OPENROUTER_API_KEY,
  });
}

const RequestSchema = z.object({
  messages: z.array(z.any()).max(50).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const language: string = url.searchParams.get('lang') || 'es';
    const mode: string = url.searchParams.get('mode') || 'ask';

    // Input validation
    let parsedBody: { messages?: UIMessage[] };
    try {
      parsedBody = await req.json();
      RequestSchema.parse(parsedBody);
    } catch {
      return NextResponse.json(
        { error: language === 'en' ? 'Invalid request format' : 'Formato de solicitud inválido' },
        { status: 400 },
      );
    }

    const messages: UIMessage[] = parsedBody.messages || [];

    // Distributed rate limiting (Upstash Redis with in-memory fallback)
    const clientId = getClientId(req);
    const rateLimit = await checkRateLimitDistributed(clientId, 10, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: language === 'en' ? 'Too many requests. Try again in a minute.' : 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('CRITICAL: OPENROUTER_API_KEY missing');
      return NextResponse.json(
        { error: language === 'en' ? 'AI service is not configured' : 'El servicio de IA no está configurado' },
        { status: 500 },
      );
    }

    // Extract last user message for RAG
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const queryText = lastUserMessage
      ? lastUserMessage.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text').map((p) => p.text).join(' ')
      : '';

    // Retrieve relevant portfolio context via combined RAG (keywords + TF-IDF semantic)
    const keywordContext = buildRagContext(queryText, language as 'es' | 'en', 5);
    const semanticResults = retrieveCombined(queryText, language as 'es' | 'en', 5);
    
    // Merge: use keyword results primarily, boost with semantic results
    const ragContext = keywordContext.context;
    const sources = keywordContext.sources.length > 0 
      ? keywordContext.sources 
      : semanticResults.map(r => ({ title: r.source.title, id: r.source.id }));
    
    // Memory context is client-side only via localStorage for now

    // Check if we should generate a summary
    if (shouldSummarize(messages)) {
      try {
        const summary = generateConversationSummary(
          messages.map(m => ({ role: m.role, content: m.parts.filter(p => p.type === 'text').map(p => p.text).join(' ') })),
          language as 'es' | 'en',
        );
        console.log('[AskAI] Conversation summary:', summary.title);
      } catch {
        // Summary generation is non-critical
      }
    }

    const modelMessages = await convertToModelMessages(messages);

    // Bilingual tool descriptions with selection guidance and output format
    const toolDescriptions = language === 'en'
      ? `You have access to the following passive cybersecurity analysis tools. Choose the right tool based on user intent:

Tool Selection Guide:
- Use dnsAnalyzer when the user asks about: domain records, email routing (MX), DNS configuration, name servers, or subdomains.
- Use sslChecker when the user asks about: certificate validity, HTTPS setup, TLS versions, certificate expiry, or secure connections.
- Use httpHeadersAnalyzer when the user asks about: security headers, HSTS, CSP configuration, X-Frame-Options, or web server hardening.
- Use whoisLookup when the user asks about: domain ownership, registration date, registrar info, or contact details for a domain.
- Use techStackDetector when the user asks about: what technology a site uses, what framework, CDN, analytics, or server software.
- Use portAnalyzer when the user asks about: network ports, service security, recommended port configurations, or firewall rules.

Tool list:
- dnsAnalyzer: Analyze DNS records (A, AAAA, MX, TXT, NS, CNAME) for a domain
- sslChecker: Check SSL/TLS certificate validity, expiry, and issuer
- httpHeadersAnalyzer: Analyze HTTP security headers (HSTS, CSP, XFO, etc.)
- whoisLookup: Look up domain registration information via RDAP
- techStackDetector: Detect technology stack (server, framework, CDN, analytics)
- portAnalyzer: Get security info about network ports and services (risk levels, recommendations)

Output Format Rules:
- Use tables for comparisons (e.g., comparing ports, frameworks, or security headers).
- Use bullet points for sequential recommendations or step-by-step guides.
- Use code blocks only for commands, config snippets, or technical values.
- Bold the most important finding or recommendation per response.
- When a tool returns an error, explain what likely went wrong and suggest alternatives.`
      : `Tienes acceso a las siguientes herramientas de análisis pasivo de ciberseguridad. Elige la herramienta correcta según la intención del usuario:

Guía de Selección de Herramientas:
- Usa dnsAnalyzer cuando el usuario pregunte sobre: registros DNS, enrutamiento de correo (MX), configuración DNS, servidores de nombres o subdominios.
- Usa sslChecker cuando el usuario pregunte sobre: validez de certificados, configuración HTTPS, versiones TLS, expiración de certificados o conexiones seguras.
- Usa httpHeadersAnalyzer cuando el usuario pregunte sobre: cabeceras de seguridad, HSTS, configuración CSP, X-Frame-Options o hardening de servidores web.
- Usa whoisLookup cuando el usuario pregunte sobre: propiedad de dominio, fecha de registro, registrador o datos de contacto de un dominio.
- Usa techStackDetector cuando el usuario pregunte sobre: qué tecnología usa un sitio, qué framework, CDN, analytics o servidor utiliza.
- Usa portAnalyzer cuando el usuario pregunte sobre: puertos de red, seguridad de servicios, configuraciones recomendadas de puertos o reglas de firewall.

Lista de herramientas:
- dnsAnalyzer: Analiza registros DNS (A, AAAA, MX, TXT, NS, CNAME) de un dominio
- sslChecker: Verifica validez, expiración y emisor del certificado SSL/TLS
- httpHeadersAnalyzer: Analiza cabeceras de seguridad HTTP (HSTS, CSP, XFO, etc.)
- whoisLookup: Consulta información de registro de dominios vía RDAP
- techStackDetector: Detecta stack tecnológico (servidor, framework, CDN, analytics)
- portAnalyzer: Obtén información de seguridad sobre puertos y servicios (niveles de riesgo, recomendaciones)

Reglas de Formato de Salida:
- Usa tablas para comparaciones (ej: comparando puertos, frameworks o cabeceras de seguridad).
- Usa viñetas para recomendaciones secuenciales o guías paso a paso.
- Usa bloques de código solo para comandos, fragmentos de configuración o valores técnicos.
- Resalta en negrita el hallazgo o recomendación más importante por respuesta.
- Cuando una herramienta devuelva un error, explica qué pudo haber salido mal y sugiere alternativas.`;

    // ─── Build system prompt ──────────────────────────────────────────────────
    const systemPrompt = `You are Ask Juan AI, an enterprise-grade Infrastructure & Cybersecurity Copilot for juanpalacios.vercel.app.

EL USUARIO ESTÁ NAVEGANDO EN: ${language.toUpperCase()}. Responde preferentemente en este idioma a menos que el usuario cambie de idioma.
MODO ACTIVO: ${mode.toUpperCase()}

Role:
- AI Infrastructure & Cybersecurity Copilot
- Expert in IT/OT cybersecurity, industrial networks, IEC 62443, NIST CSF, SIEM, OSINT, cloud, networking and SaaS engineering.

${ragContext ? `${language === 'en' ? 'Portfolio context (use these sources as factual references):' : 'Contexto del portfolio (usa estas fuentes como referencia factual):'}

${ragContext}

${language === 'en' ? 'IMPORTANT:' : 'IMPORTANTE:'}
- ${language === 'en' ? 'Use these sources as factual basis for answers.' : 'Usa estas fuentes como base factual para responder.'}
- ${language === 'en' ? 'If you cannot find information in the sources, state it is not available in the portfolio context.' : 'Si no encuentras información en las fuentes, indica que no está disponible en el contexto del portfolio.'}
- ${language === 'en' ? 'Do not invent certifications, employers, metrics or personal details not present in the sources.' : 'No inventes certificaciones, empleadores, métricas o detalles personales que no estén en las fuentes.'}
- ${language === 'en' ? 'If the user asks about services, experience or profile, prioritize information from the provided sources.' : 'Si el usuario pregunta sobre servicios, experiencia o perfil, prioriza la información de las fuentes proporcionadas.'}` : ''}

Behavior:
- Answer in the user's language unless explicitly requested otherwise.
- Prefer precise, technical and useful answers.
- Focus on Juan Felipe Palacios' professional profile, consulting services, IT/OT cybersecurity, industrial networks, Vaca Muerta, Oil & Gas, Security Onion, NIST CSF, ISO 27001 and IEC 62443.
- Do not invent personal facts, certifications or metrics that are not in the portfolio context.
- For contact requests, direct users to LinkedIn or the contact section of the site.

${toolDescriptions}

${sources.length > 0 ? `${language === 'en' ? 'Available sources for this query:' : 'Fuentes disponibles para esta consulta:'} ${sources.map((s) => s.title).join(', ')}.` : ''}`;

    // ─── Model fallback loop ──────────────────────────────────────────────────
    // Try free models first (no credit cost). If all fail, try the paid fallback.
    // Free models use `:free` suffix — OpenRouter charges $0 for these.
    
    const modelsToTry: string[] = [
      ...FREE_MODEL_POOL,
      ...(PAID_MODEL ? [PAID_MODEL] : []),
    ];

    const provider = createProvider();
    let lastError: unknown;
    for (const modelId of modelsToTry) {
      try {
        const result = streamText({
          model: provider(modelId),
          messages: modelMessages,
          tools: askAiTools,
          maxOutputTokens: 4096,
          system: systemPrompt,
        });
        return result.toUIMessageStreamResponse();
      } catch (error) {
        lastError = error;
        console.warn(`[AskAI] Model ${modelId} failed:`, error);
        // Continue to next model in pool
      }
    }

    // All models failed
    console.error('[AskAI] All models in pool failed:', lastError);
    return NextResponse.json(
      { error: language === 'en' ? 'AI service unavailable. Try again later.' : 'Servicio de IA no disponible. Intenta de nuevo más tarde.' },
      { status: 503 },
    );
  } catch (error) {
    console.error('Ask AI error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
