# Revisión diaria de mercado (M-09): de GitHub Actions a Edge Function + pg_cron

**Fecha:** 2026-09-01 20:59
**Tipo:** Refactor + Configuración
**Requisitos:** M-09 (cambia cómo se programa; el criterio de aceptación no cambia)

## Qué se hizo

`pg_cron` solo sabe llamar a una URL, y no hay ninguna app desplegada que sirva de destino. Se pasa
la revisión diaria a una **Supabase Edge Function** disparada por `pg_cron`, reemplazando el cron de
GitHub Actions. La lógica **no se duplica**.

### Refactor: `src/lib/alertas/revision-core.ts` (nuevo)

Todo el cuerpo de la revisión, agnóstico del entorno: recibe el cliente de Supabase y la config del
correo ya montados, y **devuelve** el resumen (no imprime, no lee variables de entorno, no termina
el proceso). Sale de `scripts/revision.ts` sin cambiar ni una regla: descarga de Yahoo, upsert
idempotente en `observaciones_mercado`/`eventos_mercado`/`alertas`, decisión con `detectarEventos` /
`clientesAfectados`, correo al cliente tras flag, resumen tipado (`ResumenRevision`).

- `scripts/revision.ts` queda como envoltorio fino Node/tsx (~45 líneas): lee `process.env`, monta
  el cliente, llama a `ejecutarRevision`, imprime el JSON, fija el código de salida. `pnpm revision`
  sigue funcionando igual — verificado con una corrida real tras el refactor.
- Los imports relativos de `src/lib/alertas/` pasan a llevar extensión `.ts` (Deno la exige, tsx la
  acepta). `tsconfig.json`: `allowImportingTsExtensions: true`.

### Edge Function: `supabase/functions/revision-mercado/` (nueva)

`index.ts` (Deno): comprueba el secreto, lee variables de entorno, monta el cliente de Supabase y
llama a `ejecutarRevision`. Importa `../../../src/lib/alertas/revision-core.ts` — misma lógica.

- **Autorización sin login de usuario:** `verify_jwt = false` (`supabase/config.toml`). El cron
  manda `Authorization: Bearer <REVISION_SECRET>`; la función lo compara. El secreto se guarda en
  el Vault de Supabase para que `pg_cron` lo lea sin dejarlo en claro en `cron.job`.
- `supabase/functions/deno.json` mapea `@supabase/supabase-js` a su especificador `npm:`.
- `supabase/config.toml` mínimo (`project_id` + la sección de la función).
- `supabase/functions/revision-mercado/README.md`: pasos de `supabase functions deploy` y el SQL de
  `pg_cron` (extensiones, secreto en Vault, `cron.schedule` con `net.http_post`, consultas de
  operación).

## Qué se modificó

- Nuevos: `src/lib/alertas/revision-core.ts`, `supabase/functions/revision-mercado/index.ts`,
  `supabase/functions/revision-mercado/README.md`, `supabase/functions/deno.json`,
  `supabase/config.toml`.
- `scripts/revision.ts` — reducido a envoltorio.
- `src/lib/alertas/{evaluar,redactar,evaluar.test}.ts` — imports con extensión `.ts`.
- `tsconfig.json` — `allowImportingTsExtensions: true`; `exclude` añade `supabase/functions`.
- `eslint.config.mjs` — ignora `supabase/functions/**` (código Deno).
- `.env.example` — aclara que las variables `REVISION_*` son del envoltorio local; en producción
  los secretos van con `supabase secrets set`, incluido `REVISION_SECRET`.
- `docs/architecture.md`, `docs/roadmap.md`, `docs/features/vigilancia-de-mercado.md` — al día.

## Verificación

- `pnpm exec tsc --noEmit` → sin errores.
- `pnpm exec eslint .` → sin errores (solo el aviso previo de `persistencia.test.ts`).
- `pnpm test` → 163/163.
- `node scripts/verificar-cobertura.mjs` → sin fallos.
- `node scripts/verificar-revision.mjs` → todo en orden.
- `pnpm revision` tras el refactor → corrida real limpia contra el Supabase de producción
  (22 cierres, 0 eventos, exit 0). La Edge Function **no se ha desplegado** desde aquí: ni la CLI de
  Supabase ni Deno están en esta máquina, y el MCP está en solo lectura.

## Pendiente

- Desplegar la Edge Function y dar de alta el `pg_cron` — pasos del usuario, en el README de la
  función.
- Retirar `.github/workflows/revision-diaria.yml` y sus secrets de GitHub cuando el `pg_cron` esté
  verificado.
