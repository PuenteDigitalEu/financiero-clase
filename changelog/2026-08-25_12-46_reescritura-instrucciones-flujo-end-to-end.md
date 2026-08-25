# Reescritura de instrucciones-sistema.md e instrucciones-motor.md para el flujo end-to-end

**Fecha:** 2026-08-25 12:46
**Tipo:** Feature
**Requisitos:** M-02, M-03, M-06, M-07

## Qué se hizo

Primera tarea real de implementación (Fase 1 del roadmap): reescribir los dos documentos que hasta
ahora prohibían explícitamente el flujo que este proyecto construye. Quedan reestructurados en
cuatro fases dentro de una sola conversación con el visitante, sin reunión ni intermediario humano
antes de que vea su resultado:

- **`instrucciones-sistema.md`** — Fases 1-2 (entrevista y ficha). El agente ya no "prepara el
  terreno para que el asesor dé la recomendación": su trabajo termina al confirmar la ficha, que
  ahora se persiste en Supabase (`clientes`/`fichas`/`deudas`), no en un archivo `.md` local.
- **`instrucciones-motor.md`** — Fases 3-4 (análisis y entrega). El pipeline de cálculo (§1-§7) se
  mantiene igual — sigue siendo código determinista, ahora explícitamente `lib/motor/` — pero ya no
  se activa "solo cuando el asesor lo pide": corre automáticamente al cerrar la entrevista. Se
  añadió una sección completamente nueva, **§8 · Entrega del plan**, que no existía en ningún
  documento anterior: reglas de traducción "en cristiano" (sin siglas, cifras ancladas a la vida
  del cliente, formato "de cada 100 €"), estructura fija de 8 secciones, y una tabla explícita de
  qué sección se muestra en cada modo (completo/condicionado/suspendido) — la línea roja de nunca
  mostrar propuesta ejecutable fuera de modo completo ahora tiene su contraparte de diseño, no solo
  la prohibición.

De paso se encontró y corrigió un vacío real: la entrevista nunca preguntaba nombre ni email del
visitante, así que `clientes` (y con ello todo `M-05`, el aviso al asesor para que pueda contactar
al lead) no podía funcionar nunca. Se añadió el bloque 0 (Presentación) a
`plantilla-entrevista.md`.

## Qué se modificó

- `instrucciones-sistema.md` — reescrito completo.
- `instrucciones-motor.md` — reescrito completo, con la nueva §8.
- `plantilla-entrevista.md` — bloque 0 (nombre + email) nuevo; cierre sin adelantar cifras; tope de
  turnos ~14 → ~15.
- `modulo2-motor-analisis.md` — corregida la descripción del stub histórico, que ya describía mal
  el `instrucciones-motor.md` vigente.
- `docs/architecture.md` — decisión técnica del 2026-08-18 actualizada a "hecho", con fecha y
  resumen de lo que cambió.
- `docs/prd.md` — M-02 incluye el bloque de presentación en el orden fijo; M-03 en pasado (los
  documentos ya se actualizaron); referencia a la política de inversión corregida a
  `reglas-recomendacion.md`.
- `docs/roadmap.md`, `docs/data-model.md`, `docs/design-system.md`, `README.md`, `CLAUDE.md` —
  referencias a "Módulo 1/Módulo 2" actualizadas a "Fases 1-2/Fases 3-4"; tope de turnos a ~15;
  columna `fichas.cliente` renombrada a `fichas.nombre` (+ `nombre_estado`) para que coincida con
  la clave real del contrato de la ficha; avisos ya obsoletos corregidos en `CLAUDE.md`.

## Por qué

Sin esta reescritura no había system prompt válido para `app/api/chat/` — es el prerrequisito
explícito de todo lo demás en la Fase 1 del roadmap, señalado como tal desde la decisión técnica
del 2026-08-18. El usuario autorizó continuar con el resto del checklist de Fase 1 sin confirmación
en cada paso, dado que no estaría disponible.
