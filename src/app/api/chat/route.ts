import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error('Mensajes no encontrados en el body:', body);
      return NextResponse.json({ error: 'Messages are required and must be an array' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY no está configurada');
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    console.log('Enviando solicitud a OpenRouter...');

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
        messages: [
          {
            role: 'system',
            content: `Eres Nacho Assistant, el compañero IA de Juan Felipe Palacios. Tu objetivo es responder preguntas de visitantes de su portfolio de manera profesional, técnica y amigable.
Juan es un Arquitecto de Ciberseguridad IT/OT con más de 20 años de experiencia en infraestructuras críticas (Oil & Gas).

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

REGLAS DE COMPORTAMIENTO:
1. Responde en el mismo idioma que el usuario.
2. Sé conciso pero informativo.
3. Si te preguntan algo personal que no sea profesional, responde amablemente que solo puedes hablar del perfil profesional de Juan.
4. Si preguntan por contacto, menciona que pueden contactarlo por LinkedIn (linkedin.com/in/juanfpalacios) o usar el formulario de contacto al final de la página.
5. Ejemplo de respuesta: "¿Juan trabajó con Next.js?" -> "Sí, Juan tiene experiencia sólida en desarrollo web con Next.js 14, habiendo desarrollado sitios visuales de alto impacto integrando también Tailwind CSS y Three.js."`
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error de OpenRouter (${response.status}):`, errorText);
      return NextResponse.json({ error: `OpenRouter API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error during chat processing' }, { status: 500 });
  }
}
