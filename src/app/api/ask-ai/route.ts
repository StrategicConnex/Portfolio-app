import { type UIMessage, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';
import { buildRagContext } from '@/lib/ask-ai/rag/retriever';
import { askAiTools } from '@/lib/ask-ai/tools/registry';
import { buildSystemPrompt } from '@/lib/ask-ai/prompt/system-prompt';
import { streamWithFallback, ModelPoolError, buildFreeModelPool } from '@/lib/ask-ai/model-pool';

export const maxDuration = 30;

// ─── Model Pool Configuration ───────────────────────────────────────────────
// FREE-ONLY: the pool contains exclusively OpenRouter `:free` endpoints (and
// the `openrouter/free` router as last resort) — enforced by
// `buildFreeModelPool()`, which drops any non-free entry from
// `OPENROUTER_MODEL_POOL` and throws `ModelPoolError` (→ 503) if nothing
// survives. There is intentionally NO paid fallback: the copilot never
// spends money on inference. The pool is tried in order; a model only
// counts as failed when its stream errors before producing data.

// OpenRouter provider factory — reuses API key, creates provider per model attempt
function createProvider(apiKey?: string) {
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey || process.env.OPENROUTER_API_KEY,
  });
}

const RequestSchema = z.object({
  messages: z.array(z.any()).max(50).optional().default([]),
  // Pre-formatted past-conversation block from the client memory seam.
  // Capped: it is embedded into the system prompt verbatim.
  memoryContext: z.string().trim().max(3000).optional(),
  // Free models that failed mid-stream this session — excluded from the
  // pool so a client auto-retry lands on a different model.
  skipModels: z.array(z.string()).max(5).optional().default([]),
});

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const language: string = url.searchParams.get('lang') || 'es';
    const mode: string = url.searchParams.get('mode') || 'ask';

    // Input validation
    let parsedBody: { messages?: UIMessage[]; memoryContext?: string; skipModels?: string[] };
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

    // Rate limiting via the unified seam (Upstash Redis with in-memory fallback)
    const clientId = getClientId(req);
    const rateLimit = await checkRateLimit(clientId, 10, 60_000);

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

    // Retrieve relevant portfolio context via the unified RAG seam
    // (keywords + TF-IDF semantic fused in one pass). Context and the
    // source list come from the same retrieval, so they never diverge.
    const { context: ragContext, sources } = buildRagContext(queryText, language as 'es' | 'en', 5);

    const modelMessages = await convertToModelMessages(messages);

    // System prompt assembled by the prompt-builder seam (testable per
    // language/mode without hitting the network).
    const systemPrompt = buildSystemPrompt({
      language: language as 'es' | 'en',
      mode,
      ragContext,
      sources,
      memoryContext: parsedBody.memoryContext,
    });

    // ─── Model pool (free-only, via the model-pool seam) ────────────────────
    // `buildFreeModelPool` enforces the free-only invariant (drops non-`:free`
    // entries) and throws `ModelPoolError` if nothing survives → 503, never
    // a paid fallback. The pool commits to the first model whose stream
    // starts cleanly; mid-stream errors surface to the client as usual. The
    // winning model id travels to the client as stream metadata for the
    // panel's model badge.

    const provider = createProvider();

    try {
      const { response } = await streamWithFallback(
        buildFreeModelPool(process.env.OPENROUTER_MODEL_POOL, {
          skip: parsedBody.skipModels,
        }),
        {
          model: (modelId) => provider(modelId),
          messages: modelMessages,
          tools: askAiTools,
          maxOutputTokens: 4096,
          system: systemPrompt,
          messageMetadata: (modelId, attemptIndex) => ({
            modelId,
            // The client shows a fallback indicator when the first pool
            // model failed and a later one answered.
            fellBack: attemptIndex > 1,
          }),
        },
      );
      return response;
    } catch (error) {
      if (error instanceof ModelPoolError) {
        // All models failed to start their stream
        console.error('[AskAI] All models in pool failed:', error.cause);
        return NextResponse.json(
          { error: language === 'en' ? 'AI service unavailable. Try again later.' : 'Servicio de IA no disponible. Intenta de nuevo más tarde.' },
          { status: 503 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Ask AI error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
