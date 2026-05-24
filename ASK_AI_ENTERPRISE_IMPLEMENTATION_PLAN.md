# Plan de Implementacion Enterprise Ask AI para juanpalacios.vercel.app

> Documento operativo para Google Antigravity con Gemini 3.x Flash / Gemini 3.1 Flash.  
> Objetivo: reemplazar `Nacho Assistant` por un AI Cybersecurity Copilot Enterprise inspirado en la experiencia Ask AI de Cloudflare, optimizado para Next.js, Vercel, streaming, RAG, tools y futura arquitectura agent-first.

---

## 0. Auditoria del Codigo Actual

### Estado verificado

| Area | Hallazgo | Evidencia | Impacto |
|---|---|---|---|
| Framework | El repo usa Next.js `16.2.3`, React `19.2.4`, Tailwind v4 y Framer Motion. | `package.json` | El plan debe apuntar a App Router moderno. No asumir Next 15 en codigo aunque el objetivo lo mencione. |
| Chat UI | El asistente actual vive en un unico componente cliente. | `src/components/AIConsultant.tsx` | Debe dividirse en componentes, hooks, store, renderers y panels. |
| API AI | `/api/chat` llama directo a OpenRouter y parsea SSE estilo OpenAI manualmente. | `src/app/api/chat/route.ts` | Conviene migrar a Vercel AI SDK y UIMessage streams. |
| Modelo actual | Usa `google/gemini-2.0-flash-001`. | `route.ts` | Debe actualizarse a Gemini 3.x Flash / proveedor via AI SDK. |
| Seguridad | Rate limiting en memoria con `Map`. | `route.ts` | No es valido para serverless distribuido; pasar a Upstash Redis o Vercel KV. |
| Markdown | El UI renderiza `msg.content` como texto plano. | `AIConsultant.tsx` | No soporta markdown, codigo, tablas, citas ni tool parts. |
| Persistencia | Las conversaciones solo viven en `useState`. | `AIConsultant.tsx` | Debe agregarse session/history persistence. |
| i18n | Existe `LanguageContext` ES/EN y el chat recibe `language`. | `src/context/LanguageContext.tsx` | Reutilizar como fuente inicial del locale. |
| Montaje | `AIConsultant` se importa dinamicamente en la home. | `src/app/page.tsx` | Mantener lazy loading y reemplazar por `AskAICopilotShell`. |
| CSP | CSP actual permite `self`, Vercel scripts y `scaudit.vercel.app`. | `next.config.ts` | Habra que abrir dominios de AI Gateway, PostHog, Sentry, Upstash o APIs autorizadas. |
| Verificacion | `npm run lint` y `npm run build` completan correctamente. | ejecucion local | Buen punto de partida. |

### Brechas principales

1. El asistente actual es correcto como widget liviano, pero no como copiloto enterprise.
2. La API actual acopla proveedor, formato de stream, prompt y rate limit en un solo archivo.
3. No hay capa agentic: no existe planner, router, tool registry, approval flow ni memoria.
4. No hay RAG: el conocimiento esta incrustado en el system prompt.
5. No hay observabilidad AI: no se registran tokens, latencia, costo, tool calls ni fallos por etapa.
6. No hay UX tipo Ask AI: falta layout de panel amplio, source cards, suggested prompts, estados de ejecucion, modo tool, citas y streaming markdown.
7. La documentacion interna esta desactualizada en algunos puntos: README menciona Next 15 y el prompt menciona Next.js 14 dentro del system prompt actual.

---

## 1. Vision General del Sistema

### Filosofia del producto

Construir un **AI Infrastructure & Cybersecurity Copilot** que no se sienta como un widget de soporte, sino como una consola tecnica premium para visitantes, reclutadores, clientes de consultoria y perfiles tecnicos. La experiencia debe comunicar tres ideas:

| Dimension | Resultado esperado |
|---|---|
| Autoridad | El copiloto responde con criterio de arquitectura IT/OT, ciberseguridad, OSINT, redes, cloud y cumplimiento. |
| Confianza | Cada respuesta compleja debe poder citar fuentes internas del portfolio, CV, blog, casos, stack o resultados de tools. |
| Capacidad | El sistema puede razonar, recuperar contexto, ejecutar herramientas y presentar artefactos tecnicos. |

### Experiencia objetivo

El usuario abre una interfaz compacta, precisa y sobria. No ve "un chatbot". Ve un **copilot command surface**:

- Barra de entrada con foco inmediato y prompts sugeridos.
- Streaming rapido con markdown enriquecido.
- Panel de fuentes y contexto recuperado.
- Tool cards con estados: `queued`, `running`, `completed`, `blocked`, `requires approval`.
- Respuestas escaneables, con secciones cortas y tecnicas.
- Modo bilingue automatico segun el idioma activo y el idioma del usuario.
- Sensacion visual inspirada en Cloudflare Ask AI: fondo claro/oscuro sobrio, bordes finos, tarjetas limpias, jerarquia clara, mensajes no excesivamente burbujeantes, foco en respuesta y fuentes.

### Enfoque agent-first

El sistema no debe ser "prompt + respuesta". Debe ser:

```text
User intent
  -> Intent router
  -> Context manager
  -> Retrieval agent
  -> Planner agent
  -> Tool selection
  -> Safe execution
  -> Response composer
  -> UI streaming with citations
  -> Telemetry + memory update
```

### Diferenciadores premium

| Diferenciador | Implementacion |
|---|---|
| Ask AI style | Layout tipo comando, sugerencias, fuentes, citas, tarjetas de resultado, tool traces plegables. |
| Cybersecurity native | Tools DNS/SSL/WHOIS/headers/ports/OSINT, prompts con IEC 62443/NIST/IT-OT. |
| Edge-first | Route handlers streaming, runtime edge donde no haya dependencias Node-only, cache y rate limit distribuido. |
| Agentic expandable | Tool registry y agents modulares desde el dia 1. |
| RAG real | Indexacion del portfolio, CV, blog, datos, servicios y FAQs en vector DB. |
| Observabilidad | Token/cost/latency/tool telemetry por request y por conversacion. |

### Como replicar la sensacion Cloudflare Ask AI

No copiar marca ni assets. Replicar patrones:

- Superficie limpia, tecnica y muy legible.
- El input es el centro del sistema, no un campo secundario.
- Las respuestas aparecen como documentos vivos, no como globos de chat pesados.
- Las fuentes se ven como evidencia: cards pequenas con titulo, tipo, score y link interno.
- Los tool calls no son ruido: se muestran como pasos operativos auditables.
- El movimiento es funcional: fade/slide corto, skeleton, streamed text, no exceso de glow.
- Paleta con base neutral, acento naranja/cloudflare-like usado con moderacion y compatibilidad con la identidad actual azul/dorado.

---

## 2. Arquitectura General

### Diagrama macro

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Browser                                                                      │
│                                                                              │
│  ┌───────────────────────────┐     ┌───────────────────────────────────────┐ │
│  │ Portfolio Page             │     │ AskAICopilotShell                     │ │
│  │ Hero/Profile/SIEM/etc.     │     │ - launcher                            │ │
│  └─────────────┬─────────────┘     │ - command panel                       │ │
│                │                   │ - message stream                       │ │
│                │                   │ - sources/tools sidebar                │ │
│                │                   │ - prompt input                         │ │
│                │                   └───────────────┬───────────────────────┘ │
│                │                                   │ useChat / UIMessage      │
└────────────────┼───────────────────────────────────┼──────────────────────────┘
                 │                                   │
                 ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Next.js App Router on Vercel                                                 │
│                                                                              │
│  ┌──────────────────────┐   ┌─────────────────────────────────────────────┐  │
│  │ Server Components     │   │ /api/ask-ai/route.ts                        │  │
│  │ static portfolio      │   │ - validation                                │  │
│  │ cached content        │   │ - rate limit                                │  │
│  └──────────────────────┘   │ - auth/session optional                     │  │
│                              │ - agent orchestration                       │  │
│                              │ - UIMessage stream response                 │  │
│                              └───────────────┬─────────────────────────────┘  │
└──────────────────────────────────────────────┼────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ AI Orchestration Layer                                                       │
│                                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Intent Router │  │ Context Mgr    │  │ Retrieval Agent │  │ Planner Agent │ │
│  └──────┬───────┘  └───────┬───────┘  └────────┬───────┘  └──────┬────────┘ │
│         │                  │                   │                 │          │
│         ▼                  ▼                   ▼                 ▼          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ToolLoopAgent / streamText                                             │ │
│  │ - model routing                                                        │ │
│  │ - tools                                                                │ │
│  │ - stop conditions                                                      │ │
│  │ - safety middleware                                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
       │                         │                         │
       ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌──────────────────────────┐
│ RAG Layer      │       │ Tools Layer      │       │ Observability            │
│ Vector DB      │       │ DNS/SSL/WHOIS    │       │ Sentry/PostHog/OTel      │
│ reranking      │       │ Headers/OSINT    │       │ token/cost/tool logs     │
└───────────────┘       └─────────────────┘       └──────────────────────────┘
       │                         │                         │
       ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌──────────────────────────┐
│ Storage        │       │ External APIs    │       │ Analytics Store          │
│ Supabase       │       │ RDAP/CT/DNS      │       │ PostHog/Sentry/DB        │
│ pgvector       │       │ safe fetch       │       │ dashboards               │
│ Upstash Redis  │       │ allowlist        │       │                          │
└───────────────┘       └─────────────────┘       └──────────────────────────┘
```

### Capas

| Capa | Responsabilidad | Tecnologia recomendada |
|---|---|---|
| Frontend | UI premium, streaming, markdown, tool cards, responsive shell. | Next.js App Router, React 19, Tailwind v4, Framer Motion, AI Elements, shadcn/ui. |
| Backend | Validacion, rate limiting, orchestration, response streaming. | Route handlers, Vercel AI SDK, Edge/Node split. |
| AI orchestration | Routing, planning, tools, RAG, memory injection. | Vercel AI SDK v6 `ToolLoopAgent`, `streamText`, middleware. |
| RAG | Ingestion, chunks, embeddings, retrieval, reranking. | Supabase pgvector o Upstash Vector; OpenAI embeddings directas si AI Gateway no cubre embeddings. |
| Streaming | UIMessage stream, partial render, tool part streaming. | `toUIMessageStreamResponse`, `useChat`, SSE. |
| Memory | session + long-term semantic summaries. | Local session store + Supabase/Upstash. |
| Tools | DNS, SSL, WHOIS/RDAP, headers, stack detect, OSINT. | AI SDK tools con Zod schemas, allowlists y timeouts. |
| Observability | traces, tokens, costs, tool latency. | Sentry, PostHog, OpenTelemetry, AI Gateway logs. |
| Security | abuse prevention, injection defense, CSP, RBAC futuro. | Upstash rate limit, Zod, allowlist, CSP, tool sandboxing. |

---

## 3. Stack Tecnologico Recomendado

### Stack base

| Categoria | Seleccion | Decision |
|---|---|---|
| Framework | Next.js actual del repo: `16.2.3` | No bajar a Next 15. El prompt puede decir "Next.js 15+", pero Gemini debe implementar sobre Next 16 real. |
| React | React `19.2.4` | Compatible con App Router moderno; cuidar `useRef(null)` y client boundaries. |
| Styling | Tailwind CSS v4 | Ya instalado; extender tokens en `globals.css`. |
| UI primitives | shadcn/ui | Instalar solo componentes necesarios: Button, Dialog/Sheet, ScrollArea, Badge, Separator, Tooltip, Tabs. |
| AI UI | AI Elements | Instalar `message`, `conversation`, `tool`, `code-block`, `sources`, `suggestion`, `prompt-input`. |
| Animacion | Framer Motion | Ya instalado; usar micro-motion sobrio. |
| Icons | lucide-react | Ya instalado; mantener. |
| Chat SDK | Vercel AI SDK v6 | `ai`, `@ai-sdk/react`; usar UIMessage stream, tools, agents. |
| Model routing | Vercel AI Gateway o Google provider directo | Preferir Gateway en Vercel por observabilidad/failover; fallback directo a Google si falta modelo. |
| Primary model | Gemini 3.x Flash | En Antigravity usar Gemini 3.x/3.1 Flash. En API oficial ver `gemini-3-flash-preview`; ajustar al provider disponible. |
| Embeddings | OpenAI `text-embedding-3-small` o Google embeddings directos | AI Gateway puede no cubrir embeddings; usar provider directo. |
| Vector DB | Supabase pgvector inicialmente | Encaja con SQL + metadata + conversaciones. Upstash Vector si se busca edge KV-like. |
| Cache/rate limit | Upstash Redis | Distribuido, serverless friendly. |
| Client state | Zustand | Estado de panel, modo, preferencias, selected source/tool. |
| Server state | TanStack React Query | Solo si hay history/listados; no para el stream principal. |
| Markdown | AI Elements/Streamdown + Shiki | Evitar render manual. |
| Observabilidad | Sentry + PostHog + OTel | Errores, funnels, traces, token/cost events. |

### Dependencias a agregar

```bash
npm install ai@^6 @ai-sdk/react@^3 zod zustand @tanstack/react-query
npm install @upstash/redis @upstash/ratelimit
npm install @sentry/nextjs posthog-js posthog-node
npm install shiki rehype-slug rehype-autolink-headings remark-gfm
npm install @supabase/supabase-js
npx shadcn@latest init
npx ai-elements@latest add message conversation tool code-block prompt-input sources suggestion
```

### Ventajas / desventajas

| Opcion | Ventajas | Desventajas | Decision |
|---|---|---|---|
| Vercel AI SDK | Streaming y tools estandarizados, UIMessage, agentes, provider routing. | Requiere migrar formato actual. | Usar. |
| OpenRouter directo | Simple y ya funciona. | Acoplamiento, menor UX con tools/UIMessage, observabilidad limitada. | Mantener solo como fallback temporal. |
| Supabase pgvector | Conversaciones + memoria + vectores en una DB. | Latencia mayor que vector edge puro. | Ideal fase 2-3. |
| Upstash Vector | Simple y rapido para retrieval edge. | Menos flexible para datos relacionales. | Alternativa si no se necesita DB relacional. |
| Pinecone | Enterprise vector DB madura. | Mas infra/costo para portfolio. | Fase futura. |

---

## 4. Diseno UX/UI Exacto

### Layout

Reemplazar widget pequeno por **Command Copilot Surface** con tres modos:

| Modo | Desktop | Mobile |
|---|---|---|
| Floating minimized | Boton inferior derecho 56x56. | Boton inferior derecho 52x52. |
| Compact panel | 460x680, right dock. | Full-screen sheet. |
| Expanded Ask AI | 880-1040px wide, centered/docked, con sidebar de fuentes. | Full-screen, tabs `Chat` / `Sources` / `Tools`. |

### Composicion visual

```text
┌───────────────────────────────────────────────────────────────┐
│ Top bar: Ask Juan AI · Cybersecurity Copilot       status  esc │
├───────────────────────────────────────────────────────────────┤
│ Suggested prompts / modes                                      │
│ [Analyze my OT network] [Explain services] [Check domain]      │
├───────────────────────────────────────────┬───────────────────┤
│ Conversation stream                        │ Context sidebar   │
│                                           │ Sources           │
│ User prompt                                │ - CV              │
│ Assistant response                         │ - Portfolio       │
│ Tool card: DNS analyzer                    │ - Blog            │
│ Markdown + code + citations                │                   │
│ Follow-up questions                        │ Tool timeline     │
├───────────────────────────────────────────┴───────────────────┤
│ Input: Ask about IT/OT, OSINT, services, DNS, SSL...       send │
└───────────────────────────────────────────────────────────────┘
```

### Tokens visuales

| Token | Valor |
|---|---|
| Background principal | `#07111F` / `#0A192F` integrado con el sitio actual. |
| Surface | `rgba(8, 16, 29, 0.92)` |
| Surface elevated | `rgba(15, 23, 42, 0.92)` |
| Border subtle | `rgba(148, 163, 184, 0.16)` |
| Border focus | `rgba(249, 115, 22, 0.58)` |
| Accent Cloudflare-like | `#F97316` |
| Accent portfolio blue | `#1E90FF` |
| Accent gold | `#C5A46D` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Text primary | `#F8FAFC` |
| Text secondary | `#CBD5E1` |
| Text muted | `#94A3B8` |
| Code bg | `#020617` |

### Borders, sombras y blur

```css
--ask-radius: 14px;
--ask-radius-sm: 8px;
--ask-border: 1px solid rgba(148, 163, 184, 0.16);
--ask-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
--ask-blur: blur(20px);
```

Reglas:

- Usar glass con moderacion; superficie legible primero.
- Cards con radio maximo 8-12px.
- No usar globos gigantes tipo soporte.
- Respuestas en columnas de lectura de 68-76 caracteres.
- Code blocks con header, lenguaje y boton copy.

### Interaction states

| Elemento | Normal | Hover | Focus | Disabled |
|---|---|---|---|---|
| Launcher | `bg-slate-950`, border orange/blue tenue | scale 1.03, glow controlado | ring orange | opacity 0.6 |
| Input | border slate | border orange/40 | ring 2 orange/30 | cursor not-allowed |
| Suggested prompt | bg transparent | bg white/6 | outline orange | hidden if streaming |
| Tool card | collapsed row | border blue/orange | keyboard expandable | none |
| Source card | subtle | highlight source | outline | none |

### Motion system

| Accion | Duracion | Easing |
|---|---:|---|
| Open panel | 180ms | `easeOut` |
| Close panel | 140ms | `easeIn` |
| Stream cursor | continuous | opacity pulse |
| Tool state transition | 160ms | spring low bounce |
| Source hover | 120ms | linear/ease |

Respetar `prefers-reduced-motion` ya definido en `globals.css`.

---

## 5. Arquitectura de Componentes

```text
src/
  components/
    ask-ai/
      AskAICopilotShell.tsx
      AskAILauncher.tsx
      AskAIPanel.tsx
      AskAIHeader.tsx
      AskAIModeTabs.tsx
      AskAIConversation.tsx
      AskAIMessage.tsx
      AskAIPromptInput.tsx
      AskAISuggestionBar.tsx
      AskAISourcesPanel.tsx
      AskAIToolTimeline.tsx
      AskAIStatusPill.tsx
      AskAIErrorBoundary.tsx
      AskAIEmptyState.tsx
    ask-ai/tools/
      ToolCallCard.tsx
      DnsResultCard.tsx
      SslResultCard.tsx
      WhoisResultCard.tsx
      HeadersResultCard.tsx
      OsintResultCard.tsx
    ai-elements/
      message.tsx
      conversation.tsx
      tool.tsx
      code-block.tsx
      prompt-input.tsx
      sources.tsx
```

| Componente | Responsabilidad |
|---|---|
| `AskAICopilotShell` | Orquestar estado abierto/expandido, provider de chat, responsive mode. |
| `AskAILauncher` | Boton flotante premium, badge de disponibilidad y shortcut. |
| `AskAIPanel` | Layout principal, resize/expanded mode, mobile full-screen. |
| `AskAIHeader` | Branding, modo, status, acciones: clear, expand, close. |
| `AskAIModeTabs` | Modos: `Ask`, `Analyze`, `OSINT`, `Services`, `Contact`. |
| `AskAIConversation` | Render de mensajes con AI Elements Conversation. |
| `AskAIMessage` | Wrapper visual sobre AI Elements Message para estilo propio. |
| `AskAIPromptInput` | Textarea auto-grow, submit, stop, attachments futuro. |
| `AskAISuggestionBar` | Prompts contextualizados por idioma y seccion del portfolio. |
| `AskAISourcesPanel` | Fuentes RAG, citas, score, links internos. |
| `AskAIToolTimeline` | Ejecuciones tool con latencia, estado y errores. |
| `AskAIStatusPill` | Online, retrieval, executing tool, streaming, degraded. |
| `ToolCallCard` | Renderer generico de tool parts. |

---

## 6. Sistema de Chat

### Flujo completo

```text
User types prompt
  -> local optimistic UI appends user UIMessage
  -> /api/ask-ai validates payload
  -> rate limit and abuse checks
  -> classify intent
  -> retrieve portfolio context
  -> optional tool planning
  -> stream assistant UIMessage parts
  -> render markdown incrementally
  -> render tool calls as structured cards
  -> persist conversation summary
  -> emit analytics and traces
```

### Requisitos de chat

| Requisito | Implementacion |
|---|---|
| Streaming | `useChat` + `DefaultChatTransport` + `toUIMessageStreamResponse`. |
| Optimistic UI | Agregar user message al instante; mostrar status `submitted`. |
| Token streaming | Usar AI Elements `Message` / `MessageMarkdown`. |
| Markdown | `MessageResponse` / AI Elements, GFM, code blocks. |
| Code rendering | `code-block` + Shiki. |
| Citations | Tool/RAG metadata como `sources` renderizadas en sidebar y en inline citations. |
| Follow-ups | Generar 3 prompts breves al final cuando `finishReason === stop`. |
| History | `localStorage` fase 1; Supabase fase 3. |
| Stop/interrupt | `stop()` de `useChat`; abort controller server-side. |
| Regenerate | Reenviar ultimo user message con same conversation id. |

### Contrato de mensaje

```ts
type AskAIChatRequest = {
  conversationId?: string
  locale: 'es' | 'en'
  mode: 'ask' | 'analyze' | 'osint' | 'services' | 'contact'
  messages: UIMessage[]
  clientContext?: {
    currentSection?: string
    pathname: string
    timezone?: string
  }
}
```

---

## 7. Sistema Agent-First

### Agentes

| Agente | Rol | Input | Output |
|---|---|---|---|
| Orchestrator Agent | Decide ruta, herramientas y composicion final. | user intent + memory + retrieved context | streamed response / tool calls |
| Context Manager | Arma contexto compacto y seguro. | session, profile, language, section | context packet |
| Retrieval Agent | Busca documentos y fuentes internas. | query + mode + locale | ranked chunks |
| Planner Agent | Planifica pasos si hay analisis/tool usage. | intent + retrieved context | steps JSON |
| Execution Agent | Ejecuta tools permitidas. | tool call schema | structured output |
| Memory Manager | Resume y persiste aprendizajes no sensibles. | conversation transcript | memory entries |
| Safety Agent | Filtra prompt injection y abuso. | prompt + retrieved chunks + tool args | allow/block/transform |

### Routing

```text
Intent classifier
├─ profile_question -> RAG portfolio only
├─ service_question -> RAG + service composer
├─ technical_explain -> RAG + technical answer
├─ domain_analysis -> DNS/SSL/headers tools with approval threshold
├─ osint_request -> OSINT tools, strict safety
├─ contact_request -> contact guidance, no tool by default
└─ unsafe_request -> refusal + safe alternative
```

### Delegation

- El orchestrator no ejecuta herramientas directamente sin schema.
- Cada tool debe tener Zod input/output schema.
- Tool calls externos deben tener timeout maximo 8-12s.
- Tools potencialmente intrusivas requieren aprobacion o se limitan a informacion publica pasiva.
- Para Gemini Flash, dividir tareas complejas en pasos deterministas y no pedir razonamiento largo oculto.

---

## 8. Sistema de Tools

### Tool registry

```text
src/lib/ask-ai/tools/
  registry.ts
  dns-analyzer.ts
  ssl-checker.ts
  whois-rdap.ts
  http-headers.ts
  tech-stack-detector.ts
  osint-search.ts
  port-analyzer.ts
  schemas.ts
```

### Tools premium

| Tool | Tipo | Seguridad | Output |
|---|---|---|---|
| `dnsAnalyzer` | Pasivo | Allowlist domain validation, no private IP targets. | A/AAAA/MX/TXT/NS, SPF/DMARC/DKIM hints. |
| `sslChecker` | Pasivo | HTTPS only, timeout, no cert brute force. | issuer, expiry, SAN, TLS hints. |
| `whoisLookup` | Pasivo | RDAP preferred, rate limit. | registrar, dates, nameservers. |
| `httpHeadersAnalyzer` | Pasivo | GET/HEAD only, max redirects 3. | CSP, HSTS, XFO, security score. |
| `techStackDetector` | Pasivo | Fetch limited HTML headers only. | framework hints, CDN, server. |
| `osintSearch` | Pasivo | No scraping aggressive, no personal data enrichment. | public links + caveats. |
| `portAnalyzer` | Restringido | Deshabilitado por defecto o solo explain-mode. | educational guidance; no active scanning en prod sin autorizacion. |

### Modelo de ejecucion

```text
tool call
  -> validate schema
  -> policy check
  -> rate limit by tool
  -> safe fetch wrapper
  -> timeout
  -> normalize output
  -> redact secrets
  -> emit telemetry
  -> return structured result to model and UI
```

### Sandboxing

- No ejecutar shell desde el sitio.
- No permitir URLs internas: `localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, link-local, metadata IPs.
- No seguir redirects a IP privada.
- No escanear puertos activos desde Vercel para terceros sin confirmacion legal.
- OSINT solo con APIs publicas y limites claros.

---

## 9. Sistema RAG

### Documentos fuente

| Fuente | Ingestion |
|---|---|
| `src/context/LanguageContext.tsx` | Extraer textos ES/EN normalizados. |
| `src/data/*.ts/json` | Indexar casos, blog, audit, experiencia, stack. |
| `public/CV-JuanFelipePalacios.pdf` | Parse PDF a texto, separar secciones. |
| README/SRS | Indexar solo metadata util, no como fuente principal. |
| Pagina renderizada | Opcional: crawler interno post-build para chunks por seccion. |

### Estructura de chunk

```ts
type RagDocumentChunk = {
  id: string
  source: 'portfolio' | 'cv' | 'blog' | 'case-study' | 'audit' | 'service' | 'srs'
  locale: 'es' | 'en'
  title: string
  section: string
  content: string
  url?: string
  metadata: {
    tags: string[]
    priority: number
    lastUpdated: string
    piiLevel: 'public' | 'restricted'
  }
  embedding: number[]
}
```

### Pipeline

```text
npm run ask-ai:index
  -> load sources
  -> normalize language
  -> split into semantic chunks 350-700 tokens
  -> attach metadata
  -> generate embeddings
  -> upsert vector DB
  -> write index report
```

### Retrieval

```text
query
  -> rewrite query for ES/EN
  -> vector search topK 12
  -> metadata filter by locale + public
  -> rerank topK 5
  -> deduplicate by section
  -> prompt context packet
  -> source cards in UI
```

### Prompt assembly

Orden:

1. Safety policy.
2. Role and tone.
3. Locale.
4. User intent.
5. Conversation summary.
6. Retrieved sources.
7. Tool results.
8. User message.
9. Output contract.

---

## 10. Sistema de Memoria

| Tipo | Duracion | Storage | Uso |
|---|---|---|---|
| Short-term | Conversacion actual | UI messages | Continuidad inmediata. |
| Session memory | Browser session | localStorage/sessionStorage | Recordar modo, ultimos prompts. |
| Conversation summary | Persistente opcional | Supabase | Resumir hilos para usuarios recurrentes. |
| Semantic memory | Persistente controlada | Vector DB | Preferencias generales no sensibles. |
| Tool memory | TTL corto | Upstash Redis | Cache DNS/SSL/headers. |

### Reglas de memoria

- No guardar datos sensibles de terceros.
- No guardar secretos, emails completos ni tokens.
- Resumir cada 8-12 turnos.
- Purgar memorias antiguas o de baja utilidad.
- Separar `public portfolio facts` de `user-specific memory`.

---

## 11. Sistema de Streaming

### Arquitectura

```text
Client useChat
  -> POST /api/ask-ai
  -> streamText / ToolLoopAgent stream
  -> UIMessage stream
  -> browser renders message parts incrementally
  -> tool parts update independently
```

### Requisitos

| Tema | Decision |
|---|---|
| Protocolo | SSE / UIMessage stream. |
| Runtime | Edge para chat basico; Node para tools que lo requieran. Separar rutas si es necesario. |
| Partial rendering | AI Elements MessageMarkdown. |
| Interruption | Client `stop()`, server abort signal, graceful partial answer. |
| Reconnect | Reintento para history fetch, no para streams ya abortados. |
| Backpressure | No hacer `setState` manual por token; usar AI SDK stream. |

### Performance

- TTFB de stream objetivo: `< 800ms` en cache/RAG simple.
- Primer token objetivo: `< 1.5s` con retrieval.
- Tool cards deben aparecer antes del resultado final.
- Cachear retrieval frecuente y tool outputs con TTL.

---

## 12. Performance Enterprise

| Objetivo | Meta |
|---|---:|
| LCP portfolio | `< 2.5s` |
| CLS | `< 0.05` |
| INP | `< 180ms` |
| Chat panel open | `< 120ms` perceived |
| Stream TTFB | `< 800ms` simple / `< 1500ms` RAG |
| API timeout | 25-30s max con respuesta parcial o error elegante |

### Optimizaciones

- Mantener portfolio como shell mayormente static.
- Lazy load del copiloto y tools.
- Separar `AskAICopilotShell` client del resto server/static.
- Virtualizar mensajes si history > 50.
- Usar Suspense para history/sidebar.
- Memoizar source cards y tool result renderers.
- Importar Shiki/code renderer solo cuando haya code blocks.
- No cargar dependencias RAG/client DB en el bundle del browser.

---

## 13. Seguridad

### Controles

| Riesgo | Control |
|---|---|
| Spam/costo AI | Upstash rate limit por IP/session, daily quota, captcha opcional Turnstile. |
| Prompt injection | Separar retrieved context como datos no confiables; instrucciones de no obedecer fuentes. |
| SSRF via tools | URL validator, DNS resolution guard, private IP block, redirect guard. |
| Abuso OSINT | Pasivo-only, disclaimers, no doxxing, no cred harvesting. |
| Secret leakage | Redaction middleware, no logs de env vars, no prompt con secretos. |
| XSS markdown | Renderer seguro, rehype sanitization si se customiza. |
| CSP | Actualizar `connect-src` para APIs necesarias; mantener `frame-ancestors 'none'`. |
| Tool permissions | `needsApproval` para acciones sensibles. |
| Auth futuro | RBAC para modo avanzado/clientes. |

### Headers

Actualizar `next.config.ts` cuando se agreguen vendors:

```text
connect-src 'self'
  https://api.openrouter.ai
  https://*.ingest.sentry.io
  https://*.posthog.com
  https://*.upstash.io
  https://vitals.vercel-insights.com
```

Mantener CSP estricta; no relajar a `*`.

---

## 14. Observabilidad

### Eventos minimos

| Evento | Campos |
|---|---|
| `ask_ai_opened` | locale, mode, viewport, section |
| `ask_ai_message_sent` | conversationId, mode, chars, hasToolIntent |
| `ask_ai_stream_started` | provider, model, retrievalMs |
| `ask_ai_stream_completed` | totalMs, tokensIn, tokensOut, finishReason |
| `ask_ai_tool_called` | toolName, status, latencyMs, errorCode |
| `ask_ai_rag_retrieved` | queryHash, topK, sourceTypes, latencyMs |
| `ask_ai_error` | stage, status, providerError, traceId |

### Trace waterfall

```text
request
  validate.input
  rate_limit.check
  safety.precheck
  intent.classify
  rag.retrieve
  agent.stream
    model.call
    tool.call.*
  safety.postcheck
  persist.summary
  analytics.emit
```

---

## 15. Roadmap de Implementacion

### Fase 1 - Foundation UI + AI SDK stream

| Item | Detalle |
|---|---|
| Objetivo | Reemplazar widget monolitico por shell Ask AI modular con streaming AI SDK. |
| Subtareas | Instalar AI SDK, AI Elements y shadcn minimo; crear `components/ask-ai`; crear `/api/ask-ai`; mantener `/api/chat` temporalmente. |
| Dependencias | `ai`, `@ai-sdk/react`, AI Elements, shadcn primitives. |
| Riesgos | Incompatibilidades shadcn/Tailwind v4; CSP para provider. |
| Validaciones | `npm run lint`, `npm run build`, prueba manual streaming ES/EN. |
| Metricas | panel open time, first token, error rate. |

### Fase 2 - UX premium Ask AI

| Item | Detalle |
|---|---|
| Objetivo | Lograr experiencia visual tipo Cloudflare Ask AI sin perder identidad IT/OT del portfolio. |
| Subtareas | Expanded panel, suggestions, source/sidebar placeholder, code blocks, copy, stop/regenerate, responsive full-screen. |
| Dependencias | AI Elements `sources`, `suggestion`, `code-block`. |
| Riesgos | Sobrecargar mobile; exceso de glass/glow. |
| Validaciones | Playwright desktop/mobile, contraste, keyboard navigation. |
| Metricas | engagement, prompts clicked, bounce after open. |

### Fase 3 - RAG real del portfolio

| Item | Detalle |
|---|---|
| Objetivo | Sacar conocimiento del system prompt y convertirlo en retrieval verificable. |
| Subtareas | Crear ingestion pipeline, parse data/context/CV, vector DB, retrieval API, citations. |
| Dependencias | Supabase/Upstash Vector, embeddings. |
| Riesgos | Chunks duplicados, respuestas sin cita, costos de embedding. |
| Validaciones | Golden questions: experiencia, servicios, IEC 62443, Security Onion, contacto, CV. |
| Metricas | citation coverage > 80%, retrieval latency < 300ms cache / < 900ms cold. |

### Fase 4 - Agent-first tools

| Item | Detalle |
|---|---|
| Objetivo | Agregar herramientas pasivas de ciberseguridad y OSINT seguro. |
| Subtareas | Registry, DNS, SSL, HTTP headers, WHOIS/RDAP, tech stack detector, tool cards. |
| Dependencias | Safe fetch wrapper, Upstash rate limit. |
| Riesgos | SSRF, abuso, latencia externa, terminos de APIs. |
| Validaciones | Tests unitarios de validators, block private IPs, timeout behavior. |
| Metricas | tool success rate, p95 latency, blocked unsafe calls. |

### Fase 5 - Enterprise hardening

| Item | Detalle |
|---|---|
| Objetivo | Produccion real: observabilidad, memoria, costos, dashboards, safety. |
| Subtareas | Sentry, PostHog, OTel traces, cost tracking, memory summaries, admin config, fallback providers. |
| Dependencias | Sentry/PostHog env, DB migrations. |
| Riesgos | PII retention, logging excesivo, costos AI. |
| Validaciones | chaos tests provider down, rate limit, bad prompts, tool API timeout. |
| Metricas | p95 end-to-end, monthly cost cap, error budget. |

---

## 16. Estructura de Archivos

```text
src/
  app/
    api/
      ask-ai/
        route.ts
      ask-ai-tools/
        route.ts
    page.tsx
    layout.tsx
    globals.css
  components/
    ask-ai/
      AskAICopilotShell.tsx
      AskAILauncher.tsx
      AskAIPanel.tsx
      AskAIHeader.tsx
      AskAIModeTabs.tsx
      AskAIConversation.tsx
      AskAIMessage.tsx
      AskAIPromptInput.tsx
      AskAISuggestionBar.tsx
      AskAISourcesPanel.tsx
      AskAIToolTimeline.tsx
      AskAIStatusPill.tsx
      AskAIEmptyState.tsx
      AskAIErrorBoundary.tsx
      types.ts
    ask-ai/tools/
      ToolCallCard.tsx
      DnsResultCard.tsx
      SslResultCard.tsx
      WhoisResultCard.tsx
      HeadersResultCard.tsx
      TechStackResultCard.tsx
    ai-elements/
      message.tsx
      conversation.tsx
      tool.tsx
      code-block.tsx
      prompt-input.tsx
      sources.tsx
      suggestion.tsx
    ui/
      button.tsx
      badge.tsx
      sheet.tsx
      dialog.tsx
      scroll-area.tsx
      separator.tsx
      tooltip.tsx
  lib/
    ask-ai/
      agent.ts
      model-router.ts
      prompts.ts
      safety.ts
      telemetry.ts
      rate-limit.ts
      context.ts
      memory.ts
      rag/
        ingest.ts
        chunk.ts
        embeddings.ts
        retrieve.ts
        rerank.ts
        sources.ts
      tools/
        registry.ts
        schemas.ts
        safe-fetch.ts
        dns-analyzer.ts
        ssl-checker.ts
        whois-rdap.ts
        http-headers.ts
        tech-stack-detector.ts
        osint-search.ts
  stores/
    ask-ai-store.ts
  data/
    ask-ai/
      suggested-prompts.ts
      service-taxonomy.ts
      safety-policy.ts
  scripts/
    ask-ai-index.ts
```

---

## 17. Prompts del Sistema

### System prompt base

```text
You are Ask Juan AI, an enterprise-grade Infrastructure & Cybersecurity Copilot for juanpalacios.vercel.app.

Role:
- AI Infrastructure & Cybersecurity Copilot
- Expert in IT/OT cybersecurity, industrial networks, IEC 62443, NIST CSF, SIEM, OSINT, cloud, networking and SaaS engineering.

Behavior:
- Answer in the user's language unless explicitly requested otherwise.
- Prefer precise, technical and useful answers.
- Use retrieved sources as factual grounding.
- If a fact is not in provided context, say it is not available from the portfolio context.
- Do not invent certifications, employers, metrics or personal details.
- When tools are used, summarize method, result, risk and next step.
- For cybersecurity topics, keep guidance defensive, authorized and safe.

Output:
- Use concise markdown.
- Include citations when context sources are provided.
- Use tables for comparisons.
- Use code blocks only when useful.
- End with 2-3 suggested next questions when appropriate.
```

### Orchestration prompt

```text
Classify the user intent into one of:
profile_question, services_question, technical_explanation, domain_analysis,
osint_passive, contact_request, unsafe_request, unknown.

Return strict JSON:
{
  "intent": "...",
  "needsRetrieval": true,
  "needsTools": false,
  "candidateTools": [],
  "riskLevel": "low|medium|high",
  "answerStyle": "short|technical|consultative|step_by_step",
  "locale": "es|en"
}
```

### Tool safety prompt

```text
Before selecting a tool:
- Use only passive analysis tools.
- Never perform intrusive scanning.
- Never target private, localhost, link-local or metadata IP ranges.
- Refuse requests for credential theft, exploitation, evasion, persistence, malware or unauthorized access.
- If authorization is ambiguous, explain safe alternatives.
```

### Memory prompt

```text
Summarize the conversation for future continuity.
Store only non-sensitive preferences and high-level intent.
Do not store secrets, personal identifiers, third-party private data, tokens, passwords or vulnerable target details.
Return JSON:
{
  "summary": "...",
  "preferences": [],
  "followUps": [],
  "sensitiveDataDetected": false
}
```

---

## 18. Best Practices para Gemini 3.x Flash / Google Antigravity

### Nota de modelo

En Google Cloud, el modelo oficial verificado actualmente para Flash 3 es `gemini-3-flash-preview`. Si Antigravity muestra `Gemini 3.1 Flash`, usar ese selector dentro del IDE; para codigo/API, Gemini debe confirmar el model id disponible en el provider antes de modificar `route.ts`.

### Instrucciones para Antigravity

```text
Actua como Staff Fullstack Engineer.
Primero lee package.json, src/components/AIConsultant.tsx, src/app/api/chat/route.ts, src/app/page.tsx, src/context/LanguageContext.tsx, next.config.ts y globals.css.
No reescribas todo el sitio.
Implementa por fases.
Despues de cada fase ejecuta npm run lint y npm run build.
No elimines /api/chat hasta que /api/ask-ai este validado.
Mantiene i18n ES/EN.
No agregues dependencias innecesarias.
Usa Vercel AI SDK v6 y AI Elements para renderizar texto AI.
```

### Optimizacion para Flash

| Tema | Regla |
|---|---|
| Reasoning constraints | Pedir outputs estructurados y pasos cortos; evitar mega-prompts ambiguos. |
| Latency | Usar `thinking_level` bajo/minimo para clasificacion y alto solo en planificacion compleja. |
| Context | Inyectar maximo 5 chunks RAG rerankeados; resumir history. |
| Tool calling | Schemas estrictos, tools pequenas, outputs compactos. |
| JSON | Usar Zod + structured output para classification/planning. |
| Determinismo | Temperature baja para routing/safety; media para respuestas consultivas. |
| Multi-agent | No crear procesos separados innecesarios; simular agentes como modulos/functions hasta necesitar workers. |

---

## 19. Plan de Escalabilidad

| Dimension | Fase inicial | Fase enterprise |
|---|---|---|
| Usuarios | Public anonymous con quota por IP. | Auth + RBAC + per-client workspaces. |
| Agents | ToolLoopAgent unico modular. | Agents especializados + queues/workflows. |
| Tools | Pasivas y sin estado. | Tool execution queue, approvals, audit logs. |
| RAG | Portfolio + CV + blog. | Multi-tenant docs, client knowledge bases. |
| Memory | Session/local + summaries. | Semantic memory per user/org con retention policy. |
| Cache | Upstash Redis TTL. | Edge cache + semantic cache + provider cache. |
| Observability | Sentry/PostHog basic. | OTel traces, cost dashboards, alerting. |
| Deployment | Vercel project. | Preview envs, feature flags, canary rollout. |

### Queues futuras

- Ingestion async del CV/blog.
- Batch embeddings.
- Long-running OSINT reports autorizados.
- Scheduled refresh de certificados/DNS de dominios propios.

---

## 20. Experiencia Premium Final

El sistema debe sentirse como:

- Una consola AI de ciberseguridad, no un chat de soporte.
- Un asesor tecnico que conoce el portfolio y puede demostrar evidencia.
- Un producto SaaS enterprise compacto: rapido, sobrio, auditable.
- Una extension natural del posicionamiento de Juan: IT/OT, Oil & Gas, infraestructura critica, seguridad y arquitectura.

### Checklist de diferenciacion

| Pregunta | Debe cumplirse |
|---|---|
| Se ve generico? | No: la UI debe tener identidad IT/OT y Ask AI style. |
| Responde con evidencia? | Si: RAG + citations para claims del portfolio. |
| Puede ejecutar herramientas? | Si: tools pasivas y auditables. |
| Es seguro? | Si: rate limit distribuido, SSRF guard, CSP, safety. |
| Es escalable? | Si: capas modulares, stores, RAG, observabilidad. |
| Es rapido? | Si: stream temprano, lazy load, cache y Edge-first. |
| Es mantenible? | Si: prompts, tools, RAG y UI separados. |

---

## 21. Matriz de Adaptacion Especifica al Sitio Juan Palacios

Esta seccion es obligatoria para evitar que Gemini implemente un chatbot generico. El copilot debe comportarse como una extension directa del sitio actual, no como un producto AI aislado.

### Mapeo contra el codigo real

| Area del sitio actual | Archivo / fuente | Como debe usarlo Ask AI |
|---|---|---|
| Home composition | `src/app/page.tsx` | Reemplazar gradualmente `<AIConsultant />` por `<AskAICopilotShell />`, manteniendo lazy loading y sin alterar el orden de secciones. |
| Asistente actual | `src/components/AIConsultant.tsx` | Migrar el comportamiento util: launcher flotante, idioma activo, streaming percibido y apertura/cierre animada. No conservar el parseo SSE manual. |
| API actual | `src/app/api/chat/route.ts` | Mantener como fallback temporal. Crear `/api/ask-ai` con AI SDK y retirar `/api/chat` solo al final de la migracion. |
| Idioma | `src/context/LanguageContext.tsx` | Usar `language` como locale inicial del copilot, traducir placeholders, suggested prompts y tono de respuesta. |
| Perfil profesional | `Perfil`, `Experiencia`, `Stack`, `Certificaciones` y diccionario i18n | Indexar como RAG para responder sobre trayectoria, skills, certificaciones, servicios y autoridad tecnica. |
| Cybersecurity console | `SIEMDashboard`, `AuditHub`, `PurdueModel2D`, `MindMap3D` | Convertir en contexto tecnico del copilot: SIEM, IEC 62443, NIST, Purdue, IT/OT, industrial security. |
| Casos y servicios | `Proyecto`, `CaseStudyDetail`, `Contacto`, `src/data/*` | Generar respuestas consultivas y recomendaciones de contacto con evidencia del portfolio. |
| CV publico | `public/CV-JuanFelipePalacios.pdf` | Parsear e indexar como fuente prioritaria para experiencia profesional y credenciales. |
| Estilos globales | `src/app/globals.css` | Reutilizar base visual azul/dorado, fondo oscuro, glass controlado, scanlines y `prefers-reduced-motion`. |
| Seguridad de headers | `next.config.ts` | Ajustar CSP solamente para vendors necesarios; preservar `frame-ancestors 'none'`, HSTS y politicas restrictivas. |

### Identidad que debe preservar

| Dimension | Regla de adaptacion |
|---|---|
| Marca personal | El copilot debe presentarse como `Ask Juan AI` o `AI Cybersecurity Copilot`, no como bot anonimo. |
| Dominio profesional | Toda respuesta debe priorizar ciberseguridad industrial, IT/OT, redes, infraestructura critica, Oil & Gas, cloud y OSINT defensivo. |
| Ubicacion y mercado | Cuando aplique, contextualizar con Neuquen, Vaca Muerta, Argentina, Oil & Gas e infraestructura critica. |
| Estilo del sitio | Mantener consola premium, dark UI, precision tecnica y microinteracciones sobrias. |
| Bilingue | Responder en ES/EN segun `LanguageContext` y el idioma detectado del usuario. |
| Credibilidad | No inventar logros; usar RAG del portfolio, CV y datos existentes como fuentes. |

### Prompts sugeridos adaptados

| Modo | ES | EN |
|---|---|---|
| Perfil | `Resume la experiencia de Juan en ciberseguridad IT/OT` | `Summarize Juan's IT/OT cybersecurity experience` |
| Servicios | `Que tipo de consultoria puede brindar para Oil & Gas?` | `What consulting services can Juan provide for Oil & Gas?` |
| Arquitectura | `Explica como aplica el Modelo Purdue en una red industrial` | `Explain how the Purdue Model applies to an industrial network` |
| SIEM | `Como usaria Security Onion para reducir MTTR?` | `How would Security Onion help reduce MTTR?` |
| Compliance | `Compara IEC 62443, NIST CSF e ISO 27001 para OT` | `Compare IEC 62443, NIST CSF and ISO 27001 for OT` |
| OSINT defensivo | `Analiza cabeceras HTTP y postura SSL de un dominio autorizado` | `Analyze HTTP headers and SSL posture for an authorized domain` |
| Contacto | `Como puedo contactar a Juan para un proyecto critico?` | `How can I contact Juan for a critical project?` |

### Criterios de aceptacion especificos

| ID | Criterio | Validacion |
|---|---|---|
| ADAPT-01 | El launcher aparece sin romper layout, navbar, hero, SIEM ni footer. | Probar desktop y mobile. |
| ADAPT-02 | El copilot responde en espanol si el sitio esta en ES y en ingles si esta en EN. | Cambiar idioma desde UI y enviar la misma pregunta. |
| ADAPT-03 | Las respuestas sobre Juan citan fuentes internas: CV, experiencia, stack, blog o casos. | Preguntas golden de perfil y servicios. |
| ADAPT-04 | Las preguntas tecnicas usan el dominio real del portfolio: IT/OT, Purdue, SIEM, NIST, IEC 62443, Security Onion. | Golden set tecnico. |
| ADAPT-05 | No se pierden controles existentes de seguridad ni CSP. | Revisar `next.config.ts` y build. |
| ADAPT-06 | `/api/chat` sigue disponible hasta validar `/api/ask-ai`. | Test manual de fallback o mantener ruta sin borrar. |
| ADAPT-07 | El bundle inicial del portfolio no crece de forma descontrolada. | Verificar lazy loading del copilot y build analyzer si se habilita. |

### Preguntas golden para validar adaptacion

```text
1. Quien es Juan Felipe Palacios y cual es su especialidad?
2. Que experiencia tiene Juan en Oil & Gas e infraestructura critica?
3. Como puede ayudar Juan con una arquitectura IT/OT basada en Purdue?
4. Que relacion tiene Security Onion con los servicios que ofrece?
5. Que frameworks de cumplimiento menciona el sitio?
6. Como puedo descargar el CV o contactar a Juan?
7. Explain Juan's cybersecurity profile in English.
8. Analyze the security posture of an authorized domain using passive checks only.
```

---

## Prompt de Ejecucion para Gemini en Antigravity

```text
Implementa el plan ASK_AI_ENTERPRISE_IMPLEMENTATION_PLAN.md por fases.

Fase actual: Fase 1.

Restricciones:
- No borres codigo existente sin reemplazo probado.
- El proyecto real usa Next.js 16.2.3 y React 19.2.4.
- Mantiene Tailwind v4 y Framer Motion.
- Mantiene LanguageContext ES/EN.
- Reemplaza gradualmente AIConsultant por components/ask-ai.
- Crea /api/ask-ai con Vercel AI SDK v6.
- Usa UIMessage streams y AI Elements.
- Mantiene /api/chat como fallback hasta validar la nueva ruta.
- Ejecuta npm run lint y npm run build al final.

Entrega:
1. Lista de archivos modificados.
2. Explicacion breve de arquitectura.
3. Pruebas ejecutadas.
4. Riesgos pendientes.
```

---

## Referencias verificadas

- Cloudflare AI docs: plataforma unificada con Workers AI, AI Gateway, Agents, Vectorize y AI Search.
- Cloudflare AI Search: RAG productizado, metadata filtering, edge-based inference y casos de chatbot con fuentes propias.
- Google Cloud Gemini 3 Flash: modelo `gemini-3-flash-preview`, thinking levels, function calling, structured output, context caching y token limits.
- Google Developers Blog: Gemini 3 Flash disponible en Google Antigravity, AI Studio, Gemini API, Vertex AI y orientado a velocidad/costo para coding y flujos agentic.
