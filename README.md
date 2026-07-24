# Juan Felipe Palacios - Portfolio

Portfolio personal de consultoría en IT/OT y ciberseguridad industrial. Especializado en infraestructuras críticas, modelo Purdue y el sector Oil & Gas en Vaca Muerta, Neuquén, Argentina.

## Stack Tecnológico
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 6
- **Estilos**: Tailwind CSS v4, Framer Motion, Three.js, @react-three/fiber
- **AI**: Vercel AI SDK v7, Google Gemini via OpenRouter, AI Elements
- **UI**: shadcn/ui, Lucide Icons, Streamdown (Markdown), use-stick-to-bottom
- **RAG**: TF-IDF cosine similarity + keyword scoring híbrido
- **State**: Zustand (UI), Context API (i18n), localStorage (persistencia)
- **Testing**: Vitest, Testing Library, axe-core (accesibilidad)
- **CI/CD**: GitHub Actions (lint, typecheck, test, build)
- **Observabilidad**: PostHog (analytics), Sentry (errores)
- **Rate Limiting**: Upstash Redis + fallback in-memory
- **RUM**: StrategicAudit Pro (`https://scaudit.vercel.app/scripts/vitals.js`)

## Fases Completadas

| Fase | Descripción | Estado |
|------|-------------|--------|
| **1** | Foundation UI + AI SDK stream | ✅ |
| **2** | UX premium Ask AI (Markdown, sources, copy, follow-ups) | ✅ |
| **3** | RAG real del portfolio (keyword retrieval, bilingual) | ✅ |
| **4** | Tools de ciberseguridad (DNS, SSL, HTTP Headers, WHOIS) | ✅ |
| **5** | Enterprise hardening (CSP, ErrorBoundary, localStorage, Zod) | ✅ |
| **6** | Tool Result Cards UI (6 tarjetas visuales especializadas) | ✅ |
| **7** | Mega Enterprise (Upstash Redis, Memory System, PostHog/Sentry, OSINT tools) | ✅ |
| **8** | RAG semántico TF-IDF, modularización de componentes, observabilidad en layout | ✅ |
| **9** | Tests unitarios (29 tests), .env.example, CI/CD, README actualizado | ✅ |

## Arquitectura del AI Copilot

```
┌─────────────────────────────────────────────┐
│ AskAICopilotShell (orquestador)              │
│  ├─ AskAIErrorBoundary                      │
│  ├─ AskAILauncher (botón flotante)          │
│  └─ AskAIPanel (panel principal)            │
│       ├─ AskAIHeader (header modular)       │
│       ├─ AskAIEmptyState (estado inicial)   │
│       ├─ Conversation (stream de mensajes)  │
│       │   ├─ Message + MessageResponse      │
│       │   └─ ToolCallCard (tool results)    │
│       │       ├─ DnsResultCard             │
│       │       ├─ SslResultCard             │
│       │       ├─ WhoisResultCard           │
│       │       ├─ HttpHeadersResultCard     │
│       │       ├─ TechStackResultCard       │
│       │       └─ PortAnalyzerResultCard    │
│       ├─ AskAISuggestionBar (prompts)      │
│       └─ AskAIPromptInput (input + stop)   │
├─────────────────────────────────────────────┤
│ API Route: /api/ask-ai                      │
│  ├─ Zod validation                         │
│  ├─ Rate limiting (Upstash Redis)          │
│  ├─ RAG híbrido (keywords + TF-IDF)        │
│  ├─ Tool execution (6 tools)               │
│  └─ Stream response (AI SDK)               │
└─────────────────────────────────────────────┘
```

## Desarrollo Local

```bash
# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

## Producción

```bash
npm run build
npm start
```

## Tests

```bash
npm run test           # Todos los tests
npm run test:watch     # Modo watch
```

## Variables de Entorno

Ver `.env.example` para la lista completa. Las principales:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | API key para el AI Copilot |
| `UPSTASH_REDIS_REST_URL` | ❌ | URL de Upstash Redis (rate limiting distribuido) |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | Token de Upstash Redis |
| `RESEND_API_KEY` | ✅ | API key para formulario de contacto |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ | API key de PostHog (analytics) |
| `SENTRY_DSN` | ❌ | DSN de Sentry (error tracking) |

## Verificación Pre-Deploy

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

## Medidas de Producción y Seguridad
- **CSP Estricto**: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options en `next.config.ts`.
- **SSRF Protection**: Validación de URLs y bloqueo de IPs privadas en tools (`safe-fetch.ts`).
- **Rate Limiting**: Distribuido via Upstash Redis, con fallback in-memory.
- **Input Validation**: Zod en todas las APIs y formularios.
- **Accesibilidad**: Respeto de `prefers-reduced-motion`, tests con axe-core.
- **Resiliencia**: ErrorBoundary en AI Copilot, provider fallback para OpenRouter.
- **Dark mode**: `color-scheme: dark` forzado, diseño industrial premium.
