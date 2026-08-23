# Variables y protocolo de deudas de polmarza añadidos a la entrevista

**Fecha:** 2026-08-23 10:11
**Tipo:** Documentación
**Requisitos:** Ninguno

## Qué se hizo

Se comparó `plantilla-entrevista.md` e `instrucciones-motor.md` con sus equivalentes en
`polmarza/Clase-Agente-Financiero`. A diferencia de la discrepancia de criterio (contenido
idéntico, solo cambiaba el archivo canónico), aquí había diferencias reales de diseño: variables
que ellos capturan y nosotros no, y un protocolo distinto para el dato sensible de deudas.

Por decisión del usuario, se mantiene `plantilla-entrevista.md` propia como base (no se adopta la
suya entera — duración, framing y esquema de variables difieren demasiado), añadiendo solo lo que
a nosotros nos faltaba:

- `ingresos_estabilidad` (estable/variable) — nueva pregunta de seguimiento en el bloque 1.
- `patrimonio_distribucion` (reparto aproximado por clase de activo) — nueva pregunta de
  seguimiento en el bloque 4. Resuelve el "hueco conocido" que `instrucciones-motor.md` señalaba
  explícitamente desde antes de esta sesión.
- Protocolo de deudas reforzado (bloque 3): única variable donde se insiste una vez más tras la
  negativa inicial, con un fallback binario `deudas_interes_alto_declarado` si el cliente sigue
  sin dar el detalle completo.

## Qué se modificó

- `plantilla-entrevista.md` — preguntas de seguimiento nuevas (bloques 1 y 4), protocolo de
  deudas reforzado (bloque 3), tope de turnos ~12 → ~14.
- `instrucciones-sistema.md` — tres claves nuevas en el contrato de la ficha
  (`ingresos_estabilidad`, `deudas_interes_alto_declarado`, `patrimonio_distribucion`); nota sobre
  la excepción de deudas; tope de turnos ~12 → ~14.
- `instrucciones-motor.md` — claves nuevas en el parseo (§2); ya no hay "hueco conocido" para
  `patrimonio_distribucion`; caso borde nuevo **C17** (uso de `deudas_interes_alto_declarado` para
  la priorización de R1 cuando `deudas_numero` queda pendiente); C15 reescrito para reflejar que
  el campo ahora existe pero puede venir `pendiente`.
- `docs/data-model.md` — columnas nuevas en `fichas` (`ingresos_estabilidad`,
  `deudas_interes_alto_declarado`, `patrimonio_distribucion`, con sus `_estado`); eliminada la
  nota que marcaba `patrimonio_distribucion` como fuera de esquema a propósito.
- `docs/testing.md`, `docs/roadmap.md`, `docs/architecture.md` — referencias al catálogo
  actualizadas de "16 casos borde (C1–C16)" a "17 casos borde (C1–C17)".
- `docs/design-system.md`, `docs/prd.md` — tope de turnos ~12 → ~14.
- No se tocaron `informe-silvia.md` ni `ficha-silvia.md` (artefactos de prueba anteriores a esta
  sesión, con el esquema de variables antiguo — quedan como registro histórico).

## Por qué

El usuario pidió explícitamente conservar la plantilla propia como base pero incorporar las
variables y el protocolo de deudas que sí tiene la versión de polmarza y a nosotros nos faltaban,
en vez de sustituir el diseño completo.
