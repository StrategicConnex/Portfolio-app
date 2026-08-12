import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import GlbAsset, { AssetFallbackBoundary, resolveGlbPath } from './GlbAsset'

// El mesh three se mockea: los tests cubren la lógica de resiliencia sin
// arrastrar el reconciler de R3F a jsdom (el GlbMesh real se valida en el
// probe de runtime con navegador real).
const glbMesh = vi.hoisted(() => ({ shouldThrow: false }))
vi.mock('./GlbMesh', () => ({
  default: ({ path }: { path: string }) => {
    if (glbMesh.shouldThrow) throw new Error('GLB parse failed (mock)')
    return <div data-testid="glb-mesh" data-path={path} />
  },
}))

const FALLBACK = <div data-testid="procedural-fallback" />

describe('GlbAsset — SPEC §37 fallback procedural sin disparar el error boundary global', () => {
  beforeEach(() => {
    glbMesh.shouldThrow = false
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    window.history.replaceState(null, '', '/')
  })

  it('path null → fallback directo, cero requests (default procedural, Fase 6 SKIP)', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    render(<GlbAsset path={null} fallback={FALLBACK} />)
    expect(screen.getByTestId('procedural-fallback')).toBeDefined()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.queryByTestId('glb-mesh')).toBeNull()
  })

  it('GLB ausente (HEAD 404) → fallback, sin montar el mesh y sin errores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<GlbAsset path="/assets/3d/missing.glb" fallback={FALLBACK} />)
    // Progresivo: el procedural se ve desde el primer paint
    expect(screen.getByTestId('procedural-fallback')).toBeDefined()
    await waitFor(() => expect(screen.queryByTestId('glb-mesh')).toBeNull())
    expect(screen.getByTestId('procedural-fallback')).toBeDefined()
  })

  it('red caída (HEAD reject) → fallback, sin errores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<GlbAsset path="/assets/3d/rack.glb" fallback={FALLBACK} />)
    await waitFor(() => expect(screen.queryByTestId('glb-mesh')).toBeNull())
    expect(screen.getByTestId('procedural-fallback')).toBeDefined()
  })

  it('GLB disponible (HEAD ok) → monta el mesh; el procedural cede al cargar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    render(<GlbAsset path="/assets/3d/server_rack_v02.glb" fallback={FALLBACK} />)
    // Durante el pre-check/parseo el fallback sigue visible (progresivo)
    expect(screen.getByTestId('procedural-fallback')).toBeDefined()
    expect(await screen.findByTestId('glb-mesh')).toBeDefined()
    expect(screen.queryByTestId('procedural-fallback')).toBeNull()
  })

  it('parse falla (useGLTF lanza) → boundary LOCAL captura; el global nunca se dispara', async () => {
    glbMesh.shouldThrow = true
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<GlbAsset path="/assets/3d/corrupt.glb" fallback={FALLBACK} />)
    expect(await screen.findByTestId('procedural-fallback')).toBeDefined()
    expect(screen.queryByTestId('glb-mesh')).toBeNull()

    // El warn defensivo del boundary local sí aparece…
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('GLB fallback to procedural'))).toBe(true)
    // …pero el marcador del DatacenterErrorBoundary GLOBAL jamás se loguea
    expect(
      errorSpy.mock.calls.some((c) => String(c[0]).includes('[datacenter] 3D scene error')),
    ).toBe(false)
  })

  it('param debug ?dc-glb= sobreescribe el path (verificación runtime §37)', async () => {
    window.history.replaceState(null, '', '/?dc-glb=missing_rack')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    render(<GlbAsset path={null} fallback={FALLBACK} />)
    const mesh = await screen.findByTestId('glb-mesh')
    expect(mesh.getAttribute('data-path')).toBe('/assets/3d/missing_rack.glb')
  })
})

describe('resolveGlbPath', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('path explícito gana sobre el param', () => {
    window.history.replaceState(null, '', '/?dc-glb=param.glb')
    expect(resolveGlbPath('/assets/3d/explicit.glb')).toBe('/assets/3d/explicit.glb')
  })

  it('param sin extensión → añade .glb; con extensión → tal cual', () => {
    window.history.replaceState(null, '', '/?dc-glb=my_rack')
    expect(resolveGlbPath(null)).toBe('/assets/3d/my_rack.glb')
    window.history.replaceState(null, '', '/?dc-glb=rack.glb')
    expect(resolveGlbPath(null)).toBe('/assets/3d/rack.glb')
  })

  it('param vacío o ausente → null', () => {
    window.history.replaceState(null, '', '/?dc-glb=')
    expect(resolveGlbPath(null)).toBeNull()
    window.history.replaceState(null, '', '/')
    expect(resolveGlbPath(null)).toBeNull()
  })
})

describe('AssetFallbackBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('captura el error del hijo y renderiza el fallback', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Boom = () => {
      throw new Error('boom')
    }
    const { container } = render(
      <AssetFallbackBoundary fallback={<div data-testid="fb" />}>
        <Boom />
      </AssetFallbackBoundary>,
    )
    expect(container.querySelector('[data-testid="fb"]')).not.toBeNull()
  })
})
