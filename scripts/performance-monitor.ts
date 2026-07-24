/**
 * Performance monitoring script for the portfolio.
 * Runs server-side performance tests against the production site.
 * Tracks response times, core web vitals indicators, and AI copilot latency.
 *
 * Run: npx tsx scripts/performance-monitor.ts [url]
 * Default URL: https://juanpalacios.vercel.app
 */

const DEFAULT_URL = 'https://juanpalacios.vercel.app';

interface PerformanceReport {
  timestamp: string;
  targetUrl: string;
  responseTime: number;
  statusCode: number;
  ttfb: number;
  contentLength: number;
  securityHeaders: Record<string, string | undefined>;
  aiEndpointAvailable: boolean;
  aiEndpointLatency: number | null;
}

async function measureResponseTime(url: string): Promise<number> {
  const start = performance.now();
  await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
  return performance.now() - start;
}

async function measureFullRequest(url: string): Promise<{
  responseTime: number;
  ttfb: number;
  statusCode: number;
  contentLength: number;
  headers: Record<string, string | undefined>;
}> {
  const start = performance.now();
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const ttfb = performance.now() - start;

  const text = await response.text();
  const responseTime = performance.now() - start;

  return {
    responseTime,
    ttfb,
    statusCode: response.status,
    contentLength: text.length,
    headers: {
      'content-type': response.headers.get('content-type') ?? undefined,
      'x-frame-options': response.headers.get('x-frame-options') ?? undefined,
      'strict-transport-security': response.headers.get('strict-transport-security') ?? undefined,
      'content-security-policy': response.headers.get('content-security-policy') ?? undefined,
      'cache-control': response.headers.get('cache-control') ?? undefined,
      'server': response.headers.get('server') ?? undefined,
    },
  };
}

async function checkAiEndpoint(baseUrl: string): Promise<{ available: boolean; latency: number | null }> {
  const start = performance.now();
  try {
    const response = await fetch(`${baseUrl}/api/ask-ai?lang=es&mode=ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
      signal: AbortSignal.timeout(10_000),
    });
    const latency = performance.now() - start;
    // 400 means route is alive (validation error since no valid messages)
    // 429 means rate limited but available
    // 200 shouldn't happen without a stream
    return {
      available: response.status === 400 || response.status === 429 || response.status === 200,
      latency,
    };
  } catch {
    return { available: false, latency: null };
  }
}

async function runReport(targetUrl: string = DEFAULT_URL): Promise<PerformanceReport> {
  console.log(`\n🔍 Running performance report for: ${targetUrl}\n`);

  // Warmup request
  console.log('  Warming up...');
  await measureResponseTime(targetUrl).catch(() => {});

  // Main measurement
  console.log('  Measuring response...');
  const main = await measureFullRequest(targetUrl);

  // AI endpoint check
  console.log('  Checking AI endpoint...');
  const ai = await checkAiEndpoint(targetUrl);

  const report: PerformanceReport = {
    timestamp: new Date().toISOString(),
    targetUrl,
    responseTime: Math.round(main.responseTime),
    statusCode: main.statusCode,
    ttfb: Math.round(main.ttfb),
    contentLength: main.contentLength,
    securityHeaders: main.headers,
    aiEndpointAvailable: ai.available,
    aiEndpointLatency: ai.latency ? Math.round(ai.latency) : null,
  };

  printReport(report);
  return report;
}

function printReport(report: PerformanceReport): void {
  console.log('\n' + '='.repeat(50));
  console.log('  PERFORMANCE REPORT');
  console.log('='.repeat(50));
  console.log(`  Timestamp:     ${report.timestamp}`);
  console.log(`  Target URL:    ${report.targetUrl}`);
  console.log(`  Status:        ${report.statusCode}`);
  console.log(`  Response Time: ${report.responseTime}ms`);
  console.log(`  TTFB:          ${report.ttfb}ms`);
  console.log(`  Size:          ${(report.contentLength / 1024).toFixed(1)} KB`);
  console.log('');
  console.log('  Security Headers:');
  for (const [key, value] of Object.entries(report.securityHeaders)) {
    console.log(`    ${key}: ${value ? '✅' : '❌'} ${value || 'missing'}`);
  }
  console.log('');
  console.log('  AI Copilot Endpoint:');
  console.log(`    Available:    ${report.aiEndpointAvailable ? '✅ YES' : '❌ NO'}`);
  if (report.aiEndpointLatency !== null) {
    console.log(`    Latency:      ${report.aiEndpointLatency}ms`);
  }
  console.log('='.repeat(50) + '\n');

  // Success criteria
  const passed = [];
  const failed = [];

  if (report.responseTime < 2000) passed.push('Response time < 2s');
  else failed.push(`Response time ${report.responseTime}ms >= 2s`);

  if (report.ttfb < 800) passed.push('TTFB < 800ms');
  else failed.push(`TTFB ${report.ttfb}ms >= 800ms`);

  if (report.securityHeaders['strict-transport-security']) passed.push('HSTS enabled');
  else failed.push('HSTS missing');

  if (report.securityHeaders['x-frame-options']) passed.push('X-Frame-Options set');
  else failed.push('X-Frame-Options missing');

  if (report.securityHeaders['content-security-policy']) passed.push('CSP configured');
  else failed.push('CSP missing');

  console.log('  ✅ Passed checks:');
  passed.forEach(p => console.log(`    • ${p}`));
  if (failed.length > 0) {
    console.log('  ❌ Failed checks:');
    failed.forEach(f => console.log(`    • ${f}`));
  }
  console.log('');
}

// CLI entry point — only runs when executed directly, not when imported
if (process.argv[1]?.includes('performance-monitor')) {
  const targetUrl = process.argv[2] || DEFAULT_URL;
  runReport(targetUrl).catch((err) => {
    console.error('Performance monitor error:', err);
    process.exit(1);
  });
}
