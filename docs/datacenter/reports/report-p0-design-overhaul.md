# Reporte P0 — Design Overhaul (paleta + tipografía)

> **Fase:** P0 (audit de diseño experto) · **Estado:** ✅ Ejecutado · **Gate:** clean
> **Commit:** `4ca7a93` · **Reporte:** SPEC §37

---

## 1. Diagnóstico

El audit de diseño experto (artista 3D + director creativo) identificó 3 problemas
centrales que impedían que el sitio ganara un Awwward:

1. **Paleta plana:** 7 colores compitiendo, todos fríos. El amber era amarillo
   genérico (`#f59e0b` = Bootstrap warning). Sin contraste térmico dramático.
2. **Tipografía genérica:** Inter + Space Grotesk funcionaban pero no tenían
   personalidad. Hero title a 3rem (demasiado pequeño para un portfolio premiado).
   5 tamaños similares sin jerarquía clara.
3. **Glass genérico:** `backdrop-filter: blur(12px)` en todas las cards = plantilla AI.

Los 3 problemas caen en las "trampas de dark mode AI defaults" que el
`frontend-design` skill identifica explícitamente.

---

## 2. Cambios ejecutados

### 2.1 Paleta (tokens.ts + CSS variables)

| Antes | Después | Razón |
| --- | --- | --- |
| `secondaryBlue: '#38bdf8'` | **eliminado** → `primaryCold` | 2 azules compitiendo; consolidado a 1 |
| `securityAmber: '#f59e0b'` | `'#c27a3a'` (infrared) | Rojizo industrial, no amarillo Bootstrap |
| — | `surface: '#0d1520'` (nuevo) | Superficie para cards/glass, separado del bg |
| `--card: #0B1526` | `--card: #0d1520` | Consistente con `surface` del token |
| `--border: rgba(255,255,255,0.1)` | `rgba(255,255,255,0.06)` | Más sutil, premium |
| `--accent: rgba(232,213,172,0.15)` | `rgba(232,213,172,0.12)` | Menos ruidoso |

**Nueva semántica de color (6 tokens, antes 7):**
- `bg` = fondo profundo · `surface` = cards/superficies
- `primaryCold` = infraestructura (azul instrumental)
- `dataCyan` = flujos de datos (cian, más verde que el azul)
- `securityAmber` = resiliencia (infrared, NO amarillo)
- `gold` = conexión/clímax (champagne)

### 2.2 Referencias actualizadas (10 archivos)

| Archivo | Cambio |
| --- | --- |
| `datacenter.tokens.ts` | Palette + PHASE_TINTS (amber rojizo, architecture = primaryCold) |
| `datacenter.focus.ts` | `secondaryBlue` → `primaryCold` (5 nodos) |
| `CopilotNode.tsx` | `secondaryBlue` → `primaryCold` |
| `DatacenterScene.tsx` | `secondaryBlue` → `primaryCold` (2 HUD labels) |
| `screenUiTexture.ts` | `secondaryBlue` → `primaryCold` (SIEM header cells) |
| `datacenter.storyline.ts` | `#f59e0b` → `#c27a3a` (photon color S4) |
| `FailoverStreams.tsx` | `#f59e0b` → `#c27a3a` (AMBER constant) |

### 2.3 Tipografía radical (Hero.tsx + SectionHeader.tsx)

| Elemento | Antes | Después |
| --- | --- | --- |
| Hero title | `clamp(1.5rem,7vw,3rem)` / `clamp(2.6rem,5vw,4.4rem)` | `clamp(2.2rem,8vw,4.5rem)` / `clamp(3.5rem,7vw,7rem)` |
| Hero leading | `1.05` | `0.95` (más apretado = más impacto) |
| Hero tracking | `-0.02em` | `-0.04em` (más tight = más editorial) |
| Section titles | `clamp(1.9rem, 3.8vw, 3rem)` | `clamp(2rem, 5vw, 3.5rem)` |
| Section leading | `1.08` | `1.05` |

**Jerarquía de 3 tamaños claros:**
1. **Display** (hero): 3.5–7rem — el titular que se recuerda
2. **Heading** (secciones): 2–3.5rem — estructura editorial
3. **Body** (contenido): 16px — legibilidad

### 2.4 CSS cleanup

| Antes | Después |
| --- | --- |
| `.glass { blur(12px) }` | `.glass { blur(8px), bg: surface }` — más sutil |
| `.gradient-text` | **eliminado** (genérico de plantilla) |
| `.glow-blue { 20px + 40px shadow }` | `.glow-blue { 30px single shadow }` — más sutil |

---

## 3. Gate

| Check | Resultado |
| --- | --- |
| Typecheck | ✅ 0 errores |
| Tests | ✅ 399/399 |
| Lint | ✅ 0 |
| Build | ✅ Compiled successfully |

Sin cambios de runtime (solo tokens + CSS + un par de constantes hardcodeadas).

## 4. Qué se preservó

- **Todos los invariantes del SPEC §3:** DOM-first, pointer-events:none en canvas,
  aria-hidden, sin scroll hijacking, AI Copilot intacto, CSP estricta.
- **Toda la narrativa:** storyline, fotón, failover, haz WAN, Purdue, Phase Gate.
- **Toda la funcionalidad:** i18n, adaptive quality, bridges, GLBs, reduce-motion.
- **Los SVGs de icons** se mantienen con `#f59e0b` (son assets decorativos, no runtime).

## 5. Rollback

Revertir es `git checkout` de los 10 archivos. Los tokens originales están en el
commit anterior (`ce355ff`).
