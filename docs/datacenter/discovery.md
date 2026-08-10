# ARCHITECTURE DISCOVERY REPORT — THE LIVING DATACENTER

**Fase 0 · 2026-08-10 · verificado en código (no asumido)**

## 1. Stack y versiones (de `package.json`)

| Capa | Versión | Notas |
| --- | --- | --- |
| Next.js | 16.3.0 (App Router, Turbopack) | Build OK; leer `node_modules/next/dist/docs/01-app` antes de código (AGENTS.md) |
| React / ReactDOM | 19.2.7 | |
| TypeScript | 6.x | `npm run typecheck` PASS |
| Tailwind | v4 (`@tailwindcss/postcss`) | tokens en `globals.css` (`--bg`, `--blue`, `--gold`) |
| @react-three/fiber | 9.6.1 | ya instalado (MindMap3D) |
| @react-three/drei | 10.7.7 | ya instalado |
| three | 0.185.0 | |
| framer-motion | 12.42.0 | micro-animaciones; **no hay** `useScroll`/`useTransform` en el repo |
| GSAP | **no instalado** | no es necesario (framer cubre scrubbing) |
| i18n | `LanguageContext` + `src/context/translations/*` (es/en, 17 archivos) | cookie `portfolio_lang` + Accept-Language |
| Testing | Vitest 4 + Testing Library + axe-core + Playwright (e2e) | |

## 2. Secciones reales (IDs verificados 2026-08-10)

`#home` (Hero) · `#perfil` · `#arquitectura` · `#experiencia` · `#confianza` (TrustBadges) · `#siem` · `#audit-hub` (con guion) · `#scaudit` · `#blog` · `#stack` · `#proyecto` (singular) · `#contacto` · Footer (sin id). Orden en `page.tsx`: Navbar → main(13) → AskAICopilotShell → Footer.

**Nota:** `#hero`/`#proyectos`/`#audithub` del prompt V2 **no existen** — usar los IDs reales.

**Hallazgo de auditoría (2026-08-10):** `#certificaciones` **no existía** como id de sección (el `<section>` de Certificaciones no lo tenía, aunque el JSON-LD del layout lo referencia). Corregido en este thread: `id="certificaciones"` añadido al `<section>` — cambio seguro de 1 línea que alinea el DOM con la metadata existente.

## 3. Fuentes

- **No hay `next/font` en el repo.** `globals.css` referencia `'Inter'` y `'JetBrains Mono'` como *fallbacks de sistema* (nunca se cargan). El plan de tipografía (Space Grotesk + JetBrains Mono vía `next/font`) es una mejora real, compatible con CSP (`font-src 'self' data:`).
- **Actualizado en Fase 5:** `src/app/fonts.ts` carga Inter (body) + Space Grotesk (headings) + JetBrains Mono (HUD/telemetría) vía `next/font/google`, self-hosted en `/_next/static/media/` (17 woff2). Verificado: cero requests de fuentes externas en runtime.

## 4. CSP vigente (`next.config.ts` headers)

`default-src 'self'`; `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://scaudit.vercel.app https://*.posthog.com`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: https:`; `font-src 'self' data:`; `connect-src 'self' https://scaudit.vercel.app https://*.vercel-scripts.com https://vitals.vercel-insights.com https://openrouter.ai https://*.posthog.com wss://*.posthog.com`; `worker-src 'self' blob:`; `frame-ancestors 'self'`.

**Implicación 3D:** `<Environment preset>` de drei (fetch externo) está **prohibido** → Lightformer/procedural o HDR self-hosted en `/public`. Draco/GLB solo self-hosted.

## 5. Tráfico de red legítimo existente

SCAudit RUM (`scaudit.vercel.app`, afterInteractive) · PostHog · OpenRouter (`/api/ask-ai`) · Vercel Insights. No confundir con dependencias 3D.

## 6. Inventario de visualizaciones (ver ADR-003)

| Componente | Estado | Decisión |
| --- | --- | --- |
| `MindMap3D.tsx` (+test) | **Código muerto** (solo importado por su test) | Borrar en Fase A; conservar `src/data/mindmap.ts` |
| `ParticleCanvas.tsx` (+test) | Hero (tsparticles 2D) | Retirar del Hero en Fase A; borrado final Fase 5 |
| `RadarSweep.tsx` | Hero desktop (2D, barato) | Conservar |
| `CaseStudyDetail.tsx` | Modal con `<Canvas>` R3F (transitorio) | Único 2º contexto WebGL permitido |

## 7. Baseline medido (2026-08-10, árbol actual)

| Métrica | Valor | Comando |
| --- | --- | --- |
| Typecheck | ✅ PASS (exit 0) | `npm run typecheck` |
| Tests | ✅ 25 archivos / **250 tests** PASS (29.8s) | `npm test` |
| Build | ✅ PASS (compilado 3.3s; static 8/8) | `npm run build` (Next 16.3 Turbopack) |
| Bundle | `.next/static` = **19 MB** / 416 chunks; mayor chunk **1054 KB**; siguientes 920 / 762 KB | `du -sh .next/static` |
| Audit | **2 moderadas** (mermaid DoS, GHSA-rhh3-jpg6-66xh — transitiva vía @streamdown) · **remediado post-Fase 8: 0 vulnerabilidades** (overrides `dompurify 3.4.13` + `mermaid 11.16.1`) | `npm audit` |
| Contextos WebGL en page load | **0** (MindMap3D muerto; solo se crea al abrir modal case study) | devtools |

**Lectura del baseline:** la app ya es pesada (~1 MB+ gz de JS principal por la combinación React 19 + framer-motion + tsparticles + AI SDK + three/drei). Por eso el Performance Contract del SPEC §31 es **relativo** (deltas de la capa 3D), no absoluto.

## 8. Estado del árbol de trabajo (importante)

Branch `remediation/portfolio-production-hardening` con cambios sin commitear de otro thread: `.github/workflows/ci.yml`, `.gitignore`, `README.md`, `eslint.config.mjs`, `next.config.ts`, `package*.json`, `tsconfig.json`, rutas API (`contact`, `chat` eliminado), `ObservabilityProvider.tsx`, `rate-limit.ts`, `server/` (nuevo). **Estos archivos no se tocan ni se stagean.** Los cambios de este plan quedan como archivos propios sin commitear (árbol compartido).

## 9. Riesgos detectados

1. Fondos opacos de las 13 secciones ocultarán un canvas fijo → pass de translucidez en Fase 4.
2. Hero con `bg-[var(--bg)]` opaco → hacerlo transparente en Fase 1 para que el canvas se vea.
3. Footer estático opaco (sibling de `main`) → necesita `relative z-40`.
4. Navbar `z-[100]`, drawer `z-[98/99]` → ya por encima del canvas (z-20). AskAICopilotShell z-index a verificar.
5. `frameloop="demand"` + micro-animaciones → invalidación híbrida (SPEC §10).
6. R3F en jsdom no renderiza → tests nuevos con mocks (patrón existente en `MindMap3D.test.tsx`).
