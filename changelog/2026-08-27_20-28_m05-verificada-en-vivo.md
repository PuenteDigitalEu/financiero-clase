# M-05 verificada en vivo (Resend + Supabase reales)

**Fecha:** 2026-08-27 20:28
**Tipo:** Documentación (verificación, sin cambio de código)
**Requisitos:** M-05

## Qué se hizo

Con `RESEND_API_KEY` y `ADVISOR_NOTIFICATION_EMAIL` reales ya puestos en `.env.local`, se verificó
`docs/features/aviso-al-asesor.md` en vivo: `enviarAvisoAsesor()` envió un email real sin error a
`ADVISOR_NOTIFICATION_EMAIL`, y `registrarNotificacionAsesor()` dejó constancia real en
`notificaciones_asesor` contra el Supabase de producción — leída de vuelta para confirmar el
contenido y borrada después, sin dejar rastro.

## Qué se modificó

- `docs/features/aviso-al-asesor.md` — Estado → Verificada.
- `docs/roadmap.md` — `M-05` marcada como hecha (`[x]`), con el detalle de la verificación en vivo.

## Por qué

Cerrar con evidencia real la Fase 1 del roadmap en lo que a M-05 respecta — el email no es solo
código que compila, es un mensaje que de verdad tiene que llegarle al asesor.
