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

  // The copilot is a floating panel, not a dedicated route: open it and send
  // a prompt so the SSE stream above is actually requested.
  await page.goto('/')
  await page.getByRole('button', { name: 'Tanos AI' }).click()
  const prompt = page.getByRole('textbox').first()
  await prompt.fill('Genera un informe del panorama de amenazas')
  await prompt.press('Enter')

  // Wait for the SSE stream to complete and the report to appear
  await page.waitForSelector('text=Panorama de amenazas', { timeout: 15000 })
  // Scope the assertions to the report card: the portfolio page behind the
  // panel also has buttons whose names contain "PDF".
  const report = page.getByRole('region').filter({ hasText: 'Panorama de amenazas' })
  await expect(report.getByText('Orígenes')).toBeVisible()
  // Check export buttons are available
  await expect(report.getByRole('button', { name: /markdown/i })).toBeVisible()
  await expect(report.getByRole('button', { name: /json/i })).toBeVisible()
  // PDF should be disabled
  await expect(report.getByRole('button', { name: /pdf/i })).toBeDisabled()
  // Download Markdown
  await report.getByRole('button', { name: /markdown/i }).click()
  // Download JSON
  await report.getByRole('button', { name: /json/i }).click()
})
