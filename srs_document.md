# Documento de Especificación de Requerimientos de Software (SRS)
**Proyecto:** Portfolio Web Profesional (Cybersecurity Command Console) – Juan Felipe Palacios  
**Versión:** 2.0  
**Fecha:** Agosto 2026  
**Autor:** Juan Felipe Palacios  
**Estado:** En producción (bilingüe ES/EN)

---

## 1. Introducción

### 1.1 Propósito
Este documento define los requerimientos del portfolio profesional del Arq. Juan Felipe Palacios. El sistema es una **Consola de Comando de Ciberseguridad Industrial** que demuestra autoridad técnica en IT/OT, Oil & Gas e infraestructura crítica, e integra un **AI Cybersecurity Copilot bilingüe** con RAG del propio portfolio.

### 1.2 Alcance
La aplicación es una SPA de alto rendimiento (App Router con secciones SSR + lazy) que incluye:

- Interfaz industrial con estética de "centro de operaciones" (dark, scanlines, micro-animaciones).
- Dashboard SIEM simulado en tiempo real.
- Visualización interactiva de la arquitectura Purdue IT/OT.
- Hub de governance/compliance (AuditHub) y producto SaaS (StrategicAudit Pro).
- **Ask Juan AI**: copiloto conversacional con streaming, RAG, herramientas pasivas y memoria de conversación.
- Sistema de internacionalización (ES/EN) sin recarga de página ni flash de idioma.
- Sección de artículos técnicos (Inteligencia IT/OT), casos de estudio y contacto por email.

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del producto
El producto comunica autoridad técnica con elementos visuales premium (glassmorphism controlado, scanlines, radar sweeps) y funcionalidad real: el copiloto responde con fuentes del portfolio (corpus derivado de `src/data` + traducciones), ejecuta análisis pasivos (DNS, SSL, headers, WHOIS, stack, puertos) y recuerda conversaciones anteriores.

### 2.2 Requerimientos Globales
- **Bilingüe:** Español e Inglés sin recarga de página, sin FOUC (seam de idioma).
- **Persistencia:** Preferencia de idioma en cookie (`portfolio_lang`) + canal diferido en localStorage.
- **IA integrada:** Consultoría técnica vía OpenRouter con pool de modelos (free → paid fallback).
- **Seguridad:** CSP estricta, rate limiting por IP, validación Zod, protección SSRF.

---

## 3. Requerimientos Funcionales

### RF-01 · Selector de Idioma (i18n)
**Descripción:** Interruptor fluido entre Español e Inglés.
**Criterios de aceptación:**
- Cambia todos los textos de la UI instantáneamente (diccionarios en `src/context/translations/`).
- Persiste en cookie + localStorage.
- **Sin flash de idioma**: el primer paint del SSR nunca se invierte tras la hidratación (`resolveHydrationLanguage`).

### RF-02 · SIEM Dashboard Interactivo
**Descripción:** Simulación visual de un sistema de gestión de eventos de seguridad (basada en datos de `src/data/siem.ts`).
**Criterios de aceptación:**
- Event stream con niveles CRITICAL/WARN/INFO, vectores de ataque, atacantes y KPIs por idioma.
- Simulación de incidente industrial; zonas Purdue con disponibilidad.

### RF-03 · Ask Juan AI (Copilot)
**Descripción:** Agente conversacional bilingüe con RAG, tools y memoria.
**Criterios de aceptación:**
- Streaming de respuestas (UIMessage stream) con Markdown, código y tablas.
- **Conciencia lingüística:** responde en el idioma activo (`lang` del request).
- **RAG**: responde con fuentes del portfolio (retrieval keyword + TF-IDF); cita la lista de fuentes disponibles.
- **Tools pasivas**: DNS, SSL, HTTP headers, WHOIS, tech stack, puertos — con tarjetas de resultado.
- **Model pool**: si el modelo free falla al arrancar el stream, pasa al siguiente; todo el pool fallido → 503.
- **Memoria**: resume conversaciones completadas y las inyecta como contexto en requests futuros.

### RF-04 · Visualización Purdue (Arquitectura)
**Descripción:** Representación visual del modelo de referencia de redes industriales (niveles 0–4/5, DMZ, zonas IT/OT).
**Criterios de aceptación:**
- Diagrama interactivo 2D + mapa de convergencia 3D (`MindMap3D`), contenido bilingüe.

### RF-05 · Sección StrategicAudit Pro (SCAudit)
**Descripción:** Presentación del producto SaaS de auditoría técnica, RUM y Web Vitals.
**Criterios de aceptación:**
- Cards de funcionalidades, métricas (LCP/CLS/INP, Lighthouse, SEO Health), CTA a `https://scaudit.vercel.app`.
- **RUM**: el script `vitals.js` de SCAudit se carga solo en producción fuera de localhost (CORS).

### RF-06 · Blog / Inteligencia IT/OT
**Descripción:** Insights técnicos y normativas (IEC 62443, SIEM, NIST, Vaca Muerta).
**Criterios de aceptación:**
- Tarjetas con tags por categoría, contenido localizado vía diccionarios.

### RF-07 · Formulario de Contacto
**Descripción:** Envío de mensajes por email vía Resend.
**Criterios de aceptación:**
- Validación Zod (`contactSchema`), rate limit 5 req/min por IP.
- Email HTML con escape de contenido; respuesta de error localizada.

---

## 4. Requerimientos No Funcionales

### RNF-01 · Internacionalización
- Seam único `src/lib/language.ts` (regla *cookie → Accept-Language → default*).
- `src/proxy.ts` garantiza la cookie en cada respuesta de página (el layout no puede setear cookies en Server Components).
- Soporte de nuevas lenguas extendiendo `src/context/translations/`.

### RNF-02 · Experiencia de Usuario
- Scanlines, ruido sutil, radar sweeps; Framer Motion con `prefers-reduced-motion` respetado.
- Tipografía Inter/Mono; responsive desktop/mobile; accesibilidad axe-core.

### RNF-03 · Rendimiento
- Secciones bajo el fold con `next/dynamic` + `Suspense` (fallbacks de skeleton).
- Imágenes con `qualities: [100, 75]`; LCP optimizado (quality 75 en Hero/Perfil).

### RNF-04 · Seguridad
- CSP estricta y headers de seguridad en `next.config.ts`.
- Rate limiting distribuido (Upstash) con fallback in-memory; `getClientId` anti-spoofing (última IP de XFF).
- Validación Zod en todas las APIs; escape HTML en emails; protección SSRF en tools.

### RNF-05 · Testing y CI
- Vitest (34 archivos / 353 tests) + Playwright e2e (7 specs / 33 tests) contra build de producción.
- CI en GitHub Actions: jobs `validate` (lint, typecheck, test, build) y `e2e`.

---

## 5. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Core** | Next.js 16 (App Router, Turbopack), React 19, TypeScript 6 |
| **Styling** | Tailwind CSS v4, Framer Motion, Three.js, tsparticles |
| **IA** | Vercel AI SDK v7, OpenRouter (pool free + fallback pago), Streamdown/Shiki |
| **RAG** | Keyword scoring + TF-IDF cosine (fusionado, pesos 0.6/0.4) |
| **State** | Zustand (UI), Context API (i18n), localStorage |
| **Email** | Resend |
| **Rate limit** | Upstash Redis + fallback in-memory |
| **Observabilidad** | PostHog, Sentry, SCAudit RUM |
| **Testing** | Vitest, Testing Library, axe-core, Playwright |
| **Despliegue** | Vercel |

---

## 6. Arquitectura de Archivos

```
src/
├── proxy.ts                      # Next 16 Proxy (cookie de idioma)
├── app/
│   ├── layout.tsx                # SSR i18n, JSON-LD, RUM, Observability
│   ├── page.tsx                  # Home (secciones lazy + Suspense)
│   ├── loading.tsx / error.tsx / not-found.tsx
│   └── api/
│       ├── ask-ai/route.ts       # Copilot (RAG + tools + model pool + memoria)
│       ├── contact/route.ts      # Email (Resend)
│       └── chat/route.ts         # Fallback legacy → /api/ask-ai
├── components/
│   ├── ask-ai/                   # Shell, launcher, panel, header, input, tools
│   ├── ai-elements/              # Conversación, mensajes, sources
│   ├── observability/            # PostHog + Sentry
│   ├── ui/                       # shadcn/ui
│   └── (secciones)               # Hero, Perfil, Arquitectura, SIEM, AuditHub, ...
├── context/
│   ├── LanguageContext.tsx       # Proveedor i18n (consume el seam)
│   └── translations/             # Diccionarios ES/EN por sección
├── data/                         # Contenido (siem, audit, blog, experiencia, ...)
├── lib/
│   ├── language.ts               # Seam de idioma
│   ├── rate-limit.ts             # Seam de rate limiting
│   ├── observability/
│   └── ask-ai/
│       ├── rag/                  # retriever, sources (corpus), tokenizer
│       ├── prompt/               # system-prompt
│       ├── model-pool.ts
│       ├── memory/               # conversation-memory (client-side)
│       └── tools/                # registry + 6 tools + safe-fetch
└── stores/ask-ai-store.ts        # Zustand
```

---

## 7. Criterios de Aceptación (v2.0)

| ID | Criterio | Resultado |
|---|---|---|
| CA-01 | El idioma persiste tras recargar la página, sin flash | ✅ Exitoso |
| CA-02 | El copiloto responde en el idioma de la UI con fuentes RAG | ✅ Exitoso |
| CA-03 | El build de producción no tiene errores de TS | ✅ Exitoso |
| CA-04 | Las animaciones SIEM corren fluidas y respetan reduced-motion | ✅ Exitoso |
| CA-05 | El sitio es 100% responsivo en desktop/mobile | ✅ Exitoso |
| CA-06 | Los seams (idioma, RAG, rate-limit, prompt, pool, memoria) tienen tests | ✅ Exitoso (353 unit + 33 e2e) |
| CA-07 | El e2e pasa contra el build de producción en CI | ✅ Exitoso |

---

## 8. Información de Contacto
**Responsable:** Juan Felipe Palacios  
**URL Producción:** https://juanpalacios.vercel.app  
**Producto asociado:** https://scaudit.vercel.app (StrategicAudit Pro)
