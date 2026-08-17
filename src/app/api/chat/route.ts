/**
 * Fallback chat endpoint.
 * This route exists as a compatibility layer during migration from the old AIConsultant
 * to the new Ask AI Copilot. The primary endpoint is /api/ask-ai.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Forward to the primary ask-ai endpoint
    // `.origin` (not protocol+hostname) preserves the port, so the internal
    // fetch works in local dev as well as in production.
    const origin = new URL(request.url).origin
    
    // H2: propagate the platform-set client identity so the rate limiter in
    // /api/ask-ai keys on the real client instead of collapsing every fallback
    // request into the global "internal" bucket. We relay x-forwarded-for /
    // x-real-ip EXACTLY as the trusted edge delivered them — we never build
    // these headers from client input — and getClientId() still reads the LAST
    // x-forwarded-for entry (the edge-appended one), so this fallback offers no
    // new IP-spoofing vector over calling /api/ask-ai directly.
    const clientForwardedFor = request.headers.get('x-forwarded-for')
    const clientRealIp = request.headers.get('x-real-ip')
    const response = await fetch(`${origin}/api/ask-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clientForwardedFor ? { 'x-forwarded-for': clientForwardedFor } : {}),
        ...(clientRealIp ? { 'x-real-ip': clientRealIp } : {}),
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
