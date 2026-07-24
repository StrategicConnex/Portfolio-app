# Prompt Para Gemini 3.1 - Seccion SCAudit En Portfolio

Copiar y pegar en Gemini 3.1 dentro de Google Antigravity.

```txt
Actua como Principal Frontend Engineer, Senior Product Designer y Next.js/Vercel Expert.

Objetivo:
En el sitio portfolio `juanpalacios.vercel.app`, ubicado en:

C:\Users\Juan\OneDrive\Documentos\Antigravity\Personal\Portfolio\portfolio-app

desarrollar una nueva seccion publica llamada `scaudit` o `StrategicAudit Pro`, dedicada a presentar las funcionalidades, beneficios y capacidades de la app StrategicAudit Pro, disponible en:

https://scaudit.vercel.app

El codigo fuente de StrategicAudit Pro se encuentra en:

C:\Users\Juan\OneDrive\Documentos\Antigravity\StrategicAudit Pro\strategicaudit-pro

Tu tarea es analizar ambos proyectos antes de implementar:

1. El portfolio actual.
2. La app StrategicAudit Pro.
3. La identidad visual, funcionalidades y propuesta de valor de `scaudit.vercel.app`.

Luego debes crear una seccion premium, visual, clara y orientada a conversion dentro del portfolio de Juan.

Contexto del portfolio:
El sitio pertenece a Juan Felipe Palacios, perfil profesional orientado a:

- Ciberseguridad industrial.
- IT/OT.
- Redes.
- Infraestructura critica.
- Oil & Gas.
- Vaca Muerta.
- SIEM.
- Compliance.
- Auditoria tecnica.
- Automatizacion.
- AI y SaaS engineering.

La nueva seccion debe integrarse naturalmente con esta identidad.

Nombre sugerido de la seccion:
`StrategicAudit Pro`
o
`SCAudit Platform`

Ubicacion:
Agregar la seccion dentro de la home, idealmente despues de `AuditHub` o despues de `SIEMDashboard`, antes de `Blog` o `Stack`.

Debes revisar primero estos archivos del portfolio:

- package.json
- src/app/page.tsx
- src/app/layout.tsx
- src/app/globals.css
- src/components/AuditHub.tsx
- src/components/SIEMDashboard.tsx
- src/components/Proyecto.tsx
- src/components/Stack.tsx
- src/components/ui/SectionHeader.tsx
- src/components/ui/FadeIn.tsx
- src/context/LanguageContext.tsx
- public/

Debes revisar en StrategicAudit Pro estos archivos o carpetas:

- package.json
- README.md
- src/app
- src/components
- src/features
- src/server
- src/shared
- src/app/api
- public/
- cualquier archivo relacionado con dashboard, auditorias, inteligencia, RUM, telemetria, proyectos, metricas o reportes.

Objetivo de la seccion:
Mostrar StrategicAudit Pro como una plataforma SaaS profesional para auditoria tecnica, monitoreo, inteligencia y observabilidad de proyectos web o infraestructura digital.

La seccion debe explicar visualmente que SCAudit permite:

- Auditar proyectos web.
- Medir Web Vitals.
- Capturar Real User Monitoring.
- Analizar performance.
- Revisar SEO tecnico.
- Detectar errores frontend.
- Monitorear sesiones.
- Centralizar metricas.
- Generar reportes.
- Usar AI/inteligencia para analisis tecnico.
- Visualizar dashboards.
- Integrar telemetria desde sitios externos.
- Revisar postura tecnica de aplicaciones desplegadas.

Requisitos de diseno:
La seccion debe sentirse premium, enterprise y alineada al diseno actual del portfolio.

Debe usar:

- Fondo oscuro.
- Estetica de dashboard tecnico.
- Cards sobrias.
- Bordes finos.
- Gradientes sutiles azul/dorado.
- Microinteracciones con Framer Motion si ya se usa en el proyecto.
- Iconos existentes si estan disponibles.
- Visuales reales o capturas/imagenes relacionadas con SCAudit.
- CTA claro hacia `https://scaudit.vercel.app`.

No crear una landing generica.
No usar texto superficial.
No usar una seccion excesivamente marketinera.
Debe parecer una pieza real de portfolio/product showcase tecnico.

Contenido minimo de la seccion:

1. Header de seccion:
   - Label: `Producto SaaS`
   - Titulo: `StrategicAudit Pro`
   - Highlight: `SCAudit`

2. Descripcion principal:
   Explicar que StrategicAudit Pro es una plataforma para auditoria tecnica, RUM, Web Vitals, SEO tecnico e inteligencia operativa para aplicaciones modernas.

3. Cards de funcionalidades:
   Crear entre 6 y 8 cards, por ejemplo:
   - Real User Monitoring
   - Web Vitals Dashboard
   - Auditoria Tecnica
   - SEO & Metadata Analysis
   - Error Tracking
   - AI Intelligence Reports
   - Project Health Score
   - Performance & Resource Insights

4. Bloque visual:
   Incluir imagenes o capturas.
   Si existen assets reales en el repo de StrategicAudit Pro, reutilizarlos.
   Si no existen, usar una composicion visual con cards tipo dashboard.
   No usar imagenes rotas.
   No referenciar assets inexistentes.

5. Metricas destacadas:
   Ejemplos:
   - Core Web Vitals
   - LCP / CLS / INP
   - RUM Sessions
   - Error Rate
   - Project Score
   - SEO Health

6. CTA:
   Boton principal:
   `Abrir SCAudit`
   con link externo:
   `https://scaudit.vercel.app`

   Boton secundario opcional:
   `Ver funcionalidades`
   o scroll interno.

7. Integracion bilingue:
   Si el portfolio usa `LanguageContext`, agregar textos en espanol e ingles.
   No hardcodear todos los textos si el patron actual del sitio usa traducciones.

8. Accesibilidad:
   - Alt text en imagenes.
   - Links externos con `target="_blank"` y `rel="noopener noreferrer"`.
   - Contraste suficiente.
   - Responsive mobile/desktop.

Archivos esperados:
Crear preferentemente:

src/components/SCAudit.tsx

Luego importarlo dinamicamente en:

src/app/page.tsx

Ejemplo:

const SCAudit = dynamic(() => import('@/components/SCAudit'))

Y ubicarlo dentro del `<main>`.

Si se agregan traducciones, modificar:

src/context/LanguageContext.tsx

Si se agregan imagenes nuevas, colocarlas en:

public/

con nombres claros, por ejemplo:

public/scaudit-dashboard.webp
public/scaudit-vitals.webp
public/scaudit-report.webp

Reglas tecnicas:
- No romper el build.
- No eliminar componentes existentes.
- No modificar el diseno global salvo que sea necesario.
- No introducir dependencias nuevas si no hacen falta.
- Usar los patrones existentes del portfolio.
- Usar `next/image` para imagenes.
- Usar `dynamic` si el componente queda debajo del fold.
- Mantener compatibilidad con Next.js 16 y React 19.
- Mantener Tailwind v4.
- Mantener estilo visual consistente con `AuditHub`, `SIEMDashboard` y `Stack`.

Validaciones obligatorias:
Despues de implementar ejecutar:

npm run lint
npm run build

Si falla algo:
- corregirlo;
- no dejar errores de TypeScript;
- no dejar imports rotos;
- no dejar imagenes inexistentes.

Entrega final:
Al terminar, entregar:

1. Archivos modificados.
2. Descripcion breve de la nueva seccion.
3. Donde se inserto en la home.
4. Que assets se usaron.
5. Resultado de `npm run lint`.
6. Resultado de `npm run build`.
7. Riesgos o mejoras futuras.

Criterios de aceptacion:
- Existe una seccion visible llamada StrategicAudit Pro / SCAudit.
- La seccion representa correctamente la app `https://scaudit.vercel.app`.
- Incluye funcionalidades reales inferidas del repo `strategicaudit-pro`.
- Incluye al menos una imagen o visual de producto.
- Tiene CTA funcional hacia `https://scaudit.vercel.app`.
- Es responsive.
- Mantiene la identidad IT/OT/cybersecurity del portfolio.
- Pasa lint y build.

Importante:
No asumas funcionalidades que no existan en el codigo de StrategicAudit Pro. Si una funcionalidad parece estar en roadmap o parcialmente implementada, describela como capacidad futura o modulo en evolucion. Prioriza lo que puedas comprobar leyendo el codigo.
```
