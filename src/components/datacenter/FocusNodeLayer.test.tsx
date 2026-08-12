import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import FocusNodeLayer from './FocusNodeLayer'
import { publishFocusSection } from '@/lib/focusNode'

// El reconciler de R3F no se arrastra a jsdom: se mockea el frame loop y el
// HudLabel (patrón GlbAsset.test). La baliza se valida en el probe de runtime.
vi.mock('@react-three/fiber', () => ({ useFrame: () => undefined }))
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }))
vi.mock('./HudLabel', () => ({
  default: ({ labelKey }: { labelKey: string }) => <div data-testid="focus-label" data-key={labelKey} />,
}))

describe('FocusNodeLayer — nodo focal (audit G2)', () => {
  afterEach(() => {
    publishFocusSection(null)
    vi.restoreAllMocks()
  })

  it('sin sección activa → no renderiza nada', () => {
    const { container } = render(<FocusNodeLayer />)
    expect(container.querySelector('mesh')).toBeNull()
    expect(screen.queryByTestId('focus-label')).toBeNull()
  })

  it('sección publicada → baliza (3 meshes) + label i18n de la sección', () => {
    publishFocusSection('perfil')
    const { container } = render(<FocusNodeLayer />)
    expect(container.querySelectorAll('mesh').length).toBe(3) // core + halo + ring
    expect(screen.getByTestId('focus-label').getAttribute('data-key')).toBe('dc.focus.perfil')
  })

  it('reacciona al cambio de sección (store pub/sub, no al scroll)', () => {
    publishFocusSection('home')
    const { rerender, container } = render(<FocusNodeLayer />)
    expect(screen.getByTestId('focus-label').getAttribute('data-key')).toBe('dc.focus.home')
    publishFocusSection('audit-hub')
    rerender(<FocusNodeLayer />)
    expect(screen.getByTestId('focus-label').getAttribute('data-key')).toBe('dc.focus.audit-hub')
    expect(container.querySelectorAll('mesh').length).toBe(3)
  })

  it('sección sin mapeo → no renderiza nada (fallback seguro)', () => {
    publishFocusSection('seccion-sin-nodo')
    const { container } = render(<FocusNodeLayer />)
    expect(container.querySelector('mesh')).toBeNull()
    expect(screen.queryByTestId('focus-label')).toBeNull()
  })
})
