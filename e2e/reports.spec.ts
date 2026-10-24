import { test, expect } from '@playwright/test'

const SPEC = {
  type: 'threat-landscape',
  locale: 'es',
  title: 'Panorama de amenazas',
  generatedAt: '2026-10-24T12:00:00.000Z',
  summary: 'Resumen',
  sections: [{ heading: 'Orígenes', body: 'China lidera.', evidence: [{ source: 'DShield (SANS ISC)', mode: 'live' }] }],
  provenance: [{ source: 'DShield (SANS ISC)', mode: 'live' }],
  disclaimers: ['Datos del feed público DShield/CISA KEV; no provienen de una red propia.'],
}

function sse(parts: unknown[]) {
  return parts.map((part) => `data: ${JSON.stringify(part)}\n\n`).join('') + 'data: [DONE]\n\n'
}

test('renders and exports a generated report', async ({ page }) => {
  await page.route('**/api/ask-ai*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
      body: sse([
        { type: 'start' },
        { type: 'start-step' },
        { type: 'tool-input-start', toolCallId: 'r1', toolName: 'generateReport' },
        { type: 'tool-input-available', toolCallId: 'r1', toolName: 'generateReport', input: { type: 'threat-landscape', summary: 'Resumen', sections: SPEC.sections } },
        { type: 'tool-output-available', toolCallId: 'r1', output: { data: SPEC, provenance: SPEC.provenance } },
        { type: 'finish-step' },
        { type: 'finish' },
      ]),
    })
  })

  await page.goto('/ask-ai')
  // Wait for the SSE stream to complete and the report to appear
  await page.waitForSelector('text=Panorama de amenazas', { timeout: 10000 })
  // Check the report is rendered
  await expect(page.getByText('Orígenes')).toBeVisible()
  // Check export buttons are available
  await expect(page.getByRole('button', { name: /markdown/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /json/i })).toBeVisible()
  // PDF should be disabled
  await expect(page.getByRole('button', { name: /pdf/i })).toBeDisabled()
  // Download Markdown
  await page.getByRole('button', { name: /markdown/i }).click()
  // Download JSON
  await page.getByRole('button', { name: /json/i }).click()
})