# Auto-scroll al último mensaje del chat

**Fecha:** 2026-08-28 12:39
**Tipo:** Fix
**Requisitos:** M-02

## Qué se hizo

Encontrado por el usuario justo después de arreglar el bug del historial: al recibir una pregunta
nueva, quedaba por debajo de la vista visible en pantallas normales de escritorio — el visitante
tenía que hacer scroll manualmente para verla.

Añadido un `<div>` centinela al final de la lista de mensajes, con `scrollIntoView({ behavior:
"smooth" })` disparado por un `useEffect` cada vez que cambia `mensajes` o `cargando` — así se baja
automáticamente tanto al llegar una respuesta nueva como al aparecer el indicador de "Escribiendo…".

Verificado: 148/148 tests, build y `tsc` limpios (sin test propio — es puramente visual, cubierto
por revisión manual, ver `docs/testing.md`).

## Qué se modificó

- `src/components/chat/chat-window.tsx`.

## Por qué

Sin esto, cada pregunta nueva podía quedar fuera de la vista — un visitante que no supiera hacer
scroll hacia abajo podría pensar que el chat se había quedado colgado.
