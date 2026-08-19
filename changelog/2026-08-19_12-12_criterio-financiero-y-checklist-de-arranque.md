# Carpeta docs/criterio/ y checklist de arranque ampliado

**Fecha:** 2026-08-19 12:12
**Tipo:** Documentación
**Requisitos:** Ninguno

## Qué se hizo

Se alineó `CLAUDE.md` con el formato usado en clase para el checklist de arranque de sesión:
lectura explícita de `docs/roadmap.md` para localizar la fase del proyecto, y de una nueva
sección "Trampas conocidas del stack" en `docs/architecture.md` (vacía por ahora — se rellena
según se descubran problemas reales durante la implementación, no con contenido inventado).

Además, se creó `docs/criterio/` y se movió a esa carpeta `politica-de-inversion.md` — es
literalmente "el criterio financiero del sistema" (así lo llama `instrucciones-motor.md`, que la
señala como su única fuente de criterio), separado de los documentos de comportamiento del agente
(`instrucciones-sistema.md`, `instrucciones-motor.md`), que se quedan en la raíz.

## Qué se modificó

- `politica-de-inversion.md` → `docs/criterio/politica-de-inversion.md` (movido).
- `CLAUDE.md` — "Estado del proyecto y arranque" reescrito con los pasos de fase y trampas del
  stack; referencias a la política actualizadas a la nueva ruta.
- `docs/architecture.md` — nueva sección "Trampas conocidas del stack"; referencias actualizadas.
- `docs/roadmap.md`, `docs/prd.md`, `README.md`, `instrucciones-motor.md`,
  `plantilla-entrevista.md`, `reglas-recomendacion.md` — referencias a la política actualizadas a
  `docs/criterio/politica-de-inversion.md`.

## Por qué

El usuario está haciendo este proyecto como ejercicio de clase y quiere que el protocolo de
`CLAUDE.md` quede alineado con el formato de arranque de sesión visto en clase, sin perder nada de
lo ya construido. Se verificó que estos tres elementos no vienen de la rama principal del
`project-template` público — es una variante propia de la clase — y se implementaron directamente
sobre lo que pide el enunciado, sin inventar contenido (la sección de trampas queda vacía hasta
que haya implementación real que reporte).
