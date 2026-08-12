/**
 * ADR-004 pool fix — e2e: POST to the live route and assert the Copilot
 * actually streams text (text-delta events) with the reordered default pool
 * (gemma-4-31b-it:free first).
 */
const BASE = 'http://localhost:3100';

async function main() {
  const res = await fetch(`${BASE}/api/ask-ai?lang=es&mode=ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', parts: [{ type: 'text', text: 'responde solo con la palabra: datacenter' }] },
      ],
    }),
  });
  console.log('status:', res.status, '| ct:', res.headers.get('content-type'));

  const body = await res.text();
  const deltas = (body.match(/text-delta/g) || []).length;
  const done = body.includes('[DONE]');
  const err = body.match(/"error":"([^"]*)"/);
  const texts = [...body.matchAll(/"text":"((?:[^"\\]|\\.)*)"/g)]
    .map((m) => m[1])
    .slice(0, 8);
  console.log('bytes:', body.length, '| text-deltas:', deltas, '| [DONE]:', done);
  if (err) console.log('error event:', err[1].slice(0, 200));
  console.log('text samples:', JSON.stringify(texts.join(' ').slice(0, 160)));

  const pass = deltas > 0 && done;
  console.log('\nRESULT:', pass ? 'E2E PASS — el Copilot responde texto real end-to-end' : 'E2E FAIL');
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('crash:', e.message);
  process.exit(1);
});
