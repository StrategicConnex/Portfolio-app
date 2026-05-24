import { NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(150),
  company: z.string().max(100).optional(),
  type: z.string().max(50).optional(),
  message: z.string().min(1, 'Message is required').max(2000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;

    if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
      console.error('Email environment variables missing. Cannot send email. Missing variables:', {
        RESEND_API_KEY: !!RESEND_API_KEY,
        CONTACT_TO_EMAIL: !!CONTACT_TO_EMAIL,
        CONTACT_FROM_EMAIL: !!CONTACT_FROM_EMAIL
      });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    console.log(`Email simulated to send:`, parsed.data);
    await new Promise(r => setTimeout(r, 500));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
