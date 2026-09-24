import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecursosHubPage from './page'
import VolumePage from './[volumen]/page'
import { RECURSO_FILES } from '@/data/recursos'
import { VOLUMES } from '@/lib/recursos-volumes'

vi.mock('@/lib/server-i18n', () => {
  const dict: Record<string, string> = {
    'recursos.hub_label': 'Biblioteca',
    'recursos.hub_title': 'Biblioteca IT/OT',
    'recursos.hub_highlight': 'Libro',
    'recursos.hub_intro': 'Cinco volúmenes de documentación.',
    'recursos.page.docs': 'documentos',
    'recursos.page.files': 'Documentos de este volumen',
    'recursos.page.chapters': 'Índice de contenido',
    'recursos.page.back_library': 'Volver a la biblioteca',
    'recursos.page.other_volumes': 'Otros volúmenes',
    'recursos.download': 'Descargar',
  }
  return {
    getServerT: async () => ({
      language: 'es' as const,
      t: (key: string) => dict[key] || key,
      dict,
    }),
  }
})

vi.mock('@/data/recursos-outline', () => ({
  RECURSO_OUTLINE: {
    'recursos/guias/vol1/guia_implementacion_vpn.docx': [
      { t: 1, x: 'ÍNDICE' },
      { t: 1, x: '1. INTRODUCCIÓN A LAS VPN INDUSTRIALES' },
      { t: 2, x: '1.1 ¿Qué es una VPN industrial?' },
      { t: 3, x: 'Detalle de nivel de prueba' },
    ],
  },
  RECURSO_SEARCH: {},
}))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))

describe('Recursos hub page (/recursos)', () => {
  it('renders one card per volume with the Spanish copy', async () => {
    const ui = await RecursosHubPage()
    render(ui)
    for (const vol of VOLUMES) {
      expect(screen.getByText(vol.es.name)).toBeDefined()
    }
  })

  it('links every volume detail page', async () => {
    const ui = await RecursosHubPage()
    const { container } = render(ui)
    for (const vol of VOLUMES) {
      expect(container.querySelector(`a[href="/recursos/${vol.slug}"]`)).not.toBeNull()
    }
  })
})

describe('Volume detail page (/recursos/[volumen])', () => {
  it('renders the volume header and a download link per document', async () => {
    const vol = VOLUMES[3] // Vol. IV · Ciberseguridad
    const ui = await VolumePage({ params: Promise.resolve({ volumen: vol.slug }) })
    render(ui)

    expect(screen.getByText(vol.es.name)).toBeDefined()
    const expected = RECURSO_FILES.filter((f) => f.category === vol.slug).length
    const downloads = screen.getAllByText('Descargar')
    expect(downloads).toHaveLength(expected)
  })

  it('builds download hrefs through the tracking endpoint with the real file path', async () => {
    const ui = await VolumePage({ params: Promise.resolve({ volumen: 'vol1' }) })
    const { container } = render(ui)
    const link = container.querySelector(
      'a[href="/api/track/download?f=%2Frecursos%2Fguias%2Fvol1%2Fguia_implementacion_vpn.docx"]',
    )
    expect(link).not.toBeNull()
    expect(link?.getAttribute('download')).not.toBeNull()
  })

  it('shows a chapter index built from real headings (H1+H2 only)', async () => {
    const ui = await VolumePage({ params: Promise.resolve({ volumen: 'vol1' }) })
    render(ui)
    expect(screen.getByText('Índice de contenido')).toBeDefined()
    expect(screen.getByText('1.1 ¿Qué es una VPN industrial?')).toBeDefined()
    // H3 entries are intentionally collapsed out of the index.
    expect(screen.queryByText('Detalle de nivel de prueba')).toBeNull()
  })

  it('emits Book JSON-LD structured data', async () => {
    const ui = await VolumePage({ params: Promise.resolve({ volumen: 'vol1' }) })
    const { container } = render(ui)
    const ld = container.querySelector('script[type="application/ld+json"]')
    expect(ld).not.toBeNull()
    expect(JSON.parse(ld?.textContent || '{}')['@type']).toBe('Book')
  })

  it('404s on unknown slugs', async () => {
    await expect(VolumePage({ params: Promise.resolve({ volumen: 'nope' }) })).rejects.toThrow('NOT_FOUND')
  })
})
