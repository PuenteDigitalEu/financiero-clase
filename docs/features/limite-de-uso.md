# Límite de uso por IP

**Estado:** Verificada
**Requisitos que cierra:** M-08 (añadido en `docs/prd.md` a la vez que esta ficha — antes era
prosa sin ID bajo "Requisitos no funcionales" → "Protección contra abuso").
**Fecha de acuerdo:** 2026-08-27

## Qué se construye

`POST /api/conversacion` y `POST /api/chat` comprueban, antes de actuar, cuántas veces ha actuado
esa misma IP (por su hash, nunca en claro) en la ventana reciente. Por encima del umbral, se
rechaza con un mensaje genérico — nunca se le dice al visitante cuál es el límite ni cuánto le
queda (`docs/user-flows.md` → FLOW-01, "Casos de error").

## Decisiones tomadas

- **Umbrales** (`docs/architecture.md` los dejaba sin fijar a propósito): 10 conversaciones nuevas
  por IP cada 24 h, y 150 mensajes por IP cada 24 h. Pensado para tráfico bajo y por invitación
  (`docs/prd.md` → "Disponibilidad"): cubre con margen a alguien que abandona y reintenta varias
  veces, sin dejar hueco a un bucle automatizado que vacíe el saldo de la API de Claude.
- **Hash con pepper, no un SHA-256 desnudo.** El espacio de direcciones IPv4 es pequeño (~4.300
  millones) — un hash sin sal se revierte por fuerza bruta en minutos. Se usa
  HMAC-SHA256 con un secreto de despliegue (`IP_HASH_PEPPER`, nuevo en `.env.local`) para que el
  hash guardado no sea reversible sin ese secreto — más acorde con la minimización de datos que ya
  exige `docs/prd.md` → "Protección de datos (RGPD)".
- **Solo se cuenta lo que se permite.** Un intento rechazado no inserta una fila nueva en
  `limites_uso` — cuenta lo ya ocurrido dentro de la ventana, no infla el contador con los propios
  rechazos.
- **IP de origen: `x-forwarded-for` (primer valor), con `x-real-ip` como respaldo.** Es lo que
  Vercel (destino de despliegue, `docs/architecture.md`) inyecta de forma fiable; en local, sin
  ninguna de las dos cabeceras, se usa un valor fijo (`"local"`) para no romper el flujo en
  desarrollo.
- **429, no 400 ni 401.** Es semánticamente el código correcto para "demasiadas peticiones" y
  distingue este caso de un cuerpo mal formado o un token inválido.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-08 | `src/lib/ip.ts` (obtener IP + hash con pepper) | `src/lib/ip.test.ts` |
| M-08 | `src/lib/supabase/persistencia.ts` → `comprobarLimiteUso()` | `src/lib/supabase/persistencia.test.ts` |
| M-08 | `src/app/api/conversacion/route.ts` (límite antes de crear conversación) | `src/app/api/conversacion/route.test.ts` |
| M-08 | `src/app/api/chat/route.ts` (límite antes de procesar cada turno) | `src/app/api/chat/route.test.ts` |

## Verificación

126→144 tests (mockeado, `pnpm test`), `pnpm build`/`tsc` limpios. **En vivo (2026-08-27)** contra
el Supabase real: `comprobarLimiteUso()` permite hasta el umbral, rechaza a partir de él, y los
rechazos no insertan fila — comprobado contando filas reales, no solo el valor de retorno. Además,
una llamada HTTP real a `POST /api/conversacion` (servidor de desarrollo, con `IP_HASH_PEPPER`
generado localmente y añadido a `.env.local`) devolvió un token válido de principio a fin. Todo lo
creado durante la verificación se borró después.

## Fuera de esta feature

- Panel o alerta para que el asesor vea IPs bloqueadas — no hay panel (`S-01`) todavía.
- Lista blanca de IPs (p. ej. la del propio asesor) — no se ha pedido, se añade si hace falta.
- Ajuste dinámico de umbrales sin redeploy — quedan como constantes en código.
