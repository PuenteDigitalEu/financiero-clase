# Bug crítico: el chat perdía el historial a partir del tercer turno

**Fecha:** 2026-08-28 12:35
**Tipo:** Fix
**Requisitos:** M-02 (regresión encontrada en producción, ya desplegada)

## Qué se hizo

Detectado por el usuario probando la app ya desplegada: tras responder la primera y segunda
pregunta con normalidad, al enviar la respuesta a la segunda, el chat volvía a preguntar el nombre
y el email — como si la conversación se reiniciara.

**Causa real:** en `ChatWindow`, cada turno **sustituía** el historial visible (`setMensajes(...)`)
en vez de **acumularlo**. A partir del segundo turno, el estado de React que alimentaba el
siguiente turno ya no contenía el nombre/email dados en el bloque 0 — así que el tercer turno
mandaba a `/api/chat` una conversación incompleta, sin ese contexto. Claude, al recibir un
historial que empezaba directamente por una pregunta de ingresos sin la presentación previa, no
tenía forma de saber que el nombre y el email ya se habían dado, y volvía a pedirlos.

**Por qué nadie lo detectó antes:** todo lo verificado en local y en vivo durante esta sesión pasó
por llamadas directas a `/api/chat` construyendo el historial a mano (por `curl`), nunca a través
del componente `ChatWindow` real — la lógica de acumulación en el navegador nunca se ejerció hasta
que el usuario probó la app desplegada con sus propios dedos.

**Arreglo:** la lógica de acumulación se extrajo a `lib` puro (`historial.ts`,
`mensajesParaApi`/`conRespuesta`), separado de React para poder probarlo sin depender de un
navegador — algo que `docs/testing.md` no exige para componentes visuales, pero este no era un bug
visual, era un bug de estado. Test de regresión específico: simula 4 turnos completos y comprueba
que en el cuarto turno el historial mandado a la API sigue incluyendo TODO lo dicho desde el
primero, sin perder nada por el camino.

Verificado: 148/148 tests, build y `tsc` limpios.

## Qué se modificó

- Nuevos: `src/components/chat/historial.ts`, `src/components/chat/historial.test.ts`.
- Modificado: `src/components/chat/chat-window.tsx` — `enviarTurno`/`handleEnviar`/
  `aceptarConsentimiento` reescritos para usar el historial acumulado en vez del cálculo de índices
  (`mostrarDesde`) que causaba el bug.

## Por qué

Rompía el producto entero para cualquier visitante real: nadie podía completar la entrevista más
allá de la segunda pregunta. Se descubrió en la primera prueba real a través del navegador, ya con
la app desplegada en producción — recordatorio de que la verificación por `curl`, aunque real
contra las APIs, no sustituye probar el componente de interfaz de verdad.
