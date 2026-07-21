import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(150),
  company: z.string().max(100).optional().default(''),
  type: z.string().max(50).optional().default(''),
  message: z.string().min(1, 'Message is required').max(2000),
});

export function buildEmailHtml(data: z.infer<typeof contactSchema>): string {
  const typeLabel = data.type
    ? data.type
        .replace('contact.type.', '')
        .replace(/\./g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : 'No especificado';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    .header { border-bottom: 2px solid #1e90ff; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { color: #e2e8f0; font-size: 22px; font-weight: 700; margin: 0; }
    .header p { color: #64748b; font-size: 13px; margin: 4px 0 0; }
    .field { margin-bottom: 20px; }
    .field-label { color: #1e90ff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
    .field-value { color: #e2e8f0; font-size: 15px; line-height: 1.5; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.08); }
    .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 24px 0; }
    .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
    .badge { display: inline-block; background: rgba(30,144,255,0.12); color: #1e90ff; border: 1px solid rgba(30,144,255,0.2); font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
    .tag { display: inline-block; background: rgba(197,164,109,0.12); color: #c5a46d; border: 1px solid rgba(197,164,109,0.2); font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📩 Nuevo contacto desde el portfolio</h1>
      <p>Recibido el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>

    <div class="field">
      <div class="field-label">Nombre Completo</div>
      <div class="field-value">${escapeHtml(data.name)}</div>
    </div>

    <div class="field">
      <div class="field-label">Email Corporativo</div>
      <div class="field-value">
        <a href="mailto:${escapeHtml(data.email)}" style="color: #60a5fa; text-decoration: none;">${escapeHtml(data.email)}</a>
      </div>
    </div>

    ${data.company ? `
    <div class="field">
      <div class="field-label">Empresa / Organización</div>
      <div class="field-value">${escapeHtml(data.company)}</div>
    </div>
    ` : ''}

    ${data.type ? `
    <div class="field">
      <div class="field-label">Tipo de Proyecto</div>
      <div class="field-value">
        <span class="tag">${escapeHtml(typeLabel)}</span>
      </div>
    </div>
    ` : ''}

    <div class="divider"></div>

    <div class="field">
      <div class="field-label">Mensaje / Requerimiento Técnico</div>
      <div class="field-value" style="white-space: pre-wrap;">${escapeHtml(data.message)}</div>
    </div>

    <div class="divider"></div>

    <div class="field" style="text-align: center;">
      <span class="badge">⚡ Responder en &lt; 24h hábiles</span>
    </div>

    <div class="footer">
      <p>Portfolio — Juan Felipe Palacios · IT/OT Cybersecurity Architect</p>
      <p style="font-size: 10px;">Neuquén, Argentina · juanpalacios.vercel.app</p>
    </div>
  </div>
</body>
</html>`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;

    if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
      console.error('Email environment variables missing. Cannot send email.', {
        RESEND_API_KEY: !!RESEND_API_KEY,
        CONTACT_TO_EMAIL: !!CONTACT_TO_EMAIL,
        CONTACT_FROM_EMAIL: !!CONTACT_FROM_EMAIL,
      });
      return NextResponse.json({ error: 'Configuración de email incompleta' }, { status: 500 });
    }

    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      replyTo: parsed.data.email,
      subject: `Nuevo contacto de ${parsed.data.name} — ${parsed.data.company || 'Sin empresa'}${parsed.data.type ? ` [${parsed.data.type.replace('contact.type.', '')}]` : ''}`,
      html: buildEmailHtml(parsed.data),
    });

    if (error) {
      console.error('Resend send error:', error);
      return NextResponse.json({ error: 'Error al enviar el email' }, { status: 500 });
    }

    console.log(`Email sent successfully via Resend. ID: ${data?.id}`);

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
