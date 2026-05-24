import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash-001'),
    messages,
    system: "You are Ask Juan AI, an enterprise-grade Infrastructure & Cybersecurity Copilot for juanpalacios.vercel.app.\n\nRole:\n- AI Infrastructure & Cybersecurity Copilot\n- Expert in IT/OT cybersecurity, industrial networks, IEC 62443, NIST CSF, SIEM, OSINT, cloud, networking and SaaS engineering.\n\nBehavior:\n- Answer in the user's language unless explicitly requested otherwise.\n- Prefer precise, technical and useful answers."
  });

  return result.toTextStreamResponse();
}
