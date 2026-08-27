# Consentimiento y persistencia (M-06 + M-04)

**Estado:** En construcción
**Requisitos que cierra:** M-04, M-06
**Fecha de acuerdo:** 2026-08-27

## Qué se construye

Antes de "Empezar", el visitante ve una pantalla de consentimiento de tratamiento de datos. Hasta
que la acepta no existe ninguna fila en la base de datos ni ningún dato personal guardado. Al
aceptar, el servidor crea la conversación con su `token` de sesión y la fecha de consentimiento; ese
token viaja en las llamadas siguientes a `/api/chat` y es lo único que autoriza al servidor a
escribir en esa conversación concreta.

Cuando la entrevista se cierra (tras el resumen de confirmación de `FLOW-01`, el mismo punto donde
hoy se dispara `M-03`), el sistema persiste de forma duradera el cliente (o lo enlaza si ya existía
por email), la ficha, sus deudas, el informe calculado y el plan redactado, y marca la conversación
como completada. Una conversación abandonada antes de ese punto no deja ficha ni informe — solo la
fila de `conversaciones` en curso, sin datos personales si el visitante abandonó antes del bloque 0.

Sin credenciales reales de Supabase en este entorno (`SUPABASE_SERVICE_ROLE_KEY` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` ausentes de `.env.local`), la verificación de esta feature es con
Supabase mockeado (tests de las rutas) y con PGlite (Postgres real, WASM) para las queries de
escritura de verdad — no contra el proyecto real, igual que pasó con la migración inicial.

**Estado real (2026-08-27):** código completo, con `pnpm test` (mockeado), `scripts/verificar-persistencia.mjs`
(PGlite) y `pnpm build`/`tsc` en verde. El usuario ya rellenó las credenciales reales de Supabase en
`.env.local`, pero la migración (`supabase/migrations/001_esquema_inicial.sql`) todavía no está
aplicada contra el proyecto real (`public.conversaciones` no existe ahí) — confirmado al intentar la
verificación en vivo. Aplicar una migración es infraestructura compartida, no algo que este agente
haga sin más (`CLAUDE.md` → "Desplegar no es tuyo"): pendiente de que el usuario la ejecute desde el
SQL Editor del panel de Supabase. En cuanto esté aplicada, la verificación en vivo se repite antes
de marcar la ficha como Verificada.

## Decisiones tomadas

- **`POST /api/conversacion` nuevo.** Sin body. Inserta la fila con `consentimiento_en = now()`,
  `expira_en = iniciada_en + 30 días`, `estado = 'en_curso'`, y devuelve `{ token }`. No enlaza
  ningún cliente todavía — a esa altura no hay ni nombre ni email.
- **`POST /api/chat` cambia de contrato:** pasa a exigir `token` en el body, junto a `messages`.
  Antes de llamar a Claude, el servidor valida por `token` que la conversación existe, está
  `en_curso` y no ha expirado — sin eso, 401 con mensaje genérico (nunca detalle técnico, ver
  `FLOW-01` → "Casos de error"). Cada turno válido incrementa `turnos_totales`.
- **`clientes`/`fichas`/`deudas`/`informes`/`planes` se escriben todos juntos, solo al cierre** (el
  mismo instante donde hoy `contieneFicha` dispara `M-03`) — no de forma incremental turno a turno.
  Es más estricto que una lectura literal de "el cliente se crea cuando da nombre y email": si el
  visitante da su nombre y abandona antes de terminar, con este diseño no se crea ninguna fila de
  `clientes`, en vez de dejar un cliente huérfano de una conversación nunca cerrada.
- **Atomicidad aceptada como riesgo conocido, no resuelta con una función RPC.** Las seis escrituras
  del cierre van como inserts secuenciales desde `route.ts`, no en una transacción SQL. Para el MVP
  de la Fase 1 se acepta el riesgo de un fallo a mitad (p. ej. ficha sin informe) — se detecta por
  los logs del servidor, no hay compensación automática. Se revisita si llega a pasar en la
  práctica; no se construye la función RPC por adelantado para un caso que todavía no ha ocurrido.
- **Gap encontrado al diseñar esto:** `email` está en el contrato de texto de la ficha (bloque 0,
  `instrucciones-sistema.md`) pero ni `Ficha` (`lib/motor/ficha.ts`) ni `parsearFicha`
  (`lib/motor/parseo.ts`) lo capturaban — hacía falta para poder crear/enlazar `clientes`, que es
  donde vive el email según `docs/data-model.md`. Se añade `email: Dato<string>` a `Ficha`; el motor
  (`calcularInforme`) lo ignora para cualquier cálculo, solo lo usa la capa de persistencia.
- **Enlazar cliente por email, no crear uno nuevo cada vez.** Si ya existe un cliente con ese email
  (normalizado a minúsculas), la conversación se enlaza a él en vez de duplicar el lead — regla ya
  escrita en `docs/data-model.md`, aquí se implementa.
- **El token vive solo en memoria de `ChatWindow` (estado de React), no en `localStorage`.**
  Recargar la página pierde el hilo de la conversación — coherente con que no hay `C-01`
  (recuperar conversación anterior) en esta versión; no tiene sentido persistir en el navegador un
  token que no sirve para nada si se recupera.
- **El harness PGlite pasa del scratchpad a `scripts/verificar-persistencia.mjs`, checked in.**
  Hasta ahora vivía en un archivo temporal fuera del repo; para que la tabla de cobertura pueda
  señalar un script real y repetible (no uno que ya no existe la siguiente sesión), se añade
  `@electric-sql/pglite` como devDependency y el script se guarda en el repo.
- **Sin job de limpieza de conversaciones expiradas ni de detección de abandono por inactividad.**
  `expira_en` solo se usa para rechazar turnos en `/api/chat`; nada purga filas viejas ni marca
  `abandonada` automáticamente todavía — anotado en "Fuera de esta feature".

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-06 | `src/app/api/conversacion/route.ts` (crea la conversación al aceptar el consentimiento) | `src/app/api/conversacion/route.test.ts` |
| M-06 | `src/components/chat/consent-screen.tsx` + cambios en `chat-window.tsx` (pantalla previa a "Empezar", llama a `POST /api/conversacion`, guarda el token en estado de React) | no verificable por interfaz: componente visual + integración de red desde el navegador, sin E2E `FLOW-01` construido todavía (`docs/testing.md`); se comprueba manualmente sirviendo `pnpm dev` en `/chat` y confirmando que la conversación se crea en PGlite antes de "Empezar" |
| M-04 | `src/lib/motor/ficha.ts` + `src/lib/motor/parseo.ts` (campo `email` añadido al contrato) | `src/lib/motor/parseo.test.ts` (casos nuevos con email) |
| M-04 | `src/lib/supabase/server.ts` (cliente con `SUPABASE_SERVICE_ROLE_KEY`, solo servidor) | no verificable por interfaz: cliente sin lógica propia; lo ejercitan los tests de las rutas que lo usan (filas siguientes) |
| M-04 | `src/app/api/chat/route.ts` (valida `token` en cada turno; al detectar la ficha de cierre, persiste cliente/ficha/deudas/informe/plan y marca `completada`) | `src/app/api/chat/route.test.ts` (Supabase mockeado) |
| M-04 | Queries de escritura reales (inserts de cierre, upsert de cliente por email) | `scripts/verificar-persistencia.mjs` |

## Fuera de esta feature

- `M-05` (aviso automático por email al asesor) — comparte el mismo trigger de "conversación
  completada", pero es una integración aparte (Edge Function + SMTP).
- `S-01` (panel del asesor) — necesita esta persistencia para existir, pero no se construye aquí.
- Límite de uso por IP (`limites_uso`, rate limiting) — bloqueante para exponer la landing, pero es
  una feature propia con sus propios umbrales por decidir.
- Función RPC transaccional para las escrituras de cierre — ver "Decisiones tomadas": riesgo
  aceptado por ahora, no resuelto aquí.
- Job de purga de conversaciones expiradas o de detección de abandono por inactividad.
- Verificación en vivo contra el proyecto Supabase real — pendiente de que el usuario añada
  `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.local`, igual que hizo con
  `ANTHROPIC_API_KEY`. Si las añade a mitad de esta feature, se hace la verificación en vivo antes
  de marcar la ficha como Verificada; si no, la ficha se cierra con esa verificación pendiente,
  anotada con claridad.
