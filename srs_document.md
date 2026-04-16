# Documento de Especificación de Requerimientos de Software (SRS)
**Proyecto:** Portfolio Web Profesional – Juan Felipe Palacios  
**Versión:** 1.0  
**Fecha:** Abril 2025  
**Autor:** Juan Felipe Palacios  
**Estado:** Borrador inicial

---

## 1. Introducción

### 1.1 Propósito
Este documento define los requerimientos funcionales y no funcionales para el desarrollo de una aplicación web de portfolio profesional. El sistema debe representar la trayectoria, competencias técnicas y proyectos del Arq. Juan Felipe Palacios, especialista en Ciberseguridad IT/OT, con el objetivo de posicionarlo ante empresas del sector industrial y Oil & Gas.

### 1.2 Alcance
La aplicación es un sitio web estático de una sola página (SPA) con las siguientes características principales:
- Presentación visual de perfil profesional
- Secciones de experiencia, stack tecnológico, certificaciones y proyecto destacado
- Formulario / acceso directo a contacto
- Animaciones e identidad visual de alto impacto

### 1.3 Definiciones y siglas
| Sigla | Significado |
|---|---|
| SRS | Software Requirements Specification |
| SPA | Single Page Application |
| IT/OT | Information Technology / Operational Technology |
| SSG | Static Site Generation |
| CTA | Call To Action |
| SEO | Search Engine Optimization |
| CI/CD | Continuous Integration / Continuous Delivery |

### 1.4 Referencias
- CV profesional de Juan Felipe Palacios (v2025)
- Prototipo HTML/CSS desarrollado en etapa de diseño
- Proyecto de referencia: strategicconnex.vercel.app

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del producto
La web funcionará como herramienta de posicionamiento profesional. No es un CV digital estático, sino un sistema de presentación interactivo que comunica autoridad técnica y diferenciación de mercado.

### 2.2 Usuarios objetivo
| Tipo de usuario | Descripción |
|---|---|
| Reclutador técnico | Busca validar competencias del candidato rápidamente |
| CTO / Gerente de IT | Evalúa fit técnico para proyectos de infraestructura o ciberseguridad |
| Cliente potencial | Empresas del sector Oil & Gas o industrial que buscan consultoría |

### 2.3 Restricciones generales
- El sitio debe funcionar sin backend propio (datos embebidos o CMS headless)
- Debe ser desplegable en Vercel o Netlify sin costo adicional
- Tiempo de carga inicial menor a 3 segundos en conexión estándar
- Debe ser accesible desde dispositivos móviles

---

## 3. Requerimientos Funcionales

### RF-01 · Sección Hero
**Descripción:** Pantalla inicial de impacto visual con identificación del profesional y llamados a la acción.  
**Prioridad:** Alta  
**Criterios de aceptación:**
- Muestra nombre completo, título profesional y tagline
- Contiene dos botones CTA: "Ver experiencia" y "Explorar stack"
- El fondo contiene animación de partículas / red neuronal interactiva
- Los botones hacen scroll suave a la sección correspondiente

---

### RF-02 · Sección Perfil Profesional
**Descripción:** Resumen narrativo de la trayectoria y tarjetas de métricas clave.  
**Prioridad:** Alta  
**Criterios de aceptación:**
- Muestra párrafo de perfil extraído del CV oficial
- Presenta 4 métricas con animación de conteo al hacer scroll:
  - 99.9% disponibilidad de red
  - −30% reducción de incidentes
  - −10h ahorro semanal por automatización
  - +25% eficiencia operativa

---

### RF-03 · Sección Experiencia (Timeline)
**Descripción:** Línea de tiempo vertical con las 3 posiciones laborales del profesional.  
**Prioridad:** Alta  
**Criterios de aceptación:**
- Muestra las siguientes posiciones en orden cronológico descendente:
  1. YPY Oilfield Services (2025 – Actual)
  2. Oilfield Production Services SRL (2013 – 2024)
  3. Exterran Argentina SRL (2003 – 2013)
- Cada ítem incluye: empresa, rol, período y lista de logros
- La línea de tiempo tiene animación de entrada al hacer scroll

---

### RF-04 · Sección Stack Tecnológico
**Descripción:** Grilla de tarjetas organizadas por categoría tecnológica.  
**Prioridad:** Alta  
**Criterios de aceptación:**
- Muestra 6 categorías: Seguridad, Redes, Cloud & Virtualización, OT/Industrial, Desarrollo, Gestión
- Cada categoría tiene tags de tecnologías específicas
- Las tarjetas tienen efecto hover con elevación y borde destacado

---

### RF-05 · Sección Certificaciones
**Descripción:** Listado visual de certificaciones y títulos académicos.  
**Prioridad:** Media  
**Criterios de aceptación:**
- Muestra al menos 8 certificaciones/títulos
- Diseño en grilla de 2 columnas (desktop) / 1 columna (mobile)
- Incluye ícono diferenciador por ítem

---

### RF-06 · Sección Proyecto Destacado
**Descripción:** Presentación del proyecto Strategic Connex con métricas de performance.  
**Prioridad:** Alta  
**Criterios de aceptación:**
- Muestra nombre, descripción, stack técnico del proyecto
- Incluye barras de performance visual (Core Web Vitals, SEO, Accesibilidad)
- Contiene botón con enlace externo a strategicconnex.vercel.app
- El enlace abre en pestaña nueva

---

### RF-07 · Sección Contacto
**Descripción:** Panel de contacto directo con información y badge de disponibilidad.  
**Prioridad:** Alta  
**Criterios de aceptación:**
- Muestra email con enlace mailto funcional
- Muestra enlace a perfil de LinkedIn
- Muestra ubicación geográfica
- Contiene badge animado de disponibilidad laboral

---

### RF-08 · Navegación
**Descripción:** Barra de navegación fija con acceso a todas las secciones.  
**Prioridad:** Alta  
**Criterios de aceptación:**
- La navbar permanece visible al hacer scroll
- Contiene logotipo/iniciales y links a todas las secciones
- Al hacer clic en un link, el scroll es suave (smooth scroll)
- En mobile, los links se ocultan o colapsan en menú hamburguesa

---

## 4. Requerimientos No Funcionales

### RNF-01 · Rendimiento
- Tiempo de carga inicial: ≤ 3 segundos (conexión 4G estándar)
- Puntuación Lighthouse Performance: ≥ 90
- Puntuación Lighthouse SEO: ≥ 95
- Las animaciones deben correr a 60 fps sin caídas visibles

### RNF-02 · Compatibilidad
- Navegadores: Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- Dispositivos: Desktop (1280px+), Tablet (768px), Mobile (375px+)
- Sistema operativo: Windows, macOS, Android, iOS

### RNF-03 · Diseño Visual
| Elemento | Especificación |
|---|---|
| Modo | Dark mode por defecto |
| Fondo principal | #0A192F |
| Fondo alterno | #111827 |
| Color de acento | #1E90FF |
| Color premium | #C5A46D |
| Texto principal | #E5E7EB |
| Texto secundario | #94A3B8 |
| Estilo | Glassmorphism + partículas animadas |
| Tipografía | Segoe UI / Inter / system-ui |

### RNF-04 · SEO
- El documento HTML debe tener meta tags: `title`, `description`, `og:title`, `og:description`, `og:image`
- Las imágenes deben tener atributo `alt`
- La estructura debe usar etiquetas semánticas: `<nav>`, `<section>`, `<footer>`, `<h1>`–`<h3>`

### RNF-05 · Seguridad
- No se deben exponer credenciales ni datos sensibles en el código fuente
- Los enlaces externos deben tener `rel="noopener noreferrer"`
- El sitio debe funcionar bajo HTTPS

### RNF-06 · Mantenibilidad
- El código debe estar modularizado por sección/componente
- Las variables de color y espaciado deben estar centralizadas (CSS variables o tokens de Tailwind)
- El proyecto debe tener un archivo `README.md` con instrucciones de instalación y despliegue

---

## 5. Stack Tecnológico Recomendado

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSG, rendimiento, SEO integrado |
| Estilos | Tailwind CSS | Utilidades, responsive, dark mode |
| Animaciones | Framer Motion | Animaciones declarativas en React |
| Partículas | Three.js o tsParticles | Fondo animado del Hero |
| Componentes UI | Shadcn/ui | Accesibilidad y consistencia visual |
| Despliegue | Vercel | CI/CD automático, CDN global, HTTPS |
| CMS (opcional) | Sanity.io | Edición de contenido sin código |

---

## 6. Arquitectura de la Aplicación

```
/app
  layout.tsx        → Layout global (navbar, footer, fuentes)
  page.tsx          → Página principal (composición de secciones)

/components
  Hero.tsx
  Perfil.tsx
  Experiencia.tsx
  Stack.tsx
  Certificaciones.tsx
  Proyecto.tsx
  Contacto.tsx
  Navbar.tsx
  Footer.tsx
  ParticlesBackground.tsx

/styles
  globals.css       → Variables CSS, reset, tipografía

/public
  og-image.png      → Imagen para Open Graph / redes sociales
  favicon.ico
```

---

## 7. Casos de Uso Principales

### CU-01 · Visitar el portfolio
**Actor:** Reclutador / Cliente  
**Flujo:**
1. El usuario accede a la URL del sitio
2. El sistema muestra la sección Hero con animación
3. El usuario hace scroll o usa la navbar para navegar
4. El usuario accede a la sección de contacto y hace clic en el email o LinkedIn

### CU-02 · Ver el proyecto Strategic Connex
**Actor:** Reclutador técnico  
**Flujo:**
1. El usuario navega a la sección "Proyecto"
2. Visualiza descripción, stack y métricas de performance
3. Hace clic en "Ver proyecto en vivo"
4. El sistema abre la URL en una nueva pestaña

### CU-03 · Contactar al profesional
**Actor:** Gerente de IT / Cliente  
**Flujo:**
1. El usuario llega a la sección de contacto
2. Hace clic en el email → se abre el cliente de correo con destinatario precargado
3. O hace clic en LinkedIn → se abre el perfil en nueva pestaña

---

## 8. Criterios de Aceptación Global

| ID | Criterio | Método de verificación |
|---|---|---|
| CA-01 | El sitio carga en menos de 3 segundos | Test con Lighthouse / WebPageTest |
| CA-02 | Score SEO ≥ 95 en Lighthouse | Herramienta Lighthouse en Chrome DevTools |
| CA-03 | El sitio es funcional en mobile (375px) | Prueba en dispositivo real o DevTools |
| CA-04 | Todos los links externos funcionan | Revisión manual |
| CA-05 | Las animaciones no bloquean el scroll | Prueba de usabilidad |
| CA-06 | El badge de disponibilidad está visible en contacto | Revisión visual |
| CA-07 | El botón del proyecto abre en pestaña nueva | Prueba manual |

---

## 9. Plan de Fases (Sugerido)

| Fase | Descripción | Entregable |
|---|---|---|
| 1 | Maqueta HTML/CSS estática | Prototipo navegable ✅ |
| 2 | Migración a Next.js 14 + Tailwind | Proyecto base funcional |
| 3 | Animaciones con Framer Motion | Secciones animadas |
| 4 | Fondo Three.js / partículas | Hero con animación completa |
| 5 | SEO, meta tags, Open Graph | Configuración de producción |
| 6 | Deploy en Vercel + dominio custom | Sitio en vivo |
| 7 | (Opcional) CMS con Sanity | Edición de contenido sin código |

---

## 10. Información de Contacto del Proyecto

| Campo | Detalle |
|---|---|
| Responsable | Juan Felipe Palacios |
| Email | palacios_juan@hotmail.com |
| LinkedIn | linkedin.com/in/juanfpalacios |
| Ubicación | Neuquén, Argentina |
| Proyecto referencia | strategicconnex.vercel.app |
