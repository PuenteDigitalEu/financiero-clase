# M-04 + M-06 verificadas en vivo contra Supabase real

**Fecha:** 2026-08-27 19:58
**Tipo:** Documentación (verificación + incidencia real, sin cambio de código de producto)
**Requisitos:** M-04, M-06

## Qué se hizo

Con `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` reales ya puestos en `.env.local`,
se intentó la verificación en vivo de `docs/features/consentimiento-y-persistencia.md`.

**Incidencia encontrada:** el proyecto Supabase (`ekuxwmktzasyxvziijdz`) tenía un esquema
completamente distinto al de `supabase/migrations/001_esquema_inicial.sql` — tablas `entrevistas`,
`analisis`, `mensajes` (de una versión anterior del diseño, con `fichas.datos` como un único jsonb
en vez de las columnas explícitas actuales), no las de este repo. Diagnosticado leyendo el esquema
OpenAPI que expone PostgREST (`GET /rest/v1/`), comparando columnas reales contra las esperadas.

El usuario confirmó que ese esquema anterior estaba vacío y podía borrarse. Se limpiaron esas 8
tablas y sus tipos (`drop table/type if exists ... cascade`), y se aplicó
`001_esquema_inicial.sql` de verdad, ambos pasos ejecutados por el usuario desde el SQL Editor del
panel de Supabase (aplicar DDL contra la base de datos real no es algo que este agente haga sin
más — ver `CLAUDE.md` → "Desplegar no es tuyo"; el agente solo tenía acceso de lectura/escritura de
filas vía REST con la clave de servicio, no ejecución de SQL arbitrario).

**Verificación en vivo, ya con el esquema correcto:**
1. Columnas exactas de `conversaciones`, `fichas`, `deudas`, `informes`, `planes`, `clientes`
   comparadas contra el esquema OpenAPI real — todas presentes.
2. Ciclo completo ejecutado contra el proyecto real: `crearConversacion` → `validarToken` →
   `incrementarTurno` → `persistirCierre` (cliente + ficha + deuda + informe + plan) → cada fila
   leída de vuelta y comparada con lo escrito (no solo "no dio error"). Al terminar, se borró todo
   lo que la prueba creó — las tablas quedaron a 0 filas, confirmado.

Con esto, `docs/features/consentimiento-y-persistencia.md` pasa a **Verificada**.

## Qué se modificó

- `docs/features/consentimiento-y-persistencia.md` — Estado → Verificada, estado real actualizado.
- `docs/roadmap.md` — `M-04` y `M-06` marcadas como hechas (`[x]`), con el detalle de la
  verificación en vivo y la incidencia del esquema.
- `docs/data-model.md` → "Migraciones" — aplicada contra Supabase real, con la incidencia y su
  resolución documentadas.

## Por qué

Cerrar con evidencia real la duda que quedaba abierta: si la persistencia funcionaba de verdad
contra el proyecto Supabase de producción, no solo contra el mock y PGlite. De paso, la incidencia
del esquema es la prueba de por qué esta verificación importaba — sin ella, el código habría fallado
en el primer visitante real sin que nadie lo supiera hasta entonces.
