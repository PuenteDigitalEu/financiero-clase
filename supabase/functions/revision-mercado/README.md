# Edge Function `revision-mercado` — despliegue y cron

Ejecuta la revisión diaria de mercado (M-09). La dispara `pg_cron` llamando a la URL de la
función, autorizada con un secreto propio (`REVISION_SECRET`) en la cabecera `Authorization` —
**no** con el login de un usuario.

Toda la lógica está en `src/lib/alertas/revision-core.ts`, compartida con `scripts/revision.ts`
(que sigue sirviendo para ejecutarla a mano en local con `pnpm revision`).

- **URL:** `https://ekuxwmktzasyxvziijdz.supabase.co/functions/v1/revision-mercado`
- **Método:** `POST` · **Cabecera:** `Authorization: Bearer <REVISION_SECRET>`
- Devuelve el mismo JSON de resumen que `pnpm revision`. `200` si todo fue bien; `401` sin/ con
  secreto incorrecto; `500` si algo falló.

---

## 1. Preparar la CLI (una vez)

```bash
# La CLI no estaba instalada en este repo. Con Scoop en Windows:
scoop install supabase
# (o ver https://supabase.com/docs/guides/cli para otros sistemas)

supabase login
supabase link --project-ref ekuxwmktzasyxvziijdz
```

## 2. Secreto de la función

Genera un secreto largo y aleatorio (p. ej. `openssl rand -hex 32`). Guárdalo en dos sitios con
**el mismo valor**:

```bash
# a) como secret de la Edge Function
supabase secrets set REVISION_SECRET=<EL_SECRETO>
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta la plataforma sola: no hay que ponerlos.
Solo si se activa el correo al cliente: `supabase secrets set REVISION_ENVIAR_CORREO_CLIENTE=true RESEND_API_KEY=... REVISION_EMAIL_FROM="Asesoría <avisos@dominio.com>"`.

## 3. Desplegar

```bash
supabase functions deploy revision-mercado --no-verify-jwt
```

`--no-verify-jwt` (equivalente a `verify_jwt = false` en `supabase/config.toml`): la función no
exige un JWT de Supabase; la autorización la hace su propio código con `REVISION_SECRET`.

Prueba manual:

```bash
curl -i -X POST 'https://ekuxwmktzasyxvziijdz.supabase.co/functions/v1/revision-mercado' \
  -H 'Authorization: Bearer <EL_SECRETO>'
```

Debe devolver `200` y el JSON de resumen. Sin la cabecera o con un valor distinto → `401`.

## 4. Programar con pg_cron

En el **SQL Editor** del panel (con la página **sin traducir**):

```sql
-- Extensiones (una vez). También se pueden activar en Database → Extensions.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- El secreto en Vault, mismo valor que REVISION_SECRET. Así no queda en claro en cron.job.
select vault.create_secret(
  '<EL_SECRETO>',
  'revision_secret',
  'Bearer para la Edge Function revision-mercado'
);

-- Cron: 22:15 UTC de lunes a viernes (tras el cierre de EE. UU.).
select cron.schedule(
  'revision-mercado-diaria',
  '15 22 * * 1-5',
  $$
  select net.http_post(
    url     := 'https://ekuxwmktzasyxvziijdz.supabase.co/functions/v1/revision-mercado',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret
                                     from vault.decrypted_secrets
                                     where name = 'revision_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
```

Comprobar / operar el cron:

```sql
select * from cron.job;                                            -- el job programado
select * from cron.job_run_details order by start_time desc limit 5;  -- últimas ejecuciones del cron
select id, status_code, content from net._http_response order by created desc limit 5;  -- respuestas de la función

select cron.unschedule('revision-mercado-diaria');                 -- quitar el cron
```

## 5. Retirar el cron de GitHub Actions

Cuando esta función esté verificada corriendo por pg_cron, sobra el otro:

- Borrar `.github/workflows/revision-diaria.yml`.
- Borrar los secrets `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del repo de GitHub.
