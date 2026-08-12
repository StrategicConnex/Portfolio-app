<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:living-datacenter -->
# THE LIVING DATACENTER (experiencia 3D del portfolio)

Cualquier trabajo sobre la experiencia 3D del portfolio está gobernado por dos documentos, **léelos antes de escribir código**:

- `docs/datacenter/CONSTITUTION.md` — gobernanza: invariantes (DOM-first, 5 escenas, sin scroll hijacking, AI Copilot sagrado, cero dependencias externas en runtime, un solo contexto WebGL activo), priority order, change control, decision engine, stop conditions.
- `docs/datacenter/SPEC.md` — especificación técnica: capas Z, narrative map con los IDs reales de secciones, camera system, quality tiers, performance contract (baseline primero), fases con gates y formato de reporte.
- `docs/adr/ADR-003-visualization-consolidation-datacenter.md` — política de consolidación de contextos WebGL (MindMap3D es código muerto; modal case study es el único 2º contexto permitido).

Reglas mínimas que no requieren leer los documentos completos: el DOM es la fuente de verdad (el 3D es decorativo, `aria-hidden`, `pointer-events: none`); nunca modificar la lógica del AI Copilot (solo styling); nunca agregar dependencias externas en runtime (la CSP lo prohíbe); nunca interceptar el scroll nativo; respetar `prefers-reduced-motion` con `StaticPoster`; **nunca eliminar la foto ni el texto del Hero** (`#home`) — a lo sumo reacomodarlos sobre el canvas.
<!-- END:living-datacenter -->
