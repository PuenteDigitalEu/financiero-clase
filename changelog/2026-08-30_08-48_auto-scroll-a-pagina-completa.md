# Auto-scroll a la página completa (no solo al área de mensajes)

**Fecha:** 2026-08-30 08:48
**Tipo:** Fix
**Requisitos:** M-02

## Qué se hizo

El intento anterior de auto-scroll (`scrollIntoView` sobre un centinela dentro del área de
mensajes) llevaba la última pregunta a la vista, pero el cuadro de texto — que viene *después* de
esa zona, fuera de ella — seguía quedando cortado. Un segundo intento cambiando la altura de la
página (`h-dvh` + `overflow-hidden` en `app/chat/page.tsx`) tampoco lo resolvió y se deshizo
(revert `2516b37`).

**Arreglo esta vez, más simple:** en vez de desplazar un punto dentro del área de mensajes, se
desplaza la **página entera** hasta su final de verdad — `window.scrollTo({ top:
document.body.scrollHeight, behavior: "smooth" })` — que por definición incluye el cuadro de texto,
al ser lo último del documento. No depende de que ninguna cadena de alturas/`overflow` esté bien
encajada entre varios archivos, que fue justo lo que falló en el segundo intento.

Verificado: 148/148 tests, build y `tsc` limpios. Sin verificación visual en navegador (bloqueada,
igual que el resto de la sesión) — pendiente de que el usuario lo confirme en producción.

## Qué se modificó

- `src/components/chat/chat-window.tsx` — el `useEffect` de auto-scroll pasa de `scrollIntoView`
  sobre un centinela a `window.scrollTo` sobre la página completa; se quita el `finalRef` que ya
  no hace falta.

## Por qué

Dos intentos anteriores no resolvían el problema real: el cuadro de texto quedaba fuera de la
vista tras cada pregunta nueva. Esta vez el arreglo no depende de una cadena de CSS entre varios
archivos, solo de una API del navegador (`window.scrollTo`) que siempre lleva a la página a su
final real.
