# Documento de Especificación de Requerimientos de Software (SRS)
**Proyecto:** Portfolio Web Profesional (Cybersecurity Command Console) – Juan Felipe Palacios  
**Versión:** 1.2  
**Fecha:** Abril 2026  
**Autor:** Juan Felipe Palacios  
**Estado:** Finalizado / Producción (Bilingüe)

---

## 1. Introducción

### 1.1 Propósito
Este documento define los requerimientos para el portfolio profesional del Arq. Juan Felipe Palacios. El sistema ha evolucionado de un portfolio estático a una **Consola de Comando de Ciberseguridad Industrial**, diseñada para demostrar autoridad técnica en entornos IT/OT, Oil & Gas e infraestructura crítica.

### 1.2 Alcance
La aplicación es una SPA (Single Page Application) de alto rendimiento que incluye:
- Interfaz industrial con estética de "centro de operaciones".
- Simulación de dashboard SIEM en tiempo real.
- Visualización de arquitectura Purdue IT/OT interactiva.
- Consultor de IA bilingüe especializado en ciberseguridad.
- Sistema de internacionalización (ES/EN) con persistencia de estado.
- Sección de artículos técnicos (Inteligencia IT/OT).

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del producto
El producto se posiciona como una herramienta de autoridad técnica. Utiliza elementos visuales premium (glassmorphism, scanlines, micro-animaciones) para comunicar el nivel de sofisticación esperado en un arquitecto de ciberseguridad industrial.

### 2.2 Requerimientos Globales
- **Bilingüe:** Soporte nativo para Español e Inglés sin recarga de página.
- **Persistencia:** El sistema recuerda la preferencia de idioma del usuario.
- **IA Integrada:** Consultoría técnica automatizada vía API de OpenRouter.

---

## 3. Requerimientos Funcionales (Nuevos y Evolucionados)

### RF-09 · Selector de Idioma (i18n)
**Descripción:** Interruptor fluido entre Español e Inglés gestionado vía Context API.  
**Criterios de aceptación:**
- Cambia todos los textos de la UI instantáneamente.
- Persiste la selección en `localStorage`.
- Soporta hidratación segura en Next.js para evitar parpadeos de contenido.

### RF-10 · SIEM Dashboard Interactivo
**Descripción:** Simulación visual de un sistema de gestión de eventos de seguridad.  
**Criterios de aceptación:**
- Scroller de logs en tiempo real con niveles de alerta (CRITICAL, WARN, INFO).
- Mitigación automática interactiva (hover/click en alertas rojas).
- Gráficos dinámicos de vectores de ataque y zonas Purdue protegidas.

### RF-11 · Consultor IA (Nacho Assistant)
**Descripción:** Agente conversacional basado en IA que actúa como asistente profesional.  
**Criterios de aceptación:**
- Interfaz de chat integrada con estética de consola.
- Streaming de respuestas para mejorar la percepción de velocidad.
- **Conciencia Lingüística:** La IA responde en el idioma activo del portfolio.
- Integración con OpenRouter (Modelo: Google Gemini 1.5 Pro/Flash).

### RF-12 · Sección de Inteligencia IT/OT (Blog)
**Descripción:** Repositorio de insights técnicos y normativas (IEC 62443, Vaca Muerta).  
**Criterios de aceptación:**
- Tarjetas con tags por categoría.
- Contenido totalmente localizado vía diccionario de idiomas.

### RF-13 · Visualización Purdue (Arquitectura)
**Descripción:** Representación visual del modelo de referencia de redes industriales.  
**Criterios de aceptación:**
- Diagrama 2D responsivo con identificación de Niveles 0 a 4.
- Efectos de radar y escaneo para reforzar la temática de ciberseguridad.

---

## 4. Requerimientos No Funcionales

### RNF-07 · Internacionalización (i18n)
- Arquitectura de diccionario centralizado en `LanguageContext.tsx`.
- Soporte para nuevas lenguas mediante la expansión del objeto de traducciones.

### RNF-08 · Experiencia de Usuario (Consola Premium)
- **Efectos Visuales:** Uso persistente de scanlines (líneas de escaneo) y ruido sutil de fondo.
- **Animaciones:** Framer Motion para transiciones de entrada y cambios de estado de idioma.
- **Tipografía:** Inter/Monospace para legibilidad técnica.

---

## 5. Stack Tecnológico Final

| Capa | Tecnología | Justificación |
|---|---|---|
| **Core** | Next.js 16 (Turbopack) | Máximo rendimiento en desarrollo y build. |
| **Styling** | Tailwind CSS 4.0 | Utilidades modernas y optimizadas. |
| **Logic/State** | Context API (i18n) | Gestión ligera y global del idioma. |
| **IA Backend** | OpenRouter API | Acceso a modelos LLM de última generación. |
| **Animaciones** | Framer Motion | Control preciso de micro-interacciones. |
| **Despliegue** | Vercel | Infraestructura optimizada para Next.js. |

---

## 6. Arquitectura de Archivos (Actualizada)

```
/src
  /app
    /api/chat/route.ts  → Endpoint para el Consultor IA (SSE)
    layout.tsx          → Configuración global y Viewport
    page.tsx            → Composición de la consola
  /components
    /ui                 → Componentes base (FadeIn, Icon, etc.)
    Hero.tsx            → Sistema de indicadores dinámicos
    SIEMDashboard.tsx   → Lógica de logs y mitigación
    AIConsultant.tsx    → Interfaz de chat bilingüe
    AuditHub.tsx        → Gestión de cumplimiento IT/OT
    LanguageContext.tsx → Motor de i18n y persistencia
  /context              → Proveedores de estado global
  /data                 → Diccionarios de idiomas y contenido estático
  /lib/utils.ts         → Helpers de aleatoriedad y formato
```

---

## 7. Criterios de Aceptación Global (v1.2)

| ID | Criterio | Resultado |
|---|---|---|
| CA-08 | El idioma persiste tras recargar la página | ✅ Exitoso |
| CA-09 | El Asistente IA responde en el idioma de la UI | ✅ Exitoso |
| CA-10 | El Build de producción no tiene errores de TS | ✅ Exitoso |
| CA-11 | Las animaciones SIEM corren a 60fps | ✅ Exitoso |
| CA-12 | El sitio es 100% responsivo en iPhone/Android | ✅ Exitoso |

---

## 8. Información de Contacto
**Responsable:** Juan Felipe Palacios  
**Repositorio:** StrategicConnex/Portfolio-app  
**URL Producción:** juanfpalacios.vercel.app
