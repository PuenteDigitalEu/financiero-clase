# Revisión de mercado (M-09): Edge Function desplegada, pg_cron de alta, GitHub Actions retirado

**Fecha:** 2026-09-02 09:06
**Tipo:** Configuración
**Requisitos:** M-09 (deja la revisión diaria corriendo sola)

## Qué se hizo

Se completó el despliegue de la revisión diaria como Edge Function + `pg_cron` (diseño del
changelog 2026-09-01):

- **CLI de Supabase** instalada en la máquina del usuario (binario suelto — no hay paquete en
  winget), `supabase login` + `supabase link --project-ref ekuxwmktzasyxvziijdz`.
- **`supabase secrets set REVISION_SECRET=…`** con un secreto nuevo (el que se usó en las primeras
  pruebas apareció en capturas de pantalla; queda rotado).
- **`supabase functions deploy revision-mercado --no-verify-jwt`**. Primer intento falló al
  bundlear (`deno.json` no se subía y el import de valor era un especificador bare) — arreglado en
  el changelog 2026-09-02 08:19; segundo intento OK.
- **SQL del cron** (SQL Editor): `create extension pg_cron` / `pg_net`, secreto en el Vault
  (`vault.create_secret` → luego `vault.update_secret` para corregir un valor que se puso con el
  texto placeholder), y `cron.schedule('revision-mercado-diaria', '15 22 * * 1-5', …)` con
  `net.http_post` a la URL de la función, leyendo el `Bearer` del Vault.
- **`.github/workflows/revision-diaria.yml`** retirado — lo reemplaza el `pg_cron`.

## Verificación (todo contra producción, 2026-09-02)

- `curl -X POST …/functions/v1/revision-mercado` con el `Authorization: Bearer <secreto>` → **200**
  con el JSON de resumen (22 cierres descargados, 0 eventos). Sin cabecera → **401**
  `{"error":"No autorizado"}` (la protege el secreto propio, no el JWT de Supabase).
- Llamada de prueba del cron (`select net.http_post(...)` con el `Bearer` del Vault) → fila en
  `net._http_response` con `status_code = 200` y el resumen.
- `select * from cron.job where jobname = 'revision-mercado-diaria'` → `active = true`,
  `schedule = '15 22 * * 1-5'`.

## Qué se modificó

- Borrado: `.github/workflows/revision-diaria.yml`.
- `docs/architecture.md`, `docs/roadmap.md`, `docs/features/vigilancia-de-mercado.md` — al día.

## Pendiente

- Borrar los secrets `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del repo de GitHub (ya no los usa
  nada) — paso manual del usuario en la configuración del repo.
