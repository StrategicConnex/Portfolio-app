import { describe, expect, it } from 'vitest'
import { searchLibraryDocs, createLibraryTool } from '../library'

describe('searchLibraryDocs', () => {
  it('finds IEC 62443 resources with download links', () => {
    const matches = searchLibraryDocs('IEC 62443', { locale: 'es', limit: 3 })
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.length).toBeLessThanOrEqual(3)
    // Nota: el plan traía `toMatch('/api/track/download?f=')`, que RegExp
    // interpreta el `?` como cuantificador y nunca matchea. Se afirma con
    // `toContain`, misma intención y sin escapados frágiles.
    expect(matches[0].downloadUrl).toContain('/api/track/download?f=')
    expect(matches[0].excerpt.length).toBeLessThanOrEqual(300)
  })

  it('filters by volume and returns static provenance through the tool', async () => {
    const tool = createLibraryTool('en')
    const result = (await tool.execute!({ query: 'modbus', volume: 'vol2', limit: 2 }, {})) as {
      data: { matches: unknown[] }
      provenance: Array<{ mode: string }>
    }
    expect(result.data.matches.length).toBeLessThanOrEqual(2)
    expect(result.provenance[0].mode).toBe('static')
  })
})
