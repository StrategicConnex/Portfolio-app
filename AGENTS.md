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

<!-- BEGIN:sc-platform-universal-ai-skill -->
# SC PLATFORM UNIVERSAL AI SKILL v1.0 (ingeniería multi-agente)

Paquete de ingeniería universal vendorizado en `.agents/sc-platform-universal-ai-skill/` (también instalado en `~/.sc-platform-universal-ai-skill` para otros hosts). Aplica como **brain común** sobre cualquier tarea de ingeniería del repo — léelo junto a los docs del datacenter, no como reemplazo:

- `core/PRIME_DIRECTIVE.md` — OBSERVE → MODEL → PLAN → IMPLEMENT → VERIFY → REPORT; inspeccionar antes de modificar, cambios mínimos reversibles, nunca inventar hechos del proyecto, nunca exponer secretos.
- `core/COMMON_BRAIN.md` — contexto compartido de ingeniería (estándares y trade-offs).
- `docs/AGENT_PROTOCOL.md` — flujo: contexto compartido → análisis de especialista → hallazgos estructurados → resolución de conflictos del orquestador. Los hallazgos de **seguridad tienen prioridad sobre conveniencia**; las decisiones de arquitectura exigen trade-offs explícitos.
- `docs/ROUTING_POLICY.md` — routing de modelos FREE-first con fallback pago solo tras fallo/umbral de calidad (aplica al AI Copilot si se integra routing).
- `agents/*.md` — especialistas (architecture, frontend, 3d, security, devsecops, testing, ux, database, documentation) a consultar según el dominio de la tarea.
- `orchestrator/`, `adapters/`, `config/`, `website-intelligence/` — solo si la tarea toca orquestación multi-agente, adaptadores de proveedor o comparación de sitios.

**Prioridad de documentos:** si una directiva del SC Platform choca con CONSTITUTION/SPEC del datacenter, **ganan los invariantes del proyecto** (DOM-first, Copilot sagrado, CSP estricta, zero external runtime).
<!-- END:sc-platform-universal-ai-skill -->
