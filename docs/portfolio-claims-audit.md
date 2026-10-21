# Auditoría de claims del portfolio — Octubre 2026

Pasada de verificación sobre todas las secciones públicas del sitio, con el
mismo criterio aplicado antes a la sección **StrategicAudit Pro**: ninguna cifra
se publica como hecho si no se puede contrastar con el propio repositorio, con
un artefacto descargable o con la web pública del producto.

## Método

Cada afirmación numérica o de estado se clasificó en una de tres categorías:

| Categoría | Criterio |
|---|---|
| **Verificado** | Reproducible desde el repo o desde un artefacto servido (`/public`) |
| **Corregido** | Contradecía el repo, un estándar externo, o presentaba como actual algo imposible |
| **Abierto** | Dato personal o de cliente que solo el autor puede confirmar |

Comprobaciones ejecutadas: `tsc --noEmit`, `eslint`, 539 tests, `next build`, y
render SSR real en ES/EN sobre `next start` (grep de cadenas nuevas y obsoletas).

## Corregido

### 1. SIEM Dashboard — «datos en vivo de Radware»

**Antes:** *«Datos de amenaza en vivo basados en el mapa de Radware Live Threat
Map, intervalos de 1 hora»* + cabecera `RADWARE LIVE THREAT MAP — 1H`.

**Realidad:** el componente no hace ninguna petición de red. Las series salen de
`src/data/siem.ts` (arrays constantes) y se re-generan en el navegador cada
5,5 s con `randomizePercentages / randomizeThreatCounts / randomizeZones`.

**Ahora:** el panel se declara como demostración — insignia
`DEMO · TELEMETRÍA SIMULADA` y nota que aclara que los datos son simulados, no
provienen de una red real, de un cliente ni de Radware.

### 2. SIEM Dashboard — KPIs con unidades incoherentes

| Etiqueta | Valor anterior | Valor ahora |
|---|---|---|
| Ataques Bloqueados (24h) | `−30%` | `1.284` |
| Alertas Críticas Activas | `−10h/sem` | `3` |

Eran dos métricas del CV (`−30% incidentes`, `−10h de ahorro semanal`) colocadas
donde se espera un conteo. El bloque pasa a titularse **«KPIs de demostración»**.

### 3. Audit Hub — «Próximo Ciclo: 2024-Q3»

Una fecha de 2024 se mostraba como *ciclo próximo* en octubre de 2026. La
tarjeta ahora muestra **«Ciclo auditado: 2024-Q1»** y el panel lleva la insignia
`DATASET DE REFERENCIA` con una nota: hallazgos anonimizados y cifras
compuestas, sin corresponder a un informe de cliente publicado.

El mismo dato alimentaba al asistente **Ask Juan AI** (`src/features/ask-ai/lib/rag/sources.ts`),
que respondía con «Auditoría próxima: 2024-Q3». Se sustituyó por «Ciclo
auditado» más la advertencia de dataset de referencia.

### 4. Casos de estudio — garantía y etiqueta de impacto

- `MTTR reducido a 15 minutos **garantizados**` → `MTTR reducido de 4,2 h a 15 min`.
  Una garantía no es medible; el dato comparable es el par antes/después.
- Encabezado de sección `Impacto Real` → `Impacto Operativo`, y se añadió un
  descargo visible: *«Casos representativos: cifras compuestas y anonimizadas
  por NDA. No son informes de cliente publicados ni resultados auditados por un
  tercero.»*

### 5. Modal del caso de estudio

| Antes | Ahora | Motivo |
|---|---|---|
| `Incidente Real: Marzo 2026` | `Incidente representativo` + nota de secuencia compuesta | No es un incidente documentado y publicado |
| `Ahorro Generado` | `Ahorro estimado` | Es una proyección, no un resultado contable |
| `↑ 63% vs Inicial` | `35% → 98%` | La cobertura pasó de 35 % a 98 %: son **63 puntos porcentuales**, no un +63 % relativo (que sería +180 %) |
| `Stack: React 18, Three.js, GSAP, Tailwind CSS • 2026` | `Next.js 16 · React 19 · Three.js · Tailwind CSS` | `gsap` no está en `package.json`; React es 19.2.7 |
| Botón `Descargar Arquitectura PDF` | CTA `Hablar del proyecto` → `#contacto` | El botón no tenía handler y ese PDF no existe en `/public` |

### 6. Blog — artículos que no existen

Las tres tarjetas mostraban fecha de publicación (Abr/Mar/Feb 2024) y tiempo de
lectura (5, 7 y 6 min) de artículos **sin cuerpo y sin ruta**. `BLOG_POSTS` no
tiene `content`, y los botones «Leer más» y «Ver todos los artículos» no tenían
`onClick`.

**Ahora:** cada tarjeta indica `En preparación` / `Próximamente`, se retiraron
las fechas y los tiempos de lectura inventados y los dos controles muertos. El
asistente también dejó de presentarlos como publicados.

### 7. Perfil — «Disponibilidad de red garantizada»

→ `Disponibilidad de red (uptime medido)`. La tarjeta acompaña al `99.9 %`; el
compromiso de garantía no es verificable, la medición sí puede serlo.

## Verificado sin cambios

| Claim | Evidencia |
|---|---|
| `20+ años en el sector industrial` | Primera experiencia marzo 2003 → 23 años |
| Galería de 46 certificados | 46 archivos referenciados, 46 en `public/cursos`, **0 faltantes, 0 huérfanos** |
| «Cinco volúmenes» de la biblioteca | Cinco categorías `vol1…vol5` con archivos reales |
| `Next.js 16` en el stack | `package.json` → `next ^16.4.2` |
| Sección de estadísticas | Lee eventos reales (`readRecent`), sin cifras hardcodeadas |

## Puntos abiertos, resueltos por decisión del autor

Los seis puntos que quedaron pendientes en la primera pasada ya están cerrados:

### 1. MCSE y VCA-DCV — eliminadas

Salieron del bloque de certificaciones destacadas y de la tira de estándares de
`TrustBadges`. Sin PDF de respaldo y con ambos programas retirados por el
fabricante, no pasaban el criterio. Si aparecen los PDF históricos, se re-suben
marcadas explícitamente como *Retirada*.

### 2. Cisco CCNA — reclasificada

`Cisco CCNA Routing & Switching` → **`Cisco CCNA: Automatización y programación
de redes`**, que es exactamente lo que dice el certificado en
`public/cursos/CertificadoDeFinalizacion_Automatizacion y programacion de redes Cisco CCNA 2020.pdf`.
Se unificó además el nombre de la otra credencial Cisco (`Cisco Cybersecurity
Analyst`), que ya coincidía con su artefacto.

### 3. Marcos de cumplimiento — bloque propio

`SOX · NIST · ISO 27001 · IEC 62443` salió del array `certs`. Se añadió el array
`frameworks` y una sección **«Marcos de Trabajo y Normativas»** dentro de
Certificaciones, con IEC 62443, NIST CSF, ISO 27001, SOX y PMI · PMBOK, cada uno
con su descripción y una nota que aclara que no son credenciales personales.
La tira de `TrustBadges` pasó de «Certificaciones y estándares» a «Marcos y
estándares» y ya no incluye CCNA ni las retiradas.

### 4. Operadoras — anonimizadas

`YPF`, `PAE` y `Vista Oil` se sustituyeron por `Operadoras líderes · Oil & Gas`,
`Empresas de energía`, `Servicios petroleros` y `Cuenca Neuquina · Vaca Muerta`.
El bloque pasó de «Ecosistema de operadoras» a **«Ecosistema de clientes»**. La
capacidad técnica se conserva; la identidad del cliente, no.

### 5. Porcentajes de Experiencia — descargo visible

Se añadió una nota al pie en **Experiencia** y en **Perfil**:

> Métricas estimadas basadas en KPIs internos de proyectos y proyecciones de
> mejora; no son mediciones auditadas.

Aplica a `99.9 %`, `−30 %`, `−20 %`, `−10 h`, `+25 %`, `−15 %` y al resto de las
cifras de trayectoria.

### 6. Purdue — ISA-95 estricto

`Nivel 4/5 – Red Corporativa` → **`Nivel 4 – Red Corporativa (+ Nivel 5 Cloud)`**
en el dashboard SIEM, y la descripción SEO de la arquitectura ahora dice «hasta
el Nivel 4 (Red Corporativa), con integración a Nivel 5 (proveedores y cloud)».
El nivel 5 deja de presentarse como parte de la pirámide clásica.

## Consistencia con el asistente

`src/features/ask-ai/lib/rag/sources.ts` alimenta a **Ask Juan AI**, así que se
alineó con los cambios: dejó de citar MCSE, VCA-DCV y CCNA Routing & Switching,
lista los marcos como marcos y ya no anuncia una auditoría «próxima» de 2024.
Sin esto, el chatbot habría contradicho la página.

## Reproducir

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
npx next start -p 3111   # y comprobar el HTML servido
```
