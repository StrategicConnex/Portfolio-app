import { describe, it, expect } from 'vitest'
import { datacenter, NODE_LABEL_KEYS } from './datacenter'
import { nodes } from '@/data/mindmap'

describe('datacenter i18n parity (SPEC §14)', () => {
  it('has identical key sets in es and en', () => {
    const esKeys = Object.keys(datacenter.es).sort()
    const enKeys = Object.keys(datacenter.en).sort()
    expect(esKeys).toEqual(enKeys)
    expect(esKeys.length).toBeGreaterThan(0)
  })

  it('has no empty or key-echoing values (t(key) must never return the key)', () => {
    for (const lang of ['es', 'en'] as const) {
      for (const [key, value] of Object.entries(datacenter[lang])) {
        expect(value.trim().length).toBeGreaterThan(0)
        expect(value).not.toBe(key)
      }
    }
  })

  it('NODE_LABEL_KEYS covers every node label in src/data/mindmap.ts', () => {
    for (const n of nodes) {
      expect(NODE_LABEL_KEYS[n.label]).toBeDefined()
    }
  })

  it('every NODE_LABEL_KEYS target exists in both languages', () => {
    for (const key of Object.values(NODE_LABEL_KEYS)) {
      expect(datacenter.es[key]).toBeDefined()
      expect(datacenter.en[key]).toBeDefined()
    }
  })
})
