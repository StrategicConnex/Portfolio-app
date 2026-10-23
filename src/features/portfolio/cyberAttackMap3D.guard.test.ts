import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { threatmap } from '@/context/translations/threatmap'

/**
 * Guarda estructural del mapa 3D.
 *
 * El defecto que se corrigió aquí era invisible en los tests: el globo
 * rotaba sobre su propia malla mientras los marcadores y los arcos se
 * quedaban quietos en el espacio, de modo que los puntos acababan flotando
 * sobre países que no les correspondían.
 *
 * La escena no se puede montar en un test unitario (WebGL), así que se
 * comprueba el invariante directamente sobre el árbol de JSX: todo lo que
 * representa superficie terrestre —globo, etiquetas, pin, arcos y explosiones—
 * tiene que vivir dentro del mismo grupo que gira, y el globo no puede rotar
 * por su cuenta.
 */
const source = readFileSync(
  join(process.cwd(), 'src/features/portfolio/CyberAttackMap3D.tsx'),
  'utf8',
)

function sliceBetween(startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker)
  expect(start, `no se encontró «${startMarker}»`).toBeGreaterThan(-1)
  const end = source.indexOf(endMarker, start + startMarker.length)
  expect(end, `no se encontró «${endMarker}» después de «${startMarker}»`).toBeGreaterThan(-1)
  return source.slice(start, end)
}

describe('CyberAttackMap3D · escena sincronizada', () => {
  it('does not rotate the globe mesh on its own', () => {
    const globe = sliceBetween('function Globe()', 'function RotatingEarth(')

    expect(globe).not.toContain('rotation.y')
    expect(globe).not.toContain('useFrame')
  })

  it('rotates the earth, the labels, the pin, the arcs and the bursts as one unit', () => {
    const rotatingEarth = sliceBetween('<RotatingEarth>', '</RotatingEarth>')

    expect(rotatingEarth).toContain('<Globe />')
    expect(rotatingEarth).toContain('<CountryLabel')
    expect(rotatingEarth).toContain('<ProtectedPin')
    expect(rotatingEarth).toMatch(/<Arc[\s]/)
    expect(rotatingEarth).toContain('<ImpactBurst')
  })

  it('drives the rotation from a single frame-rate independent speed', () => {
    const rotatingEarth = sliceBetween('function RotatingEarth(', 'export default function')

    expect(rotatingEarth).toContain('advanceEarthRotation(')
    expect(rotatingEarth).not.toContain('rotation.y +=')
  })

  it('serves the label font from the app itself, not from a CDN', () => {
    // La CSP del proyecto solo permite `font-src 'self' data:`. Si las
    // etiquetas usaran la fuente por defecto de troika (fonts.gstatic.com)
    // la petición quedaría bloqueada y el texto no se vería.
    expect(source).toContain("const LABEL_FONT = '/fonts/DMMono-Regular.ttf'")
    expect(source).not.toContain('fonts.gstatic.com')

    const label = sliceBetween('function CountryLabel(', 'function ProtectedPin(')
    expect(label).toContain('font={LABEL_FONT}')
  })

  it('serves the globe textures from the app itself, not from a CDN', () => {
    // ADR-001 quitó `unpkg.com` de la CSP: un CDN en tiempo de ejecución es
    // una dependencia que la página no controla y que ve la IP de cada
    // visitante. Las texturas se sirven desde `public/textures/`.
    const textures = source.match(/'\/textures\/[^']+'/g) ?? []

    expect(textures).toHaveLength(3)
    expect(textures).toContain("'/textures/earth-blue-marble.jpg'")
    expect(textures).toContain("'/textures/earth-topology.jpg'")
    expect(textures).toContain("'/textures/earth-water.jpg'")

    // Ninguna petición de textura puede apuntar a un host remoto.
    const globe = sliceBetween('function Globe()', 'function RotatingEarth(')
    expect(globe).toContain('useTexture([...GLOBE_TEXTURES])')
    expect(globe).not.toMatch(/https?:\/\//)
    expect(source).not.toMatch(/useTexture\(\s*\[?\s*['"]https?:/)
  })

  it('wraps the scene in a Suspense boundary', () => {
    // `useTexture` y el texto de troika suspenden mientras cargan: sin un
    // límite de Suspense la escena no se monta.
    const canvas = sliceBetween('<Canvas', '</Canvas>')

    expect(canvas).toContain('<Suspense')
  })

  it('keeps the origin marker above the sub-pixel threshold', () => {
    // Un punto de 1 px "resbala" sobre la textura en saltos del grid y se
    // lee como si no perteneciera al país.
    const arc = sliceBetween('function Arc(', 'function Globe()')

    const match = arc.match(/sphereGeometry args=\{\[(0[0-9.]+)/)
    expect(match, 'no se encontró el radio del punto de origen').not.toBeNull()
    expect(Number(match![1])).toBeGreaterThanOrEqual(0.015)
  })

  it('exposes the statistics bar to assistive technology', () => {
    // La etiqueta sale del diccionario: el mapa es bilingüe, así que el texto
    // fijo en el componente sería un texto fijo en un solo idioma.
    expect(source).toContain("t('threatmap.stats.aria')")
    expect(source).not.toContain('aria-hidden="true"')
  })

  it('only uses events with a real IP as the origin of an arc', () => {
    // Los eventos de CISA KEV no tienen país de origen y los de muestra no
    // tienen IP: si se usaran como origen, el mapa atribuiría ataques a
    // países que el proveedor no señala.
    const memo = sliceBetween('const attributableEvents = useMemo(', '])')

    expect(memo).toContain('event.originIp')
    expect(memo).toContain('event.originCountry')
  })

  it('marks the origin as illustrative when no real IP is behind it', () => {
    expect(source).toContain('originIsIllustrative: !realEvent')
  })

  it('states the origin mode in the footer instead of always claiming a real IP', () => {
    // La etiqueta «Origen: … | Destino: …» se eliminó del pie. Lo que no
    // puede faltar es el estado real del feed, en sus dos ramas, en los dos
    // idiomas: el texto está en el diccionario y el componente lo elige.
    expect(source).toContain("t('threatmap.footer.live')")
    expect(source).toContain("t('threatmap.footer.degraded')")
    expect(source).not.toContain('Origen: IP real (DShield/SANS ISC)')

    expect(threatmap.es['threatmap.footer.live']).toBe(
      '✓ Datos de inteligencia de amenazas reales',
    )
    expect(threatmap.es['threatmap.footer.degraded']).toBe(
      '⚠ Feed sin datos: origen de los arcos ilustrativo',
    )
    expect(threatmap.en['threatmap.footer.live']).toBeDefined()
    expect(threatmap.en['threatmap.footer.degraded']).toBeDefined()
  })

  it('keeps every visible string of the map in the dictionary', () => {
    // El mapa se dibuja en WebGL: no hay DOM al que traducir, así que todo
    // su texto tiene que salir del diccionario. Si alguien vuelve a escribir
    // una cadena literal en el componente, esta guarda lo detecta.
    const literalText = source
      .split('\n')
      .filter((line) => /^\s*['"][^'"]{4,}['"]\s*$/.test(line))
      .map((line) => line.trim())
      .filter(
        (line) =>
          !/^['"](https?:|\/|[a-z-]+\/)/.test(line) &&
          line !== "'use client'" &&
          line !== '"use client"',
      )

    expect(literalText).toEqual([])
  })

  it('reads the ASN and the report count from the feed payload', () => {
    const payload = sliceBetween('interface ThreatEventPayload {', '}')

    expect(payload).toContain('originAs?: string')
    expect(payload).toContain('reports?: number')
  })

  it('carries the ASN and the report count of the event into the arc', () => {
    // Sin esto, el tooltip solo podría enseñar la IP: el ASN y el volumen de
    // reportes se quedarían en el endpoint.
    expect(source).toContain('originAs: realEvent?.originAs')
    expect(source).toContain('reports: realEvent?.reports')
  })

  it('gives the arc a pointer target wide enough to hover', () => {
    // El arco visible tiene un radio de 0.008: una línea de un píxel. Sin un
    // tubo de captura más ancho el tooltip no se podría abrir nunca.
    const arc = sliceBetween('function Arc(', 'function Globe()')

    expect(arc).toContain('ARC_HIT_RADIUS')
    expect(arc).toContain('onPointerOver')
    expect(arc).toContain('onPointerMove')
    expect(arc).toContain('onPointerOut')
  })

  it('renders a tooltip with the data of the hovered arc', () => {
    expect(source).toContain('<ArcTooltipPanel attack={hovered} />')
    // The tooltip role must not exist while the tooltip is empty: axe flags an
    // empty role="tooltip" as a serious a11y violation on the home page.
    expect(source).toContain("role={hovered ? 'tooltip' : undefined}")
    expect(source).toContain('aria-hidden={hovered ? undefined : true}')
  })
})
