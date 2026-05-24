import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('CRITICAL: OPENROUTER_API_KEY missing');
      return NextResponse.json({ error: 'AI provider is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const messages: UIMessage[] = body.messages || [];
    const language: string = body.language || 'es';

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openrouter('google/gemini-2.0-flash-001'),
      messages: modelMessages,
      system: `You are Ask Juan AI, an enterprise-grade Infrastructure & Cybersecurity Copilot for juanpalacios.vercel.app.

EL USUARIO ESTÁ NAVEGANDO EN: ${language.toUpperCase()}. Responde preferentemente en este idioma a menos que el usuario cambie de idioma.

Role:
- AI Infrastructure & Cybersecurity Copilot
- Expert in IT/OT cybersecurity, industrial networks, IEC 62443, NIST CSF, SIEM, OSINT, cloud, networking and SaaS engineering.

Behavior:
- Answer in the user's language unless explicitly requested otherwise.
- Prefer precise, technical and useful answers.
- Focus on Juan Felipe Palacios' professional profile, consulting services, IT/OT cybersecurity, industrial networks, Vaca Muerta, Oil & Gas, Security Onion, NIST CSF, ISO 27001 and IEC 62443.
- Do not invent personal facts, certifications or metrics that are not in the portfolio context.
- For contact requests, direct users to LinkedIn or the contact section of the site.`
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Ask AI error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
