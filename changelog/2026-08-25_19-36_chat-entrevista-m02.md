# Chat de entrevista guiada (M-02)

**Fecha:** 2026-08-25 19:36
**Tipo:** Feature
**Requisitos:** M-02 (parcial — ver "Qué queda pendiente")

## Qué se hizo

Quinta tarea de la Fase 1: la ruta y la UI del chat.

- `src/lib/claude/client.ts` — cliente Anthropic (modelo `claude-sonnet-5`), falla explícitamente
  si falta `ANTHROPIC_API_KEY` en vez de fallar en silencio.
- `src/lib/claude/system-prompt.ts` — construye el system prompt concatenando
  `instrucciones-sistema.md` + `plantilla-entrevista.md` en tiempo real desde disco, para que
  nunca se desincronice de la fuente de verdad.
- `src/app/api/chat/route.ts` — `POST` sin estado en el servidor: el cliente manda el historial
  completo de la conversación en cada turno; el servidor solo valida, llama a Claude con el
  system prompt, y devuelve el siguiente mensaje. Decisión deliberada: así `M-02` no depende de
  `M-04` (persistencia en Supabase) para poder probarse — la persistencia se añade encima de este
  mismo contrato sin cambiarlo. Incluye un tope duro de 40 mensajes como red de seguridad del
  servidor (muy por encima del ~15 de la plantilla).
- `src/components/chat/{chat-bubble,disclosure-banner,chat-window}.tsx` — UI del chat siguiendo
  `docs/design-system.md`.
- `/chat` conectado al componente real (dejaba de ser el placeholder).

## Verificación realizada

**Con el cliente de Claude mockeado** (`route.test.ts`, 10 tests, `pnpm test` → 51/51 en total):
validación del cuerpo de la petición, rechazo de conversación vacía, tope de turnos, formato de la
respuesta cuando Claude devuelve varios bloques de texto, y que un fallo de la API devuelve 502
con mensaje, no un 500 mudo. `tsc --noEmit`, `eslint` y `pnpm build` limpios.

**No verificado — necesita cosas que no están disponibles aquí:** la llamada real a la API de
Claude (sin `ANTHROPIC_API_KEY`, que sigue vacía) y la revisión visual en un navegador de verdad
(la extensión de Chrome no logró conectarse en este entorno, con el usuario presente e intentándolo
varias veces).

## Trampa de stack encontrada y corregida

`pnpm build` avisó de que `readFileSync` con una ruta dinámica (`join(process.cwd(), nombre)` con
`nombre` como parámetro) hace que Next.js empaquete el proyecto entero al desplegar, en vez de solo
lo necesario. Corregido escribiendo las dos rutas en literal. Registrado en
`docs/architecture.md` → "Trampas conocidas del stack" (primera entrada real).

## Qué queda pendiente (a propósito, ver docs/roadmap.md)

- Verificar la llamada real a Claude con una clave válida.
- Revisión visual en navegador.
- `M-06` (consentimiento) antes de la pantalla de "Empezar" — el componente ya deja sitio para
  esto sin necesitar cambios estructurales.
- Límite de uso por IP, en la misma ruta.
- La orquestación completa del motor (17 casos borde) que traduce la ficha ya recogida en un
  informe — hoy el chat solo conduce la entrevista, no calcula ni entrega el plan (`M-03`).

## Qué se modificó

- Nuevo: `src/lib/claude/{client,system-prompt}.ts`.
- Nuevo: `src/app/api/chat/{route.ts,route.test.ts}`.
- Nuevo: `src/components/chat/{chat-bubble,disclosure-banner,chat-window}.tsx`.
- `src/app/chat/page.tsx` — usa `ChatWindow` en vez del placeholder.
- `docs/architecture.md` — primera entrada real en "Trampas conocidas del stack".
- `docs/roadmap.md` — `M-02` marcada como parcial, con el detalle de qué está verificado y qué no.

## Por qué

Continuación de la Fase 1 del roadmap, siguiendo instrucción explícita del usuario ("ataca m-02").
