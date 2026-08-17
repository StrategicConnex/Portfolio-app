# Plan de Implementacion StrategicAudit Pro RUM v2.0

> ## ⚠️ ESTADO: EJECUTADO
>
> Este plan se implementó por completo. La integración RUM está en `src/app/layout.tsx`:
>
> ```tsx
> <Script
>   src={SITE.scaudit.scriptUrl}            // https://scaudit.vercel.app/scripts/vitals.js
>   strategy="afterInteractive"
>   data-project-id="7c9945ad-c235-484d-98fa-1d8fe7e9ee40"
>   data-api-url={SITE.scaudit.apiUrl}      // https://scaudit.vercel.app/api/telemetry/vitals
>   data-sampling="1.0"
>   data-spa-tracking="true"
>   data-batch-size="10"
>   data-flush-interval="15000"
> />
> ```
>
> Con guard de entorno: solo se carga con `NODE_ENV === 'production'` **y** host no-localhost (la API de telemetría rechaza orígenes no desplegados con CORS). `unpkg.com` **no** se agregó a la CSP (ADR-001 lo eliminó). Checklist RUM-01..RUM-10 → **Hecho**. Se conserva como registro histórico; el estado vigente está en `README.md`.

---

> Archivo preparado para implementar la auditoria RUM desde `https://scaudit.vercel.app` en `juanpalacios.vercel.app`, optimizado para ejecutarse con Gemini 3.1 Flash en Google Antigravity.

---

## 1. Objetivo

Implementar correctamente **StrategicAudit Pro Real User Monitoring v2.0** en el portfolio `juanpalacios.vercel.app`, enviando telemetria frontend real a:

```txt
https://scaudit.vercel.app/api/telemetry/vitals
```

El sistema debe capturar:

- Web Vitals: LCP, CLS, INP, FID, FCP, TTFB.
- Timing de navegacion.
- Sesion de usuario anonima.
- Navegacion SPA.
- Errores JavaScript.
- Promesas no manejadas.
- Interacciones clave.
- Recursos criticos lentos.
- Informacion basica de dispositivo, navegador y conexion.
- Retry queue para fallos temporales de red.

---

## 2. Contexto Del Proyecto

El portfolio ya tiene una integracion parcial del script RUM en:

```txt
src/app/layout.tsx
```

Actualmente existe una carga similar a:

```tsx
<Script
  src="https://scaudit.vercel.app/scripts/vitals.js"
  data-project-id="7c9945ad-c235-484d-98fa-1d8fe7e9ee40"
  defer
/>
```

Tambien existe una CSP configurada en:

```txt
next.config.ts
```

La CSP actual ya permite:

```txt
https://scaudit.vercel.app
```

en `script-src` y `connect-src`.

---

## 3. Diagnostico Tecnico

| Area | Estado | Accion recomendada |
|---|---|---|
| Script RUM | Ya existe integracion parcial. | Completar atributos y usar `strategy="afterInteractive"`. |
| CSP | Permite `scaudit.vercel.app`. | Mantener politica estricta. |
| Web Vitals | El snippet propuesto carga `web-vitals` desde `unpkg.com`. | Evitar `unpkg.com`; empaquetar o servir desde `scaudit.vercel.app`. |
| SPA tracking | El snippet intercepta `pushState`, `replaceState` y `popstate`. | Agregar nuevo `pageview` despues de cada navegacion SPA. |
| Flush final | Puede dispararse varias veces. | Agregar guard contra duplicados. |
| Privacidad | No envia UA completo, correcto. | Sanitizar texto de interacciones. |
| Retry | Usa `localStorage`, correcto. | Limitar tamano y TTL si el backend lo requiere. |

---

## 4. Riesgos Principales

| Riesgo | Descripcion | Mitigacion |
|---|---|---|
| CSP bloquea Web Vitals | `https://unpkg.com` no esta permitido en `script-src`. | No usar `unpkg.com`; servir dependencia desde `scaudit.vercel.app`. |
| Eventos duplicados | `visibilitychange`, `pagehide` y `beforeunload` pueden llamar `flush(true)`. | Usar `finalSentForPage`. |
| Pageviews SPA incompletos | El snippet resetea estado pero no siempre encola nuevo pageview. | Encolar `pageview` en `onNavigate()`. |
| Payload sensible | `textContent` de clicks podria contener email/telefono. | Sanitizar texto. |
| Payload excesivo | Errores, interacciones y recursos pueden crecer. | Limitar arrays y tamano en cliente y backend. |
| Vendor externo | `unpkg.com` agrega dependencia y posible bloqueo. | Empaquetar `web-vitals` dentro del script RUM. |

---

## 5. Fase 1 - Auditoria Inicial Del Repo

Gemini debe revisar primero:

```txt
package.json
src/app/layout.tsx
next.config.ts
src/app/page.tsx
README.md
headers.txt
```

Validar:

| Punto | Que revisar |
|---|---|
| Next.js | Confirmar version real del proyecto. |
| Script actual | Verificar si ya existe `https://scaudit.vercel.app/scripts/vitals.js`. |
| CSP | Confirmar `script-src` y `connect-src`. |
| Build actual | Ejecutar validacion antes de cambios. |
| Duplicados | Evitar insertar el script dos veces. |

Comandos:

```bash
npm run lint
npm run build
```

---

## 6. Fase 2 - Estrategia Correcta Para Web Vitals

No implementar el snippet si depende de:

```js
https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js
```

### Decision recomendada

| Opcion | Decision |
|---|---|
| Cargar `web-vitals` desde `unpkg.com` | No recomendado. |
| Agregar `unpkg.com` a CSP | Evitar. |
| Servir `web-vitals` desde `scaudit.vercel.app` | Aceptable. |
| Empaquetar `web-vitals` dentro de `vitals.js` | Mejor opcion. |

Instruccion para Gemini:

```txt
Asume que https://scaudit.vercel.app/scripts/vitals.js debe contener internamente web-vitals o debe cargarlo desde el mismo dominio scaudit.vercel.app. No agregues unpkg.com a la CSP salvo que sea estrictamente necesario.
```

---

## 7. Fase 3 - Actualizar Integracion En `layout.tsx`

Archivo:

```txt
src/app/layout.tsx
```

Reemplazar la integracion parcial por:

```tsx
<Script
  src="https://scaudit.vercel.app/scripts/vitals.js"
  strategy="afterInteractive"
  data-project-id="7c9945ad-c235-484d-98fa-1d8fe7e9ee40"
  data-api-url="https://scaudit.vercel.app/api/telemetry/vitals"
  data-sampling="1.0"
  data-spa-tracking="true"
  data-batch-size="10"
  data-flush-interval="15000"
/>
```

Reglas:

- Usar `strategy="afterInteractive"`.
- No usar `defer` junto con `next/script`.
- No duplicar scripts.
- Mantener metadata, JSON-LD y `LanguageProvider`.
- No modificar el diseno del sitio.

---

## 8. Fase 4 - Ajustar CSP En `next.config.ts`

Archivo:

```txt
next.config.ts
```

La CSP debe permitir:

```txt
script-src https://scaudit.vercel.app
connect-src https://scaudit.vercel.app
```

CSP recomendada:

```ts
{
  key: 'Content-Security-Policy',
  value:
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://scaudit.vercel.app; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://scaudit.vercel.app https://*.vercel-scripts.com https://vitals.vercel-insights.com; " +
    "frame-ancestors 'none';"
}
```

No agregar comodines como:

```txt
script-src *
connect-src *
```

No agregar `https://unpkg.com` salvo que sea obligatorio.

---

## 9. Fase 5 - Mejoras Obligatorias Al Script RUM

Si Gemini tambien modifica o publica `vitals.js` en `scaudit.vercel.app`, debe aplicar estas mejoras.

### 9.1 Evitar eventos finales duplicados

```js
let finalSentForPage = false;

function flush(isFinal = false) {
  if (isFinal && finalSentForPage) return;
  if (isFinal) finalSentForPage = true;

  // resto del flush
}
```

### 9.2 Registrar nuevo pageview en navegacion SPA

```js
function onNavigate() {
  if (location.href === currentUrl) return;

  flush(true);

  finalSentForPage = false;
  pageStart = Date.now();
  currentUrl = location.href;
  currentPath = location.pathname + location.search;
  vitals = {};
  pageViews++;
  errors = [];
  interactions = [];
  resources = [];

  enqueue('pageview', {
    url: currentUrl,
    path: currentPath,
    referrer: document.referrer,
    spa: true,
  });

  setTimeout(() => flush(false), 250);
}
```

### 9.3 Sanitizar interacciones

```js
function sanitizeText(text) {
  return String(text || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]')
    .trim()
    .substring(0, 50);
}
```

Aplicar en clicks:

```js
text: sanitizeText(el.textContent)
```

### 9.4 Logs solo con debug

```js
const DEBUG = script.getAttribute('data-debug') === 'true';

function debugLog() {
  if (DEBUG) console.log.apply(console, arguments);
}
```

Reemplazar:

```js
console.log('[SA-RUM] StrategicAudit RUM activo. Session:', sessionId);
```

por:

```js
debugLog('[SA-RUM] StrategicAudit RUM activo. Session:', sessionId);
```

---

## 10. Fase 6 - Contrato Backend En StrategicAudit Pro

El endpoint:

```txt
POST https://scaudit.vercel.app/api/telemetry/vitals
```

debe aceptar:

```ts
type RumPayload = {
  projectId: string;
  sessionId: string;
  timestamp: string;
  url: string;
  path: string;
  referrer?: string;
  device?: object;
  connection?: object | null;
  memory?: object | null;
  timing?: object | null;
  vitals?: object;
  pageViews?: number;
  sessionDuration?: number;
  timeOnPage?: number;
  errors?: unknown[];
  interactions?: unknown[];
  resources?: unknown[];
  events?: unknown[];
  isFinal?: boolean;
};
```

Validaciones backend:

| Validacion | Regla |
|---|---|
| `projectId` | Obligatorio y registrado. |
| `sessionId` | Obligatorio. |
| Payload size | Rechazar payloads excesivos. |
| Origin | Permitir `https://juanpalacios.vercel.app` y previews autorizados. |
| Rate limit | Por `projectId + sessionId + IP`. |
| Duplicados | Deduplicar finales repetidos. |
| Privacidad | No guardar UA completo ni datos sensibles. |

---

## 11. Fase 7 - Pruebas Locales

Despues de modificar `layout.tsx` y `next.config.ts`:

```bash
npm run lint
npm run build
npm run dev
```

En navegador, validar:

1. Carga el script:

```txt
https://scaudit.vercel.app/scripts/vitals.js
```

2. Se envia POST a:

```txt
https://scaudit.vercel.app/api/telemetry/vitals
```

3. No hay errores CSP.
4. Se registra `pageview`.
5. Se registran Web Vitals cuando estan disponibles.
6. Se capturan errores JS de prueba.
7. Se capturan clicks sanitizados.
8. Al ocultar la pestana se envia `isFinal`.
9. Al navegar en SPA se registra un nuevo pageview.

---

## 12. Fase 8 - Pruebas En Preview / Produccion

| Prueba | Resultado esperado |
|---|---|
| Carga inicial | Se envia `pageview`. |
| Web Vitals | LCP, CLS, INP/FID, FCP y TTFB aparecen si estan disponibles. |
| Error JS manual | Se captura en `errors`. |
| Click en boton | Se registra interaccion sanitizada. |
| Cambio SPA | Se envia final de pagina anterior y nuevo pageview. |
| Cierre de pestana | Usa `sendBeacon`. |
| CSP | Sin bloqueos en consola. |
| Dashboard StrategicAudit | Sesion, path, vitals y eventos visibles. |

---

## 13. Fase 9 - Rollout Seguro

### Staging / Preview

```tsx
data-sampling="1.0"
```

### Produccion inicial

```tsx
data-sampling="0.25"
```

### Produccion estable

```tsx
data-sampling="0.5"
data-flush-interval="15000"
```

### Auditoria puntual

```tsx
data-sampling="1.0"
data-flush-interval="10000"
```

Subir a `1.0` solo si:

- No hay errores CSP.
- No hay exceso de duplicados.
- El backend soporta el volumen.
- El dashboard muestra datos consistentes.

---

## 14. Checklist Final

| ID | Criterio | Estado |
|---|---|---|
| RUM-01 | No hay script duplicado. | Hecho |
| RUM-02 | `layout.tsx` usa `strategy="afterInteractive"`. | Hecho |
| RUM-03 | `data-api-url` apunta a `https://scaudit.vercel.app/api/telemetry/vitals`. | Hecho |
| RUM-04 | CSP permite `scaudit.vercel.app`. | Hecho |
| RUM-05 | No se agrega `unpkg.com` salvo necesidad real. | Hecho (ADR-001) |
| RUM-06 | `npm run lint` pasa. | Hecho |
| RUM-07 | `npm run build` pasa. | Hecho |
| RUM-08 | El dashboard recibe pageviews. | Hecho (producción) |
| RUM-09 | Navegacion SPA genera pageviews nuevos. | Hecho |
| RUM-10 | `sendBeacon` funciona en cierre/ocultamiento. | Hecho |

---

## 15. Prompt Optimizado Para Gemini 3.1 En Google Antigravity

Copiar y pegar en Gemini:

```txt
Actua como Staff Fullstack Engineer especializado en Next.js, Vercel, CSP, Real User Monitoring y observabilidad frontend.

Objetivo:
Implementar correctamente StrategicAudit Pro RUM v2.0 en el portfolio juanpalacios.vercel.app, enviando metricas a https://scaudit.vercel.app/api/telemetry/vitals.

Contexto:
El proyecto usa Next.js App Router, React 19, Tailwind y Vercel.
Ya existe una integracion parcial del script en src/app/layout.tsx.
La CSP esta en next.config.ts.
No debes romper SEO, JSON-LD, LanguageProvider ni el layout actual.

Archivos a revisar primero:
- package.json
- src/app/layout.tsx
- next.config.ts
- src/app/page.tsx
- README.md
- headers.txt

Tareas:
1. Verificar si el script RUM ya esta instalado.
2. Evitar duplicar el script.
3. Actualizar el Script de Next.js para usar:
   - strategy="afterInteractive"
   - data-project-id="7c9945ad-c235-484d-98fa-1d8fe7e9ee40"
   - data-api-url="https://scaudit.vercel.app/api/telemetry/vitals"
   - data-sampling="1.0"
   - data-spa-tracking="true"
   - data-batch-size="10"
   - data-flush-interval="15000"
4. Verificar CSP en next.config.ts:
   - script-src debe permitir https://scaudit.vercel.app
   - connect-src debe permitir https://scaudit.vercel.app
5. No agregar https://unpkg.com salvo que sea estrictamente necesario.
6. Si el script vitals.js depende de web-vitals, recomendar empaquetarlo dentro de https://scaudit.vercel.app/scripts/vitals.js o servirlo desde el mismo dominio.
7. Mantener headers de seguridad existentes.
8. Ejecutar npm run lint.
9. Ejecutar npm run build.
10. Entregar un resumen con archivos modificados, riesgos y pruebas realizadas.

Restricciones:
- No reescribas el layout completo.
- No elimines metadata, JSON-LD ni LanguageProvider.
- No relajes CSP con comodines.
- No agregues dependencias si no hacen falta.
- No cambies el diseno visual del sitio.
- No implementes analytics de terceros adicionales.
```

---

## 16. Resultado Esperado

Al finalizar:

- `juanpalacios.vercel.app` carga el RUM desde `scaudit.vercel.app`.
- El script envia metricas reales a StrategicAudit Pro.
- No hay errores de CSP.
- No se carga `unpkg.com` innecesariamente.
- La navegacion SPA se registra correctamente.
- Los eventos finales no se duplican de forma excesiva.
- `npm run lint` y `npm run build` pasan.
- El dashboard de StrategicAudit Pro muestra sesiones, paths, Web Vitals, errores y recursos criticos.
