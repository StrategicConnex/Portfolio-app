import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CyberAttackMapFlat from './CyberAttackMapFlat'

const state = vi.hoisted(() => ({ lang: 'es' as 'es' | 'en' }))

vi.mock('@/context/LanguageContext', async () => {
  const { translations } = await import('@/context/translations')
  return {
    useLanguage: () => ({
      language: state.lang,
      setLanguage: vi.fn(),
      t: (key: string) => translations[state.lang][key] ?? key,
    }),
  }
})

const attacks = [
  {
    id: 1,
    startCoords: [0, 0] as [number, number],
    endCoords: [10, 20] as [number, number],
    color: '#ff4444',
  },
]

const labels = [
  ['Argentina', { coords: [-38.4, -63.6] as [number, number], color: '#ff8fb3' }],
] as Array<[string, { coords: [number, number]; color: string }]>

describe('CyberAttackMapFlat', () => {
  beforeEach(() => {
    state.lang = 'es'
  })

  it('dibuja los arcos y las etiquetas sobre el mapamundi', () => {
    const { container } = render(
      <CyberAttackMapFlat attacks={attacks} labels={labels} scale={1} pan={0} />,
    )

    expect(screen.getByTestId('flat-attack-map')).toBeDefined()
    expect(screen.getByRole('img', { name: /Mapa plano de ciberataques/ })).toBeDefined()
    expect(screen.getByText('ARGENTINA')).toBeDefined()
    expect(screen.getByText('Neuquén')).toBeDefined()

    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(3) // una copia por cada lado del antimeridiano
    expect(paths[0].getAttribute('stroke')).toBe('#ff4444')
    expect(paths[0].getAttribute('d')).toMatch(/^M /)
  })

  it('aplica la escala y el desplazamiento al encuadre', () => {
    const { container } = render(
      <CyberAttackMapFlat attacks={attacks} labels={labels} scale={2} pan={-10} />,
    )

    const frame = container.querySelector('[data-testid="flat-attack-map"] > div')
    expect(frame?.getAttribute('style')).toContain('scale(2) translateX(-10%)')
  })

  it('traduce la etiqueta accesible al inglés', () => {
    state.lang = 'en'
    render(<CyberAttackMapFlat attacks={[]} labels={[]} scale={1} pan={0} />)

    expect(
      screen.getByRole('img', { name: /Flat cyber attack map/ }),
    ).toBeDefined()
  })
})
