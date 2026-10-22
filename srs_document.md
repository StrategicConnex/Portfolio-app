# Documento de Especificación de Requerimientos de Software (SRS)

**Proyecto:** Portfolio Web Profesional (Cybersecurity Command Console) – Juan Felipe Palacios  
**Versión:** 3.1  
**Fecha:** Octubre 2026  
**Autor:** Juan Felipe Palacios  
**Estado:** En producción (bilingüe ES/EN)  
**Rama de referencia:** rama `audit/portfolio-claims` (verificada el 22 de octubre de 2026)

> Este documento describe el sistema **tal como está implementado**. La arquitectura
> detallada de cada seam vive en [CONTEXT.md](CONTEXT.md) (glosario de seams) y
> [README.md](README.md) (visión general, flujos y diagramas). Las cifras de tests,
> corpus y rutas de este SRS se verificaron contra el código.

---

## 1. Introducción

### 1.1 Propósito
Este documento define los requerimientos del portfolio profesional del Arq. Juan Felipe Palacios. El sistema es una **Consola de Comando de Ciberseguridad Industrial** que demuestra autoridad técnica en IT/OT, Oil & Gas e infraestructura crítica, e integra un **AI Cybersecurity Copilot bilingüe** con RAG del propio portfolio.

### 1.2 Alcance
La aplicación es una SPA de alto rendimiento (App Router con secciones SSR + lazy) que incluye:

- Interfaz industrial con estética de "centro de operaciones" (dark, scanlines, micro-animaciones).
- Dashboard SIEM simulado en tiempo real.
- Visualización interactiva del modelo Purdue IT/OT.
- Hub de governance/compliance (AuditHub) y producto SaaS (StrategicAudit Pro).
- **Ask Juan AI**: copiloto conversacional con streaming, RAG, herramientas pasivas y memoria de conversación.
- Sistema de internacionalización (ES/EN) sin recarga de página ni flash de idioma.
- Tema claro/oscuro/sistema sin flash de tema.
- Biblioteca descargable de recursos (`/recursos`) con registro de descargas.
- Métricas públicas de descargas (`/estadisticas`) y panel privado con sesión firmada.
- **Mapa global de ciberataques** (`/cyber-attack-map`): visualización 3D con inteligencia de amenazas **real** (DShield + CISA KEV).
- Sección de artículos técnicos (Inteligencia IT/OT), casos de estudio y contacto por email.

### 1.3 Fuera de alcance
- Backend propio o base de datos relacional: el sitio es serverless sobre Vercel; la persistencia opcional es Upstash Redis (rate limit + registro de descargas).
- Panel de administración con edición de contenido: todo el contenido es estático en `src/data/*` + `src/context/translations/*`.
- Sistema de cuentas de usuario final: el único acceso autenticado es el panel privado de descargas, protegido por un token compartido.
- Modelos de IA pagos: el copilot es **free-only por invariante de código**.

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del producto
El producto comunica autoridad técnica con elementos visuales premium (glassmorphism controlado, scanlines, radar sweeps) y funcionalidad real: el copiloto responde con fuentes del portfolio (corpus derivado de `src/data` + traducciones), ejecuta análisis pasivos (DNS, SSL, headers, WHOIS, stack, puertos) y recuerda conversaciones anteriores.

### 2.2 Requerimientos Globales
- **Bilingüe:** Español e Inglés sin recarga de página, sin FOUC (seam de idioma).
- **Persistencia:** Preferencia de idioma en cookie (`portfolio_lang`) + canal diferido en localStorage.
- **IA integrada:** Consultoría técnica vía OpenRouter con pool de modelos **exclusivamente gratuitos** (`:free` + router `openrouter/free`). No existe fallback pago: si el pool queda vacío tras el saneamiento, la ruta responde 503.
- **Seguridad:** CSP estricta, rate limiting por IP, validación Zod, protección SSRF.
- **Coste cero de inferencia:** el copilot nunca puede contratar un modelo de pago.

---

## 3. Requerimientos Funcionales

### RF-01 · Selector de Idioma (i18n)
**Descripción:** Interruptor fluido entre Español e Inglés.
**Criterios de aceptación:**
- Cambia todos los textos de la UI instantáneamente (diccionarios en `src/context/translations/`, 23 archivos).
- Persiste en cookie (`portfolio_lang`) + localStorage.
- **Sin flash de idioma**: el primer paint del SSR nunca se invierte tras la hidratación (`resolveHydrationLanguage`).

### RF-02 · Tema claro / oscuro / sistema
**Descripción:** Cambio de tema con persistencia y sin flash.
**Criterios de aceptación:**
- Regla única *cookie `portfolio_theme` → preferencia del SO → `light`/`dark`/`system`* (seam `src/lib/theme.ts`).
- El script no-flash del layout aplica el tema antes del primer paint.
- Tres scopes de tokens: `:root` (light), `.dark`, `.console` (oscuro en ambos temas).
- Contraste verificado por test automatizado: texto ≥ 4.5:1, bordes interactivos ≥ 3:1 (WCAG AA / 1.4.11).

### RF-03 · SIEM Dashboard Interactivo
**Descripción:** Simulación visual de un sistema de gestión de eventos de seguridad (basada en datos de `src/data/siem.ts`).
**Criterios de aceptación:**
- Event stream con niveles CRITICAL/WARN/INFO, vectores de ataque, atacantes y KPIs por idioma.
- Simulación de incidente industrial; zonas Purdue con disponibilidad.
- El badge y la descripción **distinguen lo real de lo simulado**: el mapa 3D embebido consume inteligencia de amenazas real; el resto del panel (stream, KPIs, zonas) es simulado en el navegador.

### RF-04 · Ask Juan AI (Copilot)
**Descripción:** Agente conversacional bilingüe con RAG, tools y memoria.
**Criterios de aceptación:**
- Streaming de respuestas (UIMessage stream) con Markdown, código y tablas.
- **Conciencia lingüística:** responde en el idioma activo (`lang` del request).
- **RAG**: responde con fuentes del portfolio (retrieval keyword + TF-IDF fusionados, pesos 0.6/0.4); la lista de fuentes y el contexto salen de **la misma retrieval**.
- **Corpus**: 174 entradas per-locale (87 `es` + 87 `en`); 122 de ellas son la biblioteca `/recursos` (61 por locale). El corpus es **derivado** de `src/data/*` + traducciones, no duplicado a mano.
- **Tools pasivas**: DNS, SSL, HTTP headers, WHOIS, tech stack, puertos — con tarjetas de resultado y capa anti-SSRF (`safe-fetch`).
- **Model pool free-only**: si un modelo free falla al arrancar el stream, pasa al siguiente; todo el pool fallido → **503** (nunca se contrata un modelo pago).
- **Resiliencia**: un 429 al arrancar entra en cola de reintento con backoff (600ms→1200ms, ±50% de jitter, máx. 2 reintentos, presupuesto global 5s) antes de avanzar al siguiente modelo.
- **Memoria**: resume conversaciones completadas en el cliente y las inyecta como contexto (cap 3000 chars) en requests futuros.
- **Telemetría**: eventos `ask_ai_*` (JSON estructurado a stdout + Sentry para errores).

### RF-05 · Visualización Purdue (Arquitectura)
**Descripción:** Representación visual del modelo de referencia de redes industriales (niveles 0–4/5, DMZ, zonas IT/OT).
**Criterios de aceptación:**
- Diagrama interactivo 2D + mapa de convergencia 3D (`MindMap3D`), contenido bilingüe.

### RF-06 · Sección StrategicAudit Pro (SCAudit)
**Descripción:** Presentación del producto SaaS de auditoría técnica, RUM y Web Vitals.
**Criterios de aceptación:**
- Cards de funcionalidades, métricas (LCP/CLS/INP, Lighthouse, SEO Health), CTA a `https://scaudit.vercel.app`.
- **RUM**: el script `vitals.js` de SCAudit se carga solo en producción fuera de localhost (CORS).

### RF-07 · Blog / Inteligencia IT/OT
**Descripción:** Insights técnicos y normativas (IEC 62443, SIEM, NIST, Vaca Muerta).
**Criterios de aceptación:**
- Tarjetas con tags por categoría, contenido localizado vía diccionarios.

### RF-08 · Formulario de Contacto
**Descripción:** Envío de mensajes por email vía Resend.
**Criterios de aceptación:**
- Validación Zod (`contactSchema`), rate limit 5 req/min por IP.
- Email HTML con escape de contenido; respuesta de error localizada.

### RF-09 · Biblioteca de recursos descargable
**Descripción:** `/recursos` publica 61 documentos en 7 categorías: 5 volúmenes con vista de detalle (`/recursos/[volumen]`) + 2 colecciones sin volumen (estándares y proyecto).
**Criterios de aceptación:**
- El texto de los documentos se extrae con `scripts/extract-recursos-text.mjs` → `src/data/recursos-text.json` y alimenta el corpus del copilot.
- Las descargas pasan por `/api/track/download`, que registra el evento y redirige (307) al archivo estático.
- Solo se aceptan rutas saneables bajo `/recursos/` (`isTrackableFile`); cualquier otra responde 404 sin registrar nada.
- Rate limit de 30 req/min por cliente, **fail-open** (si Redis cae, la descarga pasa igual).

### RF-10 · Métricas de descargas
**Descripción:** `/estadisticas` expone métricas públicas agregadas; `/estadisticas-privadas` expone el detalle operativo.
**Criterios de aceptación:**
- Agregaciones por archivo, día, volumen y país.
- Backends: Upstash Redis REST (durable en Vercel) o NDJSON local (`.data/descargas.ndjson`, ruta configurable con `DOWNLOAD_STATS_FILE`); log acotado a los últimos 10.000 eventos.
- El panel privado **responde 404** si `DOWNLOAD_STATS_TOKEN` no está configurada.
- La sesión del panel es una cookie HMAC-SHA256 (`panel_auth`, httpOnly, 30 días) emitida por el route handler `/estadisticas-privadas/sesion` (la página `/estadisticas-privadas/login` solo postea a él); la clave de firma **es** `DOWNLOAD_STATS_TOKEN` (mín. 8 caracteres). El login compara en tiempo constante y tiene rate limit de 5/min por cliente.

### RF-11 · Mapa global de ciberataques
**Descripción:** `/cyber-attack-map` visualiza actividad de amenazas **real** en un globo 3D, distinguiendo siempre el dato del proveedor de la elección del propio mapa.
**Criterios de aceptación:**
- **Datos reales y trazables:** la fuente de origen es DShield (SANS ISC) — IPs con mayor volumen de reportes — y CISA KEV (vulnerabilidades con explotación confirmada). El respaldo de geolocalización es `ipwho.is`.
- **Atribución honesta:** solo los eventos con IP **y** país de origen reales originan un arco; CISA KEV se publica sin atribución de origen (no se inventa un país).
- **Destino declarado:** el extremo derecho del arco no es un dato del proveedor (DShield no publica la víctima) sino la infraestructura protegida (Argentina / Neuquén) o un destino global ilustrativo, visualmente distinguido.
- **Estado del feed declarado:** el pie de la escena indica si los datos son reales o si el origen de los arcos es ilustrativo. Nunca ambos a la vez.
- **Tooltip sin invención:** IP, ASN, número de reportes y país de origen; los campos que el proveedor no publicó se muestran como «—», nunca como cero ni como valor inventado.
- **Bilingüe:** todo el texto visible del mapa (incluido el canvas WebGL, que no tiene DOM que traducir) sale del diccionario `threatmap.*`, en ES y EN.
- **Cache y coalesce:** TTL 300 s (DShield) y 3600 s (KEV), coalesce de peticiones concurrentes y estado por fuente publicado en la respuesta (`sourceStatus`, `cacheTtlSeconds`).
- Detalle técnico completo en [`docs/cyber-attack-map.md`](docs/cyber-attack-map.md).

---

## 4. Requerimientos No Funcionales

### RNF-01 · Internacionalización
- Seam único `src/lib/language.ts` (regla *cookie → Accept-Language → default*).
- `src/proxy.ts` garantiza la cookie en cada respuesta de página (el layout no puede setear cookies en Server Components).
- Soporte de nuevas lenguas extendiendo `src/context/translations/`.

### RNF-02 · Experiencia de Usuario
- Scanlines, ruido sutil, radar sweeps; Framer Motion con `prefers-reduced-motion` respetado.
- Tipografía Inter/Mono; responsive desktop/mobile; accesibilidad axe-core (gate de e2e: falla ante violaciones critical/serious).

### RNF-03 · Rendimiento
- Secciones bajo el fold con `next/dynamic` + `Suspense` (fallbacks de skeleton).
- Imágenes con `qualities: [100, 75]`; LCP optimizado (quality 75 en Hero/Perfil).
- La página es **dinámica a propósito** (`cookies()`/`headers()` en el layout alimentan el i18n SSR); convertirla a estática degradaría el first paint correcto.

### RNF-04 · Seguridad
- CSP estricta y headers de seguridad en `next.config.ts` (HSTS preload, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, `frame-ancestors 'self'`, receptor `/api/csp-report`).
- Rate limiting distribuido (Upstash) con fallback in-memory; `getClientId` anti-spoofing (última IP de XFF).
- Validación Zod en todas las APIs; escape HTML en emails; protección SSRF en tools (bloqueo de IPs privadas + re-chequeo de cada IP resuelta).
- `/api/chat` (fallback legacy) propaga `x-forwarded-for`/`x-real-ip` **verbatim** (los del edge), nunca construidos desde input del cliente.

### RNF-05 · Testing y CI
- Vitest: **60 archivos · 624 tests** (unit/integración, jsdom).
- Playwright: **9 specs · 38 tests** contra build de producción.
- CI en GitHub Actions (`.github/workflows/ci.yml`): `validate` (lint, typecheck, test, **audit**, build) → `lighthouse` → `e2e` → `deploy`.
- El job `deploy` es **hard-fail** si el project ID de Vercel no es `prj_KmY2dJJgbui7LhuQyxZPKTU08T1h`.
- El gate de seguridad tiene **dos capas**: `npm audit --omit=dev --audit-level=moderate` (superficie de producción, bloqueante) y `npm audit --audit-level=critical` en el árbol completo (bloqueante); el resto se emite como `::warning::`.

### RNF-06 · Coste de inferencia
- El pool de modelos es **free-only por invariante de código** (`buildFreeModelPool()` descarta cualquier id que no sea `:free` o el router `openrouter/free`).
- Pool vacío tras el saneamiento → 503, nunca un modelo pago.

---

## 5. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Core** | Next.js 16 (App Router, Turbopack), React 19, TypeScript 6 |
| **Styling** | Tailwind CSS v4 (CSS-first, sin `tailwind.config.ts`), Framer Motion, Three.js, tsparticles |
| **IA** | Vercel AI SDK v7 (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`), OpenRouter (**pool free-only**), Streamdown/Shiki |
| **RAG** | Keyword scoring + TF-IDF cosine (fusionado, pesos 0.6/0.4) — sin vector DB |
| **State** | Zustand (UI), Context API (i18n), localStorage (persistencia) |
| **Email** | Resend |
| **Rate limit** | Upstash Redis + fallback in-memory |
| **Observabilidad** | PostHog, Sentry, SCAudit RUM, telemetría propia del copilot |
| **Testing** | Vitest, Testing Library, axe-core, Playwright, Lighthouse CI |
| **Despliegue** | Vercel (Next.js 16, `vercel build --prebuilt` en el runner de Actions) |

---

## 6. Arquitectura de Archivos

```
src/
├── proxy.ts                      # Next 16 Proxy: cookie de idioma + cookie de tema
├── test-setup.ts                 # Setup global de Vitest (jsdom + jest-dom)
├── lighthouse-budget.test.ts     # Guard del presupuesto de Lighthouse
├── app/                          # Rutas: componen features, sin lógica de dominio
│   ├── layout.tsx                # SSR i18n, JSON-LD, SCAudit RUM, Observability
│   ├── page.tsx                  # Home (secciones lazy + Suspense)
│   ├── loading.tsx / error.tsx / not-found.tsx
│   ├── robots.ts / sitemap.ts
│   ├── estadisticas/             # Métricas públicas de descargas
│   ├── estadisticas-privadas/    # Panel privado (login / sesion / logout + cookie HMAC)
│   ├── recursos/                 # Biblioteca + volúmenes (/recursos/[volumen])
│   ├── cyber-attack-map/         # Mapa 3D a pantalla completa (SSR i18n + metadata)
│   ├── test-error/               # Solo con NEXT_PUBLIC_E2E_ERROR_ROUTE=1
│   └── api/
│       ├── ask-ai/route.ts       # Copilot (streaming + RAG + tools + pool)
│       ├── contact/route.ts      # Email (Resend), rate limit 5/min
│       ├── threat-intel/route.ts # Inteligencia de amenazas (DShield + CISA KEV)
│       ├── track/download/route.ts # Registro de descargas (30/min) + 307
│       ├── csp-report/route.ts   # Reportes CSP (POST) + health (GET)
│       └── chat/route.ts         # Fallback legacy → reenvía a /api/ask-ai
├── features/                     # Módulos por dominio (la lógica vive aquí)
│   ├── ask-ai/
│   │   ├── ask-ai-store.ts       # Zustand: isOpen, mode, pendingPrompt
│   │   ├── lib/                  # rag/, prompt/, model-pool, pool-health, memory/,
│   │   │                         #   tools/, telemetry
│   │   └── components/
│   │       ├── ask-ai/           # Shell, launcher, panel, tool cards…
│   │       └── ai-elements/      # Conversación, mensajes, sources, prompt-input
│   ├── stats/                    # download-stats, panel-auth (HMAC), upstash-rest
│   ├── recursos/                 # UI de la biblioteca + volúmenes
│   └── portfolio/                # Hero, Perfil, Arquitectura, Experiencia, SIEM,
│                                 #   AuditHub, SCAudit, Blog, Stack, Certificaciones,
│                                 #   Proyecto, Caso, Contacto, Navbar, Footer, 3D/canvas,
│                                 #   CyberAttackMap3D + ArcTooltipPanel + attackArc
│                                 #   + globeRotation
├── components/                   # Kernel compartido
│   ├── observability/            # ObservabilityProvider (PostHog + Sentry)
│   └── ui/                       # shadcn/ui + SectionHeader/FadeIn/Icon
├── context/
│   ├── LanguageContext.tsx       # Proveedor i18n (consume el seam)
│   └── translations/             # Diccionarios ES/EN por sección (23 archivos)
├── data/                         # Contenido (siem, audit, blog, experiencia, mindmap,
│                                 #   caseStudyData, recursos*, countryCoords) — alimenta
│                                 #   el corpus RAG y el mapa
├── lib/                          # Seams compartidos: language, theme, rate-limit,
│                                 #   server-i18n, next-cache, constants, utils, observability/
└── test-utils/                   # Mocks de framer-motion y next/image
```

**Regla de layout:** la lógica de dominio vive en `src/features/`, no en `src/app/`, `src/components/` ni `src/lib/`. `src/lib/` es solo para seams compartidos por más de un feature.

---

## 7. Criterios de Aceptación (v3.0)

| ID | Criterio | Resultado |
|---|---|---|
| CA-01 | El idioma persiste tras recargar la página, sin flash | ✅ Exitoso |
| CA-02 | El tema persiste tras recargar la página, sin flash | ✅ Exitoso |
| CA-03 | El copiloto responde en el idioma de la UI con fuentes RAG | ✅ Exitoso |
| CA-04 | El copiloto **nunca** usa un modelo de pago | ✅ Exitoso (invariante en `buildFreeModelPool`) + test |
| CA-05 | El build de producción no tiene errores de TS | ✅ Exitoso (`tsc --noEmit` exit 0) |
| CA-06 | Las animaciones SIEM corren fluidas y respetan reduced-motion | ✅ Exitoso |
| CA-07 | El sitio es 100% responsivo en desktop/mobile | ✅ Exitoso |
| CA-08 | Los seams (idioma, tema, RAG, rate-limit, prompt, pool, memoria, stats, threat-intel, arco, rotación) tienen tests | ✅ Exitoso (624 unit + 38 e2e) |
| CA-09 | El e2e pasa contra el build de producción en CI | ✅ Exitoso |
| CA-10 | El contraste WCAG AA de la ladder de texto y los bordes interactivos está verificado por test | ✅ Exitoso (17 tests) |
| CA-11 | El pipeline de CI está verde (audit incluido) | ✅ Exitoso — gate en dos capas: producción (`--omit=dev`) bloqueante, árbol completo bloqueante solo en `critical`. Inventario verificado: **16 avisos (8 low, 8 high, 0 moderate, 0 critical)** en el árbol completo; **8 low, 0 high, 0 moderate** en producción |
| CA-12 | El mapa de ciberataques no atribuye ataques a países que el proveedor no señaló | ✅ Exitoso — regla verificada por test (origen con IP+país reales, KEV sin atribución, destino declarado, pie con el estado del feed, tooltip sin invención) |
| CA-13 | El mapa es bilingüe en su totalidad, incluido el canvas WebGL | ✅ Exitoso — todo el texto sale de `threatmap.*`; una guarda falla si vuelve una cadena literal al componente |

> **Deuda abierta (ver README → "Deuda técnica conocida"):** el único advisory que sobrevive en el árbol completo es `braces@3.0.3` (high, dev-only, **sin parche upstream publicado**), replicado en 8 nodos; se reporta como `::warning::` y no bloquea el deploy. En la superficie de producción no queda ningún advisory por encima de `low`.

---

## 8. Información de Contacto
**Responsable:** Juan Felipe Palacios  
**URL Producción:** https://juanpalacios.vercel.app  
**Producto asociado:** https://scaudit.vercel.app (StrategicAudit Pro)
