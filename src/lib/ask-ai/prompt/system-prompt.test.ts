import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildToolDescriptions } from './system-prompt'

describe('buildToolDescriptions', () => {
  it('renders the Spanish tool guide for es', () => {
    const guide = buildToolDescriptions('es')
    expect(guide).toContain('Guía de Selección de Herramientas:')
    expect(guide).toContain('dnsAnalyzer: Analiza registros DNS')
    expect(guide).toContain('Reglas de Formato de Salida:')
    expect(guide).not.toContain('Tool Selection Guide:')
  })

  it('renders the English tool guide for en', () => {
    const guide = buildToolDescriptions('en')
    expect(guide).toContain('Tool Selection Guide:')
    expect(guide).toContain('dnsAnalyzer: Analyze DNS records')
    expect(guide).toContain('Output Format Rules:')
    expect(guide).not.toContain('Guía de Selección de Herramientas:')
  })

  it('names all six passive analysis tools in both languages', () => {
    const tools = [
      'dnsAnalyzer',
      'sslChecker',
      'httpHeadersAnalyzer',
      'whoisLookup',
      'techStackDetector',
      'portAnalyzer',
    ]
    for (const lang of ['es', 'en'] as const) {
      const guide = buildToolDescriptions(lang)
      for (const tool of tools) {
        expect(guide).toContain(tool)
      }
    }
  })
})

describe('buildSystemPrompt', () => {
  const base = { mode: 'ask', ragContext: '', sources: [] }

  it('sets the language and mode headers', () => {
    const es = buildSystemPrompt({ ...base, language: 'es' })
    expect(es).toContain('You are Tanos AI')
    expect(es).toContain('EL USUARIO ESTÁ NAVEGANDO EN: ES')
    expect(es).toContain('MODO ACTIVO: ASK')

    const en = buildSystemPrompt({ ...base, language: 'en', mode: 'chat' })
    expect(en).toContain('EL USUARIO ESTÁ NAVEGANDO EN: EN')
    expect(en).toContain('MODO ACTIVO: CHAT')
  })

  it('omits the RAG block and the source line when there is no context', () => {
    const prompt = buildSystemPrompt({ ...base, language: 'es' })
    expect(prompt).not.toContain('Contexto del portfolio')
    expect(prompt).not.toContain('IMPORTANTE:')
    expect(prompt).not.toContain('Fuentes disponibles para esta consulta:')
  })

  it('embeds the RAG block and the source line in Spanish', () => {
    const prompt = buildSystemPrompt({
      language: 'es',
      mode: 'ask',
      ragContext: '[FUENTE: IEC 62443-4-2]\nContenido del estándar...',
      sources: [{ title: 'IEC 62443-4-2' }, { title: 'SIEM Dashboard' }],
    })
    expect(prompt).toContain('Contexto del portfolio (usa estas fuentes como referencia factual):')
    expect(prompt).toContain('[FUENTE: IEC 62443-4-2]')
    expect(prompt).toContain('IMPORTANTE:')
    expect(prompt).toContain(
      'No inventes certificaciones, empleadores, métricas o detalles personales que no estén en las fuentes.',
    )
    expect(prompt).toContain('Fuentes disponibles para esta consulta: IEC 62443-4-2, SIEM Dashboard.')
  })

  it('embeds the RAG block and the source line in English', () => {
    const prompt = buildSystemPrompt({
      language: 'en',
      mode: 'ask',
      ragContext: '[SOURCE: Main Certifications]\nContent...',
      sources: [{ title: 'Main Certifications' }],
    })
    expect(prompt).toContain('Portfolio context (use these sources as factual references):')
    expect(prompt).toContain('[SOURCE: Main Certifications]')
    expect(prompt).toContain('IMPORTANT:')
    expect(prompt).toContain(
      'Do not invent certifications, employers, metrics or personal details not present in the sources.',
    )
    expect(prompt).toContain('Available sources for this query: Main Certifications.')
  })

  it('includes the tool guide in the prompt language', () => {
    expect(buildSystemPrompt({ ...base, language: 'es' })).toContain('Guía de Selección de Herramientas:')
    expect(buildSystemPrompt({ ...base, language: 'en' })).toContain('Tool Selection Guide:')
  })

  it('embeds the memory context block verbatim when provided', () => {
    const memoryContext = '\nConversaciones anteriores:\n- IEC 62443: El usuario preguntó: "IEC 62443".\n'
    const prompt = buildSystemPrompt({
      language: 'es',
      mode: 'ask',
      ragContext: '',
      sources: [],
      memoryContext,
    })
    // The pre-localized block is embedded as-is (already trimmed of outer whitespace)
    expect(prompt).toContain('Conversaciones anteriores:')
    expect(prompt).toContain('- IEC 62443: El usuario preguntó: "IEC 62443".')
  })

  it('embeds the English memory context block verbatim when provided', () => {
    const memoryContext = '\nPast conversations:\n- PMP: User asked: "PMP certification?".\n'
    const prompt = buildSystemPrompt({
      language: 'en',
      mode: 'ask',
      ragContext: '',
      sources: [],
      memoryContext,
    })
    expect(prompt).toContain('Past conversations:')
    expect(prompt).toContain('- PMP: User asked: "PMP certification?".')
  })

  it('omits the memory block when no memory context is provided', () => {
    const prompt = buildSystemPrompt({ ...base, language: 'es' })
    expect(prompt).not.toContain('Conversaciones anteriores:')
    expect(prompt).not.toContain('Past conversations:')
  })
})
