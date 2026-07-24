import { NextRequest } from 'next/server'

/**
 * Fallback chat endpoint.
 * This route exists as a compatibility layer during migration from the old AIConsultant
 * to the new Ask AI Copilot. The primary endpoint is /api/ask-ai.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward to the primary ask-ai endpoint
    const { hostname, protocol } = new URL(request.url)
    const origin = `${protocol}//${hostname}`
    
    const response = await fetch(`${origin}/api/ask-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') ?? '',
        'X-Real-Ip': request.headers.get('x-real-ip') ?? '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return new Response(response.statusText, { status: response.status })
    }

    // Stream the response back
    const reader = response.body?.getReader()
    if (!reader) {
      return new Response('No response stream', { status: 500 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[Chat Fallback] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handle GET requests for health checks.
 */
export async function GET() {
  return new Response(
    JSON.stringify({ status: 'ok', message: 'Chat fallback endpoint active' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
