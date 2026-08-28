# README actualizado al estado real + guía de despliegue

**Fecha:** 2026-08-28 09:10
**Tipo:** Documentación
**Requisitos:** Ninguno (preparación de despliegue tras cerrar la Fase 1)

## Qué se hizo

Con la Fase 1 completa (M-01 a M-08), el README seguía diciendo "implementación sin empezar" y que
`src/` "todavía no existe" — desfasado desde hace varias sesiones. Reescrito para reflejar el
estado real: qué hace el producto hoy, variables de entorno explicadas una a una (antes remitía
solo a `docs/architecture.md`), estructura de carpetas real de `src/`, y una sección nueva de
**Despliegue** con los pasos exactos de Vercel (conectar repo, variables de entorno, migración
aplicada, deploy) — el agente no lo ejecuta, solo lo deja listo y explicado.

De paso, se revisó `LICENSE`: el nombre del titular del copyright (Rafael Moreno Vicens) parecía un
resto de otra plantilla al no aparecer en ningún otro sitio del proyecto — se confirmó con el
usuario que es correcto, no se tocó.

## Qué se modificó

- `README.md` reescrito.
- `LICENSE` — revisado, sin cambios (confirmado correcto).

## Por qué

El README es lo primero que lee cualquiera que abra el repo — con la Fase 1 ya construida y
verificada en vivo, dejarlo diciendo "sin empezar" habría sido activamente engañoso para el propio
usuario o para quien le ayude a desplegarlo.
