# M-01 cerrada: revisión visual de la landing completada

**Fecha:** 2026-08-30 09:49
**Tipo:** Documentación
**Requisitos:** M-01 (queda cerrada del todo)

## Qué se hizo

M-01 (landing pública) estaba construida y verificada por compilación/lint/dev desde el 2026-08-25,
pero el roadmap la dejaba en `[~]` a la espera de una revisión visual en navegador real — bloqueada
hasta ahora porque la extensión de Chrome no estaba conectada.

Con la extensión ya conectada a la cuenta correcta, se hizo la revisión visual en local
(`localhost:3000`, servidor de desarrollo):

- **Hero:** título con tipografía **Sora** en el `h1` (48px), badge "Diagnóstico financiero
  gratuito", subtítulo y disclaimer ("Orientación educativa… No es asesoramiento de inversión
  regulado").
- **CTA "Empezar mi diagnóstico":** es un `<a href="/chat">` con el naranja del sistema de diseño
  (`rgb(255,107,74)`); al pulsarlo **navega de verdad a `/chat`** y muestra la pantalla de
  consentimiento (M-06).
- **Secciones** "Cómo funciona" (3 pasos, grid `sm:grid-cols-3`) y "Tus datos, con cuidado"
  (privacidad/consentimiento/borrado) renderizan correctamente.
- **Footer** con disclaimer y `[Nombre de la asesoría]` como **placeholder literal** — correcto:
  `CLAUDE.md` prohíbe inventar la marca hasta que se confirme.
- **Responsive:** sin overflow horizontal a ancho de escritorio; clases `sm:` presentes en
  títulos, padding y grid (colapsa a una columna en móvil).

Limitación: el `resize_window` del navegador no cambió el viewport, así que el *render* real en
ancho móvil no se pudo capturar desde aquí — se comprobó por CSS (breakpoints presentes) y lo
confirmó el usuario en su propio navegador contra producción, incluida la vista móvil, sin
incidencias.

## Qué se modificó

- `docs/roadmap.md` — M-01 pasa de `[~]` a `[x]`; se sustituye la nota de "sin revisión visual,
  revisar antes de cerrar" por el detalle de la revisión del 2026-08-30.
- Nuevo: este archivo de changelog.

## Por qué

Era el único pendiente técnico que quedaba de la Fase 1: sin la revisión visual, M-01 no se podía
dar por cerrada y la Fase 1 quedaba con un cabo suelto. Hecha la revisión y confirmada también por
el usuario en producción, M-01 queda cerrada y la Fase 1 completa sin reservas.
