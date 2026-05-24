import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('CRITICAL: GOOGLE_GENERATIVE_AI_API_KEY missing');
    return NextResponse.json({ error: 'AI provider is not configured' }, { status: 500 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google(process.env.GOOGLE_GENERATIVE_AI_MODEL || 'gemini-2.0-flash-001'),
    messages: modelMessages,
    system: `You are Ask Juan AI, an enterprise-grade Infrastructure & Cybersecurity Copilot for juanpalacios.vercel.app.

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
}
