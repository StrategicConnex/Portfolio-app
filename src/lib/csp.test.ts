import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guard of the Content-Security-Policy.
 *
 * The policy lives in `next.config.ts` as a single string, so it is easy to
 * loosen by accident while adding a feature. ADR-001 removed `unpkg.com`
 * from it on purpose: the internal RUM plan forbids any runtime CDN, because
 * a CDN is a third-party dependency the page cannot control and that sees
 * every visitor's IP.
 *
 * This test pins the directives that were closed on purpose, so reopening
 * one has to be an explicit, reviewed change:
 *
 *  - `img-src 'self' data:` — the globe textures are served by the app
 *    (`public/textures/`), so no remote image host is needed.
 *  - `script-src` keeps `blob:` — troika (the 3D text of @react-three/drei)
 *    generates the font SDF in a module worker built with
 *    `new Worker(URL.createObjectURL(blob))`. Without that directive the
 *    worker is created but its imported module is blocked, the worker never
 *    initializes, and the exception takes down the whole `<Canvas>`.
 */

const configSource = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8')

function cspValue(): string {
  const match = configSource.match(/key: 'Content-Security-Policy'[\s\S]*?value: "([^"]+)"/)
  expect(match, 'no se encontró la cabecera Content-Security-Policy').not.toBeNull()
  return match![1]
}

function directive(policy: string, name: string): string {
  const part = policy.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `))
  expect(part, `la CSP no declara «${name}»`).toBeDefined()
  return part!
}

describe('Content-Security-Policy', () => {
  it('does not allow any remote image host', () => {
    const imgSrc = directive(cspValue(), 'img-src')

    expect(imgSrc).toContain("'self'")
    expect(imgSrc).toContain('data:')
    expect(imgSrc, 'img-src no debe abrirse a cualquier host remoto').not.toContain('https:')
    expect(imgSrc).not.toContain('http:')
  })

  it('does not allow any runtime CDN', () => {
    const policy = cspValue()

    expect(policy).not.toContain('unpkg.com')
    expect(policy).not.toContain('cdn.jsdelivr.net')
    expect(policy).not.toContain('fonts.gstatic.com')
    expect(policy).not.toContain('fonts.googleapis.com')
  })

  it('keeps the blob: worker source that the 3D text needs', () => {
    const scriptSrc = directive(cspValue(), 'script-src')

    expect(scriptSrc).toContain('blob:')
    expect(directive(cspValue(), 'worker-src')).toContain('blob:')
  })

  it('keeps the fonts local', () => {
    const fontSrc = directive(cspValue(), 'font-src')

    expect(fontSrc).toContain("'self'")
    expect(fontSrc).not.toContain('https:')
  })
})

describe('recursos estáticos del mapa', () => {
  const texturesDir = join(process.cwd(), 'public/textures')

  it('ships the globe textures inside the app', () => {
    expect(existsSync(texturesDir)).toBe(true)

    const files = readdirSync(texturesDir).filter((f) => /\.(jpe?g|png|webp)$/.test(f))
    expect(files.length).toBeGreaterThanOrEqual(3)
  })

  it('documents where the textures come from and how they can be used', () => {
    expect(existsSync(join(texturesDir, 'NOTICE.md'))).toBe(true)
  })

  it('does not ship the original oversized textures', () => {
    // Los originales de three-globe pesan 1,46 MB + 369 KB + 420 KB. Las
    // versiones servidas se recodifican (2048×1024 / escala de grises /
    // 1024×512): el total baja de 2,2 MB a ~360 KB sin mover la geografía.
    for (const file of readdirSync(texturesDir)) {
      if (!/\.(jpe?g|png|webp)$/.test(file)) continue
      const sizeKb = statSync(join(texturesDir, file)).size / 1024
      expect(sizeKb, `${file} pesa ${Math.round(sizeKb)} KB`).toBeLessThan(400)
    }
  })
})
