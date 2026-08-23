# reglas-recomendacion.md pasa a ser la fuente única de criterio

**Fecha:** 2026-08-23 09:54
**Tipo:** Documentación
**Requisitos:** Ninguno

## Qué se hizo

Se resolvió una discrepancia real entre este repo y `polmarza/Clase-Agente-Financiero` (el repo de
referencia de la clase): aquí `politica-de-inversion.md` (numeración 1–11) estaba marcado como
canónico y `reglas-recomendacion.md` como `[SUSTITUIDO]`; en el de polmarza es exactamente al
revés — `reglas-recomendacion.md` (códigos R1–R10) es "la única fuente de criterio del sistema",
derogada `politica-inversion.md` desde 2026-08-06.

Se comparó el contenido íntegro de ambos archivos: las cifras y reglas de negocio son idénticas
(aportación 70–80 % del flujo libre, carteras 20/60/20 · 50/40/10 · 80/15/5, rentabilidades
2/3/6,5/3 %, umbrales de deuda cara, etc.). No había conflicto real de criterio, solo de qué
archivo manda. Por decisión explícita del usuario, se adoptó la convención de polmarza.

## Qué se modificó

- `docs/criterio/reglas-recomendacion.md` (nuevo) — contenido completo R1–R10, verbatim del repo
  de polmarza (verificado carácter a carácter vía API de GitHub).
- `docs/criterio/politica-de-inversion.md` — pasa a stub `[SUSTITUIDO]`, redirige a
  `reglas-recomendacion.md`.
- `reglas-recomendacion.md` (raíz) — eliminado (era el stub antiguo; ya no hace falta, el
  contenido real vive en `docs/criterio/`).
- Referencias y remapeo de citas de sección actualizadas en: `instrucciones-motor.md` (política
  §7→R6, §8→R7, §10→R9, además de sustituir menciones genéricas a "la política" por "las reglas"
  o el número R correspondiente), `plantilla-entrevista.md`, `README.md`, `CLAUDE.md`,
  `docs/roadmap.md`, `docs/prd.md`, `docs/data-model.md`, `docs/architecture.md`.
- No se tocaron `pasos-arreglo-punto1.md`, `cambios-propuestos-integracion.md` ni los
  `informe-*.md`/`ficha-*.md` de prueba: son notas de trabajo e históricos previos a esta sesión,
  no documentación viva.

## Por qué

El usuario está haciendo este proyecto como ejercicio de clase y pidió explícitamente alinear el
criterio con el de `polmarza/Clase-Agente-Financiero` en vez de con la numeración que se había
usado hasta ahora en este repo.
