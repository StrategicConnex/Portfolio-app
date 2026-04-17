import { NextResponse } from 'next/server'

const KASPERSKY_STATS_URL = 'https://cybermap.kaspersky.com/stats'

type KasperskyStats = {
  success: boolean
  status: number
  source: string
  fetchedAt: string
  title?: string
  attackCount?: string
  rawHtmlSnippet?: string
}

function parseKasperskyHtml(html: string): Partial<KasperskyStats> {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  const title = titleMatch?.[1]?.trim()

  const attackMatch = html.match(/([\d,.]+)\s*(?:attacks|attack attempts|attackers|attacks today|attack rate)/i)
  const attackCount = attackMatch?.[1]?.replace(/\./g, '') || undefined

  let rawHtmlSnippet: string | undefined
  if (title) {
    const titleIndex = html.toLowerCase().indexOf(title.toLowerCase())
    if (titleIndex !== -1) {
      rawHtmlSnippet = html.slice(Math.max(0, titleIndex - 120), titleIndex + title.length + 120)
    }
  }

  return { title, attackCount, rawHtmlSnippet }
}

export async function GET() {
  try {
    const res = await fetch(KASPERSKY_STATS_URL, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js Fetch)'
      },
      cache: 'no-store',
    })

    const html = await res.text()
    const parsed = parseKasperskyHtml(html)

    const payload: KasperskyStats = {
      success: res.ok,
      status: res.status,
      source: KASPERSKY_STATS_URL,
      fetchedAt: new Date().toISOString(),
      ...parsed,
    }

    return NextResponse.json(payload, { status: res.ok ? 200 : 502 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 500,
        source: KASPERSKY_STATS_URL,
        fetchedAt: new Date().toISOString(),
        title: 'Kaspersky live stats unavailable',
      },
      { status: 500 }
    )
  }
}
