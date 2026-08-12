/**
 * ADR-004 runtime probe — no-regression of the ask-ai route seam.
 * Asserts:
 *  1. POST → 200 + stream content-type (not 503 JSON): the FreeFirstRouter
 *     accepted the first free model without a synchronous throw.
 *  2. Invalid body → 400 (input validation untouched).
 *  3. The response carries the AI SDK stream id header (UI stream contract).
 */
const BASE = 'http://localhost:3100';

async function main() {
  let ok = true;

  // 1. Happy path: valid message → stream response starts
  const res = await fetch(`${BASE}/api/ask-ai?lang=es&mode=ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'hola' }] }],
    }),
  });
  const ct = res.headers.get('content-type') || '';
  // AI SDK v7 UI message stream: text/event-stream + x-vercel-ai-ui-message-stream: v1
  const uiHeader = res.headers.get('x-vercel-ai-ui-message-stream');
  const streamStarted = res.status === 200 && ct.startsWith('text/event-stream') && uiHeader === 'v1';
  console.log(`[1] stream-start        status=${res.status} ct=${ct} ui=${uiHeader} -> ${streamStarted ? 'PASS' : 'FAIL'}`);
  if (!streamStarted) ok = false;

  // Read the initial stream chunks (bounded): proves the provider round-trip
  // starts and SSE data actually flows (free model responds). A bounded read
  // avoids hanging on a slow model or a mid-stream error without [DONE].
  const reader = res.body?.getReader();
  let body = '';
  const timer = setTimeout(() => reader?.cancel().catch(() => {}), 25000);
  try {
    while (reader && body.length < 2048) {
      const { value, done } = await reader.read();
      if (done) break;
      body += new TextDecoder().decode(value);
    }
  } finally {
    clearTimeout(timer);
    reader?.cancel().catch(() => {});
  }
  const sseOk = body.length > 0 && body.startsWith('data: ');
  const deltas = (body.match(/text-delta/g) || []).length;
  console.log(`[3] stream-content      bytes=${body.length} sse=${body.startsWith('data: ')} text-deltas=${deltas} -> ${sseOk ? 'PASS' : 'FAIL'}`);
  if (!sseOk) ok = false;
  if (body.length > 0 && !sseOk) {
    console.log(`    preview: ${JSON.stringify(body.slice(0, 200))}`);
  }

  // 2. Invalid body → 400 JSON (validation untouched)
  const bad = await fetch(`${BASE}/api/ask-ai?lang=es`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: 'not-an-array' }),
  });
  const badJson = await bad.json();
  const badOk = bad.status === 400 && typeof badJson.error === 'string';
  console.log(`[2] invalid-body         status=${bad.status} error="${badJson.error}" -> ${badOk ? 'PASS' : 'FAIL'}`);
  if (!badOk) ok = false;

  console.log(`\nRESULT: ${ok ? 'GATE PASS' : 'GATE FAIL'}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('probe crashed:', e);
  process.exit(1);
});
