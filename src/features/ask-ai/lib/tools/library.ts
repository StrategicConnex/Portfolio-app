import { z } from 'zod'
import { RECURSO_FILES, recursoDownloadHref } from '@/data/recursos'
import RECURSOS_TEXT from '@/data/recursos-text.json'
import { tokenize } from '@/features/ask-ai/lib/rag/tokenizer'
import { translations } from '@/context/translations'
import type { ToolResult } from './result'

const VOLUMES = ['vol1', 'vol2', 'vol3', 'vol4', 'vol5', 'standards', 'project'] as const

export const librarySearchSchema = z.object({
  query: z.string().min(1).max(120),
  volume: z.enum(VOLUMES).optional(),
  limit: z.number().int().min(1).max(5).optional().default(3),
})

export interface LibraryMatch {
  title: string
  category: string
  excerpt: string
  downloadUrl: string
}

const TEXT = RECURSOS_TEXT as Record<string, string>

export function searchLibraryDocs(
  query: string,
  options: { locale: 'es' | 'en'; volume?: (typeof VOLUMES)[number]; limit?: number },
): LibraryMatch[] {
  const tokens = tokenize(query)
  const limit = options.limit ?? 3

  const scored = RECURSO_FILES
    .filter((doc) => !options.volume || doc.category === options.volume)
    .map((doc) => {
      const title = translations[options.locale][doc.labelKey ?? ''] ?? doc.fallback
      const text = TEXT[doc.path] ?? ''
      const haystack = `${title} ${text}`.toLowerCase()
      let score = 0
      for (const token of tokens) if (haystack.includes(token)) score += 1
      if (title.toLowerCase().includes(query.toLowerCase())) score += 3
      return { doc, title, text, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)

  return scored.map(({ doc, title, text }) => ({
    title,
    category: doc.category,
    excerpt: text.replace(/\s+/g, ' ').trim().slice(0, 300),
    downloadUrl: recursoDownloadHref(doc.path),
  }))
}

export interface LibraryTool {
  description: string
  inputSchema: typeof librarySearchSchema
  execute: (
    input: z.input<typeof librarySearchSchema>,
    options?: unknown,
  ) => Promise<ToolResult<{ matches: LibraryMatch[] }>>
}

export function createLibraryTool(locale: 'es' | 'en'): LibraryTool {
  return {
    description:
      'Search the 61 downloadable IT/OT documents (guides, templates, standards). Returns title, category, a short excerpt and a download link. Use it whenever the user asks about a specific resource or volume.',
    inputSchema: librarySearchSchema,
    execute: async (
      input: z.input<typeof librarySearchSchema>,
    ): Promise<ToolResult<{ matches: LibraryMatch[] }>> => {
      const matches = searchLibraryDocs(input.query, {
        locale,
        volume: input.volume,
        limit: input.limit,
      })
      return {
        data: { matches },
        provenance: [{ source: 'IT/OT Library', mode: 'static' }],
      }
    },
  }
}
