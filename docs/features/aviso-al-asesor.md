# Aviso automático al asesor (M-05)

**Estado:** Verificada
**Requisitos que cierra:** M-05
**Fecha de acuerdo:** 2026-08-27

## Qué se construye

Cuando un visitante completa la entrevista y se genera su diagnóstico (el mismo instante donde
`M-03`/`M-04` ya calculan y persisten el informe y el plan), el sistema envía automáticamente un
email al asesor con el resumen del caso — sin que el asesor tenga que estar revisando activamente
(`FLOW-02`). Un fallo de envío nunca hace perder la ficha ni el informe, que ya están guardados de
forma independiente: se registra como intento fallido y el visitante sigue recibiendo su plan con
normalidad.

## Decisiones tomadas

- **Resend por API HTTP directa, no Supabase Edge Function + SMTP** — decisión delegada por el
  usuario ("recomiéndame tú"). Una Edge Function habría necesitado desplegarse contra Supabase
  (este agente no puede desplegar infraestructura por su cuenta, ver `CLAUDE.md` → "Límites de
  ejecución") y credenciales SMTP aparte; Resend es una llamada `fetch` más desde `app/api/chat/`,
  sin nada que desplegar. Actualizado en `docs/architecture.md`.
- **El aviso nunca bloquea la respuesta al visitante.** `avisarAsesorSinBloquear()` en `route.ts`
  atrapa cualquier fallo (de Resend o del propio registro en `notificaciones_asesor`) y sigue —
  el plan ya calculado y persistido se le muestra igual (`FLOW-02` → "Casos de error").
- **Se registra el intento siempre, éxito o fallo** — `registrarNotificacionAsesor()` inserta en
  `notificaciones_asesor` con `estado: 'enviado'|'fallido'` y `enviado_en` solo si tuvo éxito. Sin
  reintento automático en esta versión: si falla, la ficha/informe siguen consultables por el
  asesor (fuera de esta feature, vía `S-01` o consulta directa a Supabase) aunque el email no
  llegara.
- **`from` fijo del dominio sandbox de Resend** (`onboarding@resend.dev`) hasta que el usuario
  verifique un dominio propio en Resend — funcional para empezar, pero limitado (Resend restringe a
  quién puede enviar el sandbox); cambiarlo cuando haya dominio verificado no toca el resto del
  código, solo la constante en `lib/email/aviso-asesor.ts`.
- **Sin plantilla HTML** — el email es texto plano con el markdown del plan tal cual. Suficiente
  para el MVP (el asesor lo lee él mismo, no es una comunicación de cara al cliente); una plantilla
  más cuidada queda para `mejoras/` si hace falta más adelante.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-05 | `src/lib/email/aviso-asesor.ts` (llamada a Resend) | `src/lib/email/aviso-asesor.test.ts` |
| M-05 | `src/lib/supabase/persistencia.ts` → `registrarNotificacionAsesor()` | `src/lib/supabase/persistencia.test.ts` |
| M-05 | `src/app/api/chat/route.ts` → `avisarAsesorSinBloquear()` (dispara el aviso al cerrar, nunca bloquea la respuesta) | `src/app/api/chat/route.test.ts` |

## Fuera de esta feature

- Plantilla HTML del email (texto plano por ahora).
- Reintento automático de envíos fallidos.
- Verificación de dominio propio en Resend (usa el sandbox `resend.dev` mientras tanto).
- **Verificado en vivo (2026-08-27):** email real enviado sin error a `ADVISOR_NOTIFICATION_EMAIL`
  vía Resend, y notificación registrada de verdad en `notificaciones_asesor` contra el Supabase
  real — fila leída de vuelta y limpiada después, sin dejar rastro.
