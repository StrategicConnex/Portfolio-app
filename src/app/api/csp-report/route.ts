import { NextResponse } from 'next/server'

// CSP Report-Only endpoint for violation monitoring
// Logs violations to console in development, could be extended to
// send to Sentry/PostHog/external service in production

interface CSPReport {
  'csp-report': {
    'document-uri': string
    'referrer': string
    'blocked-uri': string
    'violated-directive': string
    'effective-directive': string
    'original-policy': string
    'disposition': string
    'status-code': number
    'script-sample': string
  }
}

export async function POST(request: Request) {
  try {
    const report: CSPReport = await request.json()
    const violation = report['csp-report']

    // Log CSP violation for debugging/monitoring
    console.warn('[CSP Violation]', {
      documentUri: violation['document-uri'],
      blockedUri: violation['blocked-uri'],
      violatedDirective: violation['violated-directive'],
      effectiveDirective: violation['effective-directive'],
      statusCode: violation['status-code'],
      timestamp: new Date().toISOString(),
    })

    // In production, you could send this to:
    // - Sentry: Sentry.captureException(new Error('CSP Violation'), { extra: violation })
    // - PostHog: posthog.capture('csp_violation', violation)
    // - Custom endpoint: fetch('https://your-logging-service.com/csp', { body: violation })

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    // Don't let CSP reporting errors break the app
    console.error('[CSP Report Error]', error)
    return NextResponse.json({ success: true }, { status: 204 })
  }
}

// Also handle GET requests gracefully (some browsers send GET for reporting)
export async function GET() {
  return NextResponse.json({ success: true }, { status: 204 })
}
