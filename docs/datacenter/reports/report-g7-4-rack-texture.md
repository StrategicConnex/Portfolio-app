# PHASE G7.4 — TEXTURA RACK HERO OPTIMIZADA (server_rack_v03_tex → 2048 WebP)

**PHASE:** G7.4 — optimización de textura del rack hero (cierre del ítem abierto del audit)
**STATUS:** ✅ COMPLETE — GATE PASS
**DATE:** 2026-08-12

## PROBLEMA / CONTEXTO
La textura del rack hero promovido (Tripo) viajaba como JPEG 4096² de 2.29 MB
(97% del peso del asset) — mismo caso que el storage en G7.3, último ítem de
texturas abierto del audit.

## IMPLEMENTED
1. **Re-encode con `sharp`** → `server_rack_v03_tex.webp` (2048², q82):
   **2.29 MB → 103 KB (−95%)**. A 2048² la cámara de S1 (rack hero encuadrado
   a 20–32% del alto desktop) no distingue la pérdida.
2. **Patch del GLB** (mismo método G7.3): `images[0].uri` → `server_rack_v03_tex.webp`,
   `mimeType` eliminado (el loader resuelve por extensión).
3. **Provenance:** JPEG original → kit como `server_rack_v03_tex-src.jpg`;
   webp y GLB sincronizados en `04-rack/raw/`; captura runtime actualizada.
   `/public` quedó sin la JPEG (solo la webp, `img-src 'self'`).
4. **Server reiniciado** (next start mapea /public al arranque).

## EVIDENCIA
- **Runtime (navegador real, S1):** HEAD 200 → GLB 200 → tex.webp 200, canvas
  vivo, 0 errores de consola 3D (solo CORS telemetry preexistente).
- **Comparación visual cuantitativa** `rack-webp-s1.png` vs baseline `tripo-v03-s1c.png`
  (con JPEG): **diff media 0.5/255, luminosidad 26.9 vs 26.7** — prácticamente
  idénticas, la textura webp carga y renderiza igual.

## IMPACTO DE PAYLOAD (`/public/assets/3d`)
| Métrica | Antes | Después |
|---|---|---|
| Texturas | 2.77 MB (2.29 rack + 0.48 storage) | **0.57 MB** (0.10 rack + 0.48 storage) |
| Total dir | 3.42 MB | **1.33 MB** |
| GLBs | 0.77 MB ✅ | 0.77 MB ✅ (< 3 MB SPEC §12) |

## ARCHITECTURAL IMPACT: LOW (SAFE — assets + docs, cero código)
## ACCESSIBILITY / CSP / I18N / COPILOT: SIN CAMBIO
## GATE: PASS ✅
## NEXT: deploy preview a Vercel para QA en dispositivo real (QA-DEVICE-CHECKLIST.md) · display SIEM (S3/S5) cuando llegue su output · postprocesado bloom (evaluación pendiente).
