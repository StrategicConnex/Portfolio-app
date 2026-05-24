# Juan Felipe Palacios - Portfolio

Portfolio personal de consultoría en IT/OT y ciberseguridad industrial. Especializado en infraestructuras críticas, modelo Purdue y el sector Oil & Gas en Vaca Muerta, Neuquén, Argentina.

## Stack Tecnológico
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion & @react-three/fiber
- OpenRouter API (AI Consultant)

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

## Medidas de Producción y Seguridad
- **CSP Estricto**: Configuraciones de cabeceras de seguridad estrictas (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) en `next.config.ts`.
- **Prevención SSR/Hydration**: Manejo robusto del renderizado condicional dependiente del tamaño de ventana (`window.innerWidth`).
- **Resiliencia de Chat AI**: Timeout configurado mediante `AbortController`, protección contra inyección de rol de sistema y rate limiting en memoria para la API.
- **Validación Segura**: Validaciones de payload usando Zod en el formulario de contacto para mitigar riesgos.
- **Builds Reproducibles**: Sin dependencias de red en tiempo de build para carga de fuentes, utilizando tipografías del sistema (`font-sans antialiased`).
- **Accesibilidad**: Respeto de preferencias globales de sistema (`prefers-reduced-motion`) implementadas globalmente en `globals.css`.
