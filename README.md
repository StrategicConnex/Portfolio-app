# Juan Felipe Palacios - Portfolio

Portfolio personal de consultoría en IT/OT y ciberseguridad industrial. Especializado en infraestructuras críticas, modelo Purdue y el sector Oil & Gas en Vaca Muerta, Neuquén, Argentina.

## Stack Tecnológico
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion & @react-three/fiber
- Vercel AI SDK + Google Gemini (`/api/ask-ai`)
- OpenRouter API fallback (`/api/chat`)
- StrategicAudit Pro RUM (`https://scaudit.vercel.app/scripts/vitals.js`)

## Desarrollo Local
```bash
npm install
npm run dev
```

## Producción
```bash
npm run build
npm start
```

## Variables de Entorno para Vercel

Configurar en Project Settings → Environment Variables:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=...
GOOGLE_GENERATIVE_AI_MODEL=gemini-2.0-flash-001
OPENROUTER_API_KEY=...
RESEND_API_KEY=...
CONTACT_TO_EMAIL=...
CONTACT_FROM_EMAIL=...
```

Notas:
- `GOOGLE_GENERATIVE_AI_API_KEY` es obligatoria para `/api/ask-ai`.
- `GOOGLE_GENERATIVE_AI_MODEL` es opcional; si falta, usa `gemini-2.0-flash-001`.
- `OPENROUTER_API_KEY` mantiene operativo el endpoint legacy `/api/chat`.
- Las variables `RESEND_*` y `CONTACT_*` son necesarias para que `/api/contact` no devuelva error 500.

## Verificación Pre-Deploy

```bash
npm run lint
npm run build
```

## Medidas de Producción y Seguridad
- **CSP Estricto**: Configuraciones de cabeceras de seguridad estrictas (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) en `next.config.ts`.
- **Prevención SSR/Hydration**: Manejo robusto del renderizado condicional dependiente del tamaño de ventana (`window.innerWidth`).
- **Resiliencia de Chat AI**: `/api/ask-ai` usa AI SDK UIMessage streams y valida configuración del proveedor antes de ejecutar.
- **Validación Segura**: Validaciones de payload usando Zod en el formulario de contacto para mitigar riesgos.
- **Builds Reproducibles**: Sin dependencias de red en tiempo de build para carga de fuentes, utilizando tipografías del sistema (`font-sans antialiased`).
- **Accesibilidad**: Respeto de preferencias globales de sistema (`prefers-reduced-motion`) implementadas globalmente en `globals.css`.
