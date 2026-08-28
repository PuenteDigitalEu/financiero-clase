# La página de chat clipa a la altura de la ventana

**Fecha:** 2026-08-28 12:57
**Tipo:** Fix
**Requisitos:** M-02

## Qué se hizo

El auto-scroll del cambio anterior no bastaba: el cuadro de texto seguía quedando fuera de la
vista tras cada pregunta nueva, en pantallas de escritorio normales.

**Causa real:** `app/layout.tsx` pone `min-h-full` en `<body>`, no una altura fija — eso deja que
la página entera crezca junto con la conversación, así que era el **navegador** el que hacía
scroll de toda la página, no el área interna de mensajes (`overflow-y-auto`) de `ChatWindow`. El
`scrollIntoView` del cambio anterior sí llevaba el último mensaje a la vista, pero al hacerlo la
página entera se desplazaba, dejando el cuadro de texto (más abajo en el flujo) fuera.

**Arreglo, en la página del chat en concreto** (no en el layout raíz — la landing sí necesita
scroll normal de página, con hero/cómo funciona/footer más largos que una pantalla):
`app/chat/page.tsx` pasa a `h-dvh overflow-hidden` — altura fija a la ventana, sin dejar crecer la
página. Con eso, el único que puede hacer scroll es lo de dentro: el área de mensajes de
`ChatWindow`, ya correctamente acotada. `ConsentScreen` recibe su propio `overflow-y-auto` interno
por el mismo motivo — si su contenido no cupiera en una pantalla pequeña, tiene que poder
desplazarse él solo dentro de esa altura fija, o quedaría cortado sin forma de llegar al botón.

Verificado: 148/148 tests, build y `tsc` limpios (sin test propio — layout puramente visual).

## Qué se modificó

- `src/app/chat/page.tsx` — `h-dvh overflow-hidden`.
- `src/components/chat/consent-screen.tsx` — `h-full overflow-y-auto` en el contenedor.

## Por qué

El auto-scroll por sí solo no sirve de nada si lo que se desplaza es la página entera en vez del
área de mensajes — el cuadro de texto seguía perdiéndose de la vista pese al cambio anterior.
