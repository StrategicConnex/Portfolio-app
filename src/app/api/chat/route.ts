import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, language = 'es' } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
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

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${response.status}` }, { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
