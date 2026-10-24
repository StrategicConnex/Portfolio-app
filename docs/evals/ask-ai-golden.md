# Ask Juan AI — Golden QA Checklist

**Purpose:** Manual verification checklist for the Ask Juan AI copilot enhancement. Run these 25 test cases after each implementation task to ensure correctness, bilingual consistency, and no regressions.

## Test Categories

### 1. Threat-Intel / Map Feed (`getThreatIntel`)
- [ ] **T1.1** Tool returns data with correct provenance (`DShield (SANS ISC)` + `CISA KEV`)
- [ ] **T1.2** `dataSource` is `'live'` when DShield has events, `'degraded'` otherwise
- [ ] **T1.3** `sourceStatus` reflects each source's availability
- [ ] **T1.4** Summary includes `totals`, `topCountries`, `topTypes`
- [ ] **T1.5** Events are capped at the configured limit
- [ ] **T1.6** When `dataSource === 'degraded'`, warnings array is populated
- [ ] **T1.7** No events are invented; all come from the shared adapter

### 2. Library Search (`searchLibrary`)
- [ ] **T2.1** `searchLibraryDocs('IEC 62443', { locale: 'es', limit: 3 })` returns matches with download URLs
- [ ] **T2.2** `searchLibraryDocs('modbus', { locale: 'en', volume: 'vol2', limit: 2 })` filters by volume
- [ ] **T2.3** Each match has `title`, `category`, `excerpt` ≤ 300 chars, `downloadUrl`
- [ ] **T2.4** Tool result includes `provenance: [{ source: 'IT/OT Library', mode: 'static' }]`

### 3. Report Generation (`generateReport`)
- [ ] **T3.1** `createGenerateReportTool('es')` with valid input returns `ToolResult<ReportSpec>`
- [ ] **T3.2** `createGenerateReportTool('en')` with valid input returns `ToolResult<ReportSpec>`
- [ ] **T3.3** Invalid `type` is rejected by `reportInputSchema.safeParse()`
- [ ] **T3.4** Report includes `locale`, `generatedAt` ISO date, `provenance`, and `disclaimers`
- [ ] **T3.5** Markdown renderer outputs `# <type>`, sections with `## <heading>`, evidence list, provenance, disclaimers
- [ ] **T3.6** JSON renderer outputs valid JSON that round-trips through `JSON.parse`
- [ ] **T3.7** Report always includes the compliance-reference disclaimer: “no es una auditoría de un cliente”

### 4. Report Extraction & Display (`ReportViewer`)
- [ ] **T4.1** `ReportViewer` renders the spec title/type
- [ ] **T4.2** `ReportViewer` renders `generatedAt` timestamp
- [ ] **T4.3** `ReportViewer` renders provenance dots (`source (mode)`)
- [ ] **T4.4** `ReportViewer` renders disclaimers list
- [ ] **T4.5** Markdown export button is enabled
- [ ] **T4.6** JSON export button is enabled
- [ ] **T4.7** PDF export button is disabled (future feature)
- [ ] **T4.8** Report section headings appear as real DOM text (not inside `<pre>` only)

### 5. Sidebar Sources (`AskAISourcesSidebar`)
- [ ] **T5.1** When `sources` prop is provided, renders those source titles
- [ ] **T5.2** When `sources` prop is empty, falls back to static `SOURCE_ITEMS` list
- [ ] **T5.3** Both English and Spanish titles are shown (`Sources`/`Fuentes` heading)
- [ ] **T5.4** Collapsible trigger is present and functional

### 6. System Prompt / Provenance Rules
- [ ] **T6.1** System prompt (ES) contains: `procedencia`, `no inventes`, `SIEM`, `demo/simulación`
- [ ] **T6.2** System prompt (EN) contains: `provenance`, `do not invent`, `SIEM`, `demo/simulation`
- [ ] **T6.3** Tool descriptions include: `getThreatIntel`, `searchLibrary`, `generateReport` with correct ES/EN descriptions
- [ ] **T6.4** No hardcoded copy; all strings are bilingual through `translations` or `t()` calls

### 7. RAG / Retrieval Integrity
- [ ] **T7.1** SIEM panel is never interpreted as live telemetry; if asked, model says “Es una demo” and offers map analysis
- [ ] **T7.2** No vector DB / embeddings / Groq usage; deterministic RAG (`retrieve()` keyword 0.6 + TF-IDF 0.4) is unchanged
- [ ] **T7.3** No paid model fallback; `buildFreeModelPool` is untouched
- [ ] **T7.4** Report tool content is treated as DATA, never as instructions

### 8. Bilingual Consistency
- [ ] **T8.1** Every user-visible string has ES/EN counterpart
- [ ] **T8.2** No hardcoded text in components without translation key
- [ ] **T8.3** Report types and disclaimers are defined per locale in `DISCLAIMERS` record

### 9. Validation & Build
- [ ] **T9.1** `npm run typecheck` passes
- [ ] **T9.2** Targeted `npx vitest run …` passes for all new/modified test files
- [ ] **T9.3** `npm run lint` passes
- [ ] **T9.4** `npm test` passes (full test suite)
- [ ] **T9.5** `npm run build` completes without errors
- [ ] **T9.6** `npx playwright test --workers=1` passes (E2E suite)

## Notes

- All report templates are labelled “marco de referencia, no auditoría de un cliente” (compliance reference, not a client audit).
- Report sections are capped at 1–8; section body ≤ 4000 chars; evidence ≤ 20 per section; title ≤ 120; summary ≤ 600.
- The `searchLibrary` tool limit is 1–5 documents.
- The tool loop max is 4 steps.