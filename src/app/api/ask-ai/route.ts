import { streamText, type UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('CRITICAL: OPENROUTER_API_KEY missing');
    return NextResponse.json({ error: 'AI provider is not configured' }, { status: 500 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openrouter('google/gemini-2.0-flash-001'),
    messages,
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

  return result.toTextStreamResponse ? result.toTextStreamResponse() : (result as any).toUIMessageStreamResponse ? (result as any).toUIMessageStreamResponse() : (result as any).toDataStreamResponse();
}
