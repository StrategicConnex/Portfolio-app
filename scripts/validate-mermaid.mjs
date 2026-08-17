import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })

const { default: mermaid } = await import('mermaid')

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  suppressErrorRendering: true,
})

// Todos los archivos markdown que pueden contener diagramas mermaid.
const files = process.argv.slice(2)
const targets = files.length > 0 ? files : ['README.md', 'docs/ask-juan-ai-copilot.md']

let total = 0
let failed = 0

for (const file of targets) {
  let source
  try {
    source = readFileSync(file, 'utf8')
  } catch {
    console.error(`✗ no se pudo leer ${file}`)
    failed++
    continue
  }

  const blocks = [...source.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)]
  if (blocks.length === 0) {
    console.log(`· ${file}: sin bloques mermaid`)
    continue
  }

  for (const [i, m] of blocks.entries()) {
    total++
    const code = m[1]
    const firstLine = code.split('\n')[0].trim()
    try {
      await mermaid.parse(code)
      console.log(`✓ ${file} · diagrama ${i + 1}/${blocks.length} OK (${firstLine})`)
    } catch (err) {
      failed++
      console.error(`✗ ${file} · diagrama ${i + 1}/${blocks.length} FALLA (${firstLine})`)
      console.error(String(err).split('\n').slice(0, 6).join('\n'))
    }
  }
}

console.log(`\n${total - failed}/${total} diagramas válidos`)
process.exit(failed > 0 ? 1 : 0)
