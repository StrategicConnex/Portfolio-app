import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema para validación estricta
const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })).min(1).max(20),
  language: z.enum(['es', 'en']).optional().default('es'),
});

// Rate limiter básico en memoria.
// NOTA: Para un entorno serverless de producción, este mapa en memoria no se comparte entre workers.
// Se recomienda encarecidamente reemplazarlo por un backend persistente como Upstash Redis o Vercel KV.
// Ejemplo: await redis.set(`ratelimit:${ip}`, count, { ex: 60 })
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // 10 mensajes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting por IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const now = Date.now();
    const userLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
      userLimit.count = 0;
      userLimit.lastReset = now;
    }

    if (userLimit.count >= RATE_LIMIT) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    userLimit.count++;
    rateLimitMap.set(ip, userLimit);

    // 2. Validación de Entrada
    const body = await req.json();
    const validation = ChatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }

    const { messages, language } = validation.data;

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('CRITICAL: OPENROUTER_API_KEY missing');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // 3. Llamada a OpenRouter
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://juanpalacios.vercel.app',
        'X-Title': 'Juan Palacios Portfolio AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `Eres Nacho Assistant, el compañero IA de Juan Felipe Palacios. Tu objetivo es responder preguntas de visitantes de su portfolio de manera profesional, técnica y amigable.
Juan es un Arquitecto de Ciberseguridad IT/OT con más de 20 años de experiencia en infraestructuras críticas (Oil & Gas).

EL USUARIO ESTÁ NAVEGANDO EN: ${language.toUpperCase()}. Responde preferentemente en este idioma a menos que el usuario cambie de idioma.

INFORMACIÓN CLAVE DE JUAN:
- Rol Actual: Project Manager IT | Cybersecurity Leader en YPY Oilfield Services.
- Experiencia: 11 años en Oilfield Production Services (Sr. Network Architect) y 10 años en Exterran (Business Technology Manager).
- Tecnologías (Stack):
  * Seguridad: Security Onion (SIEM), Firewalls, IAM, IEC 62443, NIST CSF, ISO 27001.
  * Redes: Cisco, MPLS, MikroTik, VSAT, Fibra Óptica.
  * Cloud/Virtualización: Azure, AWS, VMware vSphere, ESXi, Active Directory.
  * OT/Industrial: SCADA, Modbus, OPC UA, DNP3, Edge Computing.
  * Desarrollo: Next.js 14, React, Tailwind CSS, TypeScript.
  * Datos/Automatización: Python, Power BI, PowerShell.
- Proyectos Destacados: "StrategicConnex" (plataforma B2B para Vaca Muerta conectada con YPF, PAE, Vista).
- Disponibilidad: Disponible para consultoría y proyectos de alta criticidad en entornos IT/OT.
- Ubicación: Neuquén, Argentina (Trabajo remoto o presencial).
- Idiomas: Español (Nativo) e Inglés (Técnico/Profesional).
- CV: Hay un botón de "Descargar CV" en el portfolio que apunta a /CV-JuanFelipePalacios.pdf.

MÉTRICAS Y LOGROS TÉCNICOS (REALES):
- MTTR (Tiempo Medio de Respuesta): Reducido a menos de 15 minutos en entornos críticos.
- Uptime de Infraestructura: 99.9% garantizado en redes industriales y corporativas.
- Reducción de Incidentes: -30% mes a mes mediante la implementación de reglas de SIEM (Security Onion) e IA.
- Eficiencia Operativa: Ahorro de 10 horas semanales por personal mediante automatización (Python/PowerShell).
- Cumplimiento (Compliance): ISO 27001 (94%), IEC 62443 (88%), NIST CSF (91%).

REGLAS DE COMPORTAMIENTO:
1. Responde en el mismo idioma que el usuario.
2. Sé conciso pero informativo. Cuando hables de logros, usa cifras específicas.
3. Si te preguntan algo personal que no sea profesional, responde amablemente que solo puedes hablar del perfil profesional de Juan.
4. Si preguntan por contacto, menciona que pueden contactarlo por LinkedIn (linkedin.com/in/juanfpalacios) o usar el formulario de contacto al final de la página.
5. Ejemplo de respuesta: "¿Cómo mejora la seguridad Juan?" -> "Mediante estrategias de automatización y SIEM, Juan ha logrado reducir el tiempo de respuesta a incidentes (MTTR) a menos de 15 minutos, además de reducir el volumen de incidentes en un 30% mensual."`
          },
          ...messages,
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Chat API timeout');
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
