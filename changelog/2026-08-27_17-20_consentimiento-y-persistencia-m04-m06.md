# Consentimiento y persistencia — M-04 + M-06

**Fecha:** 2026-08-27 17:20
**Tipo:** Feature
**Requisitos:** M-04, M-06

## Qué se hizo

Ficha acordada en `docs/features/consentimiento-y-persistencia.md`: M-06 (consentimiento) y M-04
(persistencia) se construyen juntas porque comparten el mismo mecanismo — el `token` de sesión que
crea el consentimiento es lo único que autoriza las escrituras posteriores.

1. **`POST /api/conversacion`** (nuevo) — crea la conversación con `consentimiento_en` al aceptar,
   devuelve `{ token }`. Antes de esta llamada no existe ninguna fila ni dato personal.
2. **`ConsentScreen`** (nuevo) — sustituye el botón "Empezar" suelto: explica qué datos se piden y
   por qué, y llama a `/api/conversacion` al aceptar. El token vive solo en memoria de
   `ChatWindow`, nunca en `localStorage` (recargar pierde el hilo — coherente con que no hay
   recuperación de conversación en esta versión, `C-01`).
3. **`POST /api/chat` cambia de contrato** — exige `token` en el body; lo valida contra
   `conversaciones` (existe, `en_curso`, no expirada) antes de llamar a Claude, con 401 y mensaje
   genérico si no es válido. Cada turno procesado incrementa `turnos_totales`.
4. **`lib/supabase/persistencia.ts`** (nuevo) — todas las escrituras de M-04/M-06 en un solo
   sitio: `crearConversacion`, `validarToken`, `incrementarTurno`, y `persistirCierre` (cliente
   enlazado por email + ficha + deudas + informe + plan, al mismo instante donde ya se disparaba
   `M-03`). Sin transacción SQL — riesgo de escritura a mitad aceptado para el MVP, documentado en
   la ficha.
5. **Gap real encontrado al diseñar esto:** el contrato de texto de la ficha incluye `email` y
   `fecha_entrevista` (bloque 0) pero ni `Ficha` ni `parsearFicha` los capturaban — hacían falta
   para crear/enlazar el `cliente` y para la columna `not null` de `fichas`. Añadidos ambos, con
   sus tests.
6. **`scripts/verificar-persistencia.mjs`** (nuevo, checked in) — PGlite (Postgres real vía WASM):
   aplica la migración real y ejercita la cadena completa de escritura del cierre, más 5 casos
   negativos (email duplicado, `not null`, `check` de modo, FK de deudas). `@electric-sql/pglite`
   añadido como devDependency — hasta ahora este tipo de verificación vivía en el scratchpad, fuera
   del repo.

**Verificado:** 115/115 tests (`pnpm test`, Supabase mockeado), `scripts/verificar-persistencia.mjs`
en verde, `pnpm build` y `tsc --noEmit` limpios.

**Sin verificar en vivo:** el usuario puso `SUPABASE_SERVICE_ROLE_KEY` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` reales en `.env.local`, pero al intentar la verificación en vivo se
confirmó que la migración no está aplicada contra el proyecto Supabase real (`public.conversaciones`
no existe ahí todavía). Aplicar DDL contra la base de datos real es infraestructura compartida —
pendiente de que el usuario la ejecute desde el SQL Editor del panel de Supabase (instrucciones
dadas en el chat). En cuanto esté aplicada, se repite la verificación en vivo y la ficha pasa a
Verificada.

## Qué se modificó

- Nuevos: `src/app/api/conversacion/route.ts` (+ test), `src/lib/supabase/{server,persistencia}.ts`
  (+ test), `src/components/chat/consent-screen.tsx`, `scripts/verificar-persistencia.mjs`,
  `docs/features/consentimiento-y-persistencia.md`.
- Modificados: `src/app/api/chat/route.ts` (+ tests), `src/components/chat/chat-window.tsx`,
  `src/lib/motor/ficha.ts` + `parseo.ts` (campos `email`/`fechaEntrevista`, + tests),
  `src/lib/claude/plan.ts` (`seccionarPlan`, `DESCARGO_FIJO`, + tests), `package.json`
  (`@electric-sql/pglite`), `docs/roadmap.md`, `docs/architecture.md`.

## Por qué

M-04 y M-06 son los dos requisitos bloqueantes-o-casi que quedaban de la Fase 1 antes de exponer la
landing: sin consentimiento explícito no hay base legal para tratar los datos (RGPD), y sin
persistencia el trabajo del asesor depende por completo de que el email de aviso (`M-05`, todavía
sin construir) nunca falle.
