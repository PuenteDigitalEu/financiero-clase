# Capa de vigilancia de mercado (M-09): migración 0002 + lógica + revisión diaria

**Fecha:** 2026-08-31 11:41
**Tipo:** Feature + Migración
**Requisitos:** M-09 (añadido a `docs/prd.md` con esta feature; ficha
`docs/features/vigilancia-de-mercado.md`, **Verificada**).

## Qué se hizo

Capa nueva montada **encima** del esquema y el flujo existentes, sin tocar nada de lo que ya había.
Vigila movimientos de mercado y, cuando uno cruza un umbral, avisa al asesor y —si el cliente lo ha
pedido— al propio cliente.

### 1. Migración `supabase/migrations/0002_alertas_de_mercado.sql` (escrita y aplicada)

- **Enums:** `clase_activo`, `direccion_movimiento`, `estado_alerta`, `banda_probabilidad`.
- **Columnas nuevas:** `clientes.avisar_cliente` (bool, not null, default false),
  `informes.probabilidad` (numeric), `informes.banda` (`banda_probabilidad`). `informes.mc_banda` /
  `mc_probabilidad_cumplimiento` no se tocan: conviven.
- **Tablas:** `observaciones_mercado`, `reglas_alerta`, `eventos_mercado`, `alertas`, `posiciones`.
- **Los tres `UNIQUE` de idempotencia** (lo importante del archivo): `observaciones_mercado
  (clase, fecha)`, `eventos_mercado (regla_id, hasta)`, `alertas (evento_id, cliente_id)`. Hacen que
  reejecutar el pipeline no duplique observaciones, eventos ni alertas, ni reenvíe correos.
- **RLS** activado en las cinco, con policy `..._select` para `authenticated` vía `es_asesor()` (la
  función de 001). Ninguna policy para `anon`.
- **Siembra:** tres reglas de caída de renta variable a 5 días — umbral en tanto por uno
  0.03 / 0.04 / 0.06 para conservador / moderado / dinamico.
- **Aplicada contra el Supabase real** el 2026-08-31 con `apply_migration` del MCP de Supabase, que
  la registra en el historial (`20260831093650_alertas_de_mercado`). Verificado en vivo: las 5
  tablas con sus columnas y enums, los 3 `UNIQUE`, RLS + policies, las 3 columnas nuevas y las 3
  reglas sembradas.

### 2. `src/lib/alertas/` — el "cerebro", lógica pura

- `umbrales.ts` — tipos (`Observacion`, `ReglaAlerta`, `EventoDetectado`, `ClienteConPlan`,
  `AnalisisCliente`) que corresponden columna a columna con las tablas de 0002, más el descargo
  legal obligatorio `DESCARGO_LEGAL = "Esto no constituye asesoramiento de inversión."`. Único campo
  fuera de las columnas de tabla: `EventoDetectado.perfilObjetivo`, arrastrado de
  `reglas_alerta.perfil` porque `clientesAfectados(evento, clientes)` no recibe la regla.
- `evaluar.ts` — `detectarEventos(serie, reglas)` y `clientesAfectados(evento, clientes)`, puras
  (sin red, sin BD, sin IA), no mutan sus argumentos. `clientesAfectados` aplica exactamente tres
  exclusiones: análisis `suspendido`, sin análisis, y perfil distinto al de la regla (salvo regla
  sin perfil).
- `redactar.ts` — `mensajeInterno(evento)`: frase en español que describe el hecho (porcentaje +
  dos fechas). Nunca recomienda comprar ni vender.
- `evaluar.test.ts` — 13 tests vitest: día tranquilo → 0 eventos, caída sobre umbral → 1 evento,
  cliente suspendido fuera, cliente sin análisis fuera, perfil distinto fuera, + regla inactiva,
  fallback "menos histórico que la ventana", regla sin perfil aplica a todos, y `mensajeInterno` sin
  verbos de compra/venta.

### 3. `scripts/revision.ts` — la revisión diaria que lo une todo

Cada ejecución: (1) descarga los cierres del último mes del S&P 500 (SPY) de la API pública de
Yahoo Finance con `User-Agent`, sin clave, y los guarda en `observaciones_mercado` con
`ON CONFLICT (clase, fecha) DO NOTHING`; (2) lee de Supabase las reglas activas y los clientes con
su perfil, modo y análisis; (3) decide con `detectarEventos` y `clientesAfectados` **importados**,
sin duplicar lógica; (4) registra evento + una alerta por cliente afectado apoyándose en los
`UNIQUE` (reejecutar no crea nada); (5) el correo al cliente está **apagado por defecto**
(`REVISION_ENVIAR_CORREO_CLIENTE=false`, decisión 2026-08-31): la alerta se registra pero no se
envía nada ni se marca `avisado_cliente_en`; el resumen cuenta esos avisos como
`avisos_cliente_omitidos`. El código de envío HTML por Resend queda listo para cuando se active;
(6) imprime un resumen en JSON. `@supabase/supabase-js` con la service role key desde el entorno;
ninguna clave en el código.

### 4. Programación: GitHub Actions

`.github/workflows/revision-diaria.yml` — cron `15 22 * * 1-5` (22:15 UTC, L-V, tras el cierre de
EE. UU.) + `workflow_dispatch`. Elegido frente a Vercel Cron porque no hay que exponer ni proteger
ninguna ruta HTTP: el runner efímero recibe los secrets, corre `pnpm revision` y desaparece.
`permissions: contents: read`, `concurrency` para serializar. Necesita los secrets del repo
`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

### 5. Verificación estructural: `scripts/verificar-revision.mjs`

Análogo a `verificar-persistencia.mjs`: PGlite (Postgres real en WASM), aplica 001 + 0002 y
comprueba que las tres inserciones idempotentes de `revision.ts` (observación, evento, alerta) con
`on conflict do nothing` no crean duplicados al reinsertar (1 → 0, total 1), y que las FK, el enum
`clase_activo` y el `check` de `perfil` rechazan lo que deben. No corre en CI (descarga el WASM).

## Qué se modificó

- Nuevos: `supabase/migrations/0002_alertas_de_mercado.sql`, `src/lib/alertas/umbrales.ts`,
  `src/lib/alertas/evaluar.ts`, `src/lib/alertas/redactar.ts`, `src/lib/alertas/evaluar.test.ts`,
  `scripts/revision.ts`, `scripts/verificar-revision.mjs`,
  `.github/workflows/revision-diaria.yml`, `docs/features/vigilancia-de-mercado.md`.
- `docs/prd.md` — requisito `[M-09]` en MUST, con criterio de aceptación y caso negativo.
- `docs/roadmap.md` — sección "Vigilancia de mercado (M-09)" con lo hecho y lo pendiente.
- `docs/architecture.md` — `src/lib/alertas/`, `scripts/` y `.github/workflows/` en la estructura.
- `docs/data-model.md` — enums nuevos, columnas nuevas en `clientes` e `informes`, las 5 tablas con
  sus `UNIQUE`, el diagrama ER, RLS (9 → 14 tablas), fila de la migración 0002, datos seed.
- `.env.example` — sección "Revisión diaria de mercado": `REVISION_ENVIAR_CORREO_CLIENTE=false`
  (correo al cliente apagado) y `REVISION_EMAIL_FROM` (remitente cuando se active).
- `package.json` — `tsx` (devDep, para ejecutar el script `.ts`) y el comando `pnpm revision`.
- `pnpm-workspace.yaml` — `allowBuilds: esbuild: true` (dependencia de `tsx`).
- `pnpm-lock.yaml` — `tsx` y sus dependencias.

## Verificación

- `pnpm exec tsc --noEmit` → sin errores (sin `any`).
- `pnpm exec eslint scripts/revision.ts src/lib/alertas/` → sin avisos.
- `pnpm test` → 161/161 (148 previas + 13 nuevas de alertas).
- `node scripts/verificar-cobertura.mjs` → sin fallos; la ficha de M-09 pasa.
- `node scripts/verificar-revision.mjs` → **todo en orden**: los 3 `UNIQUE` de idempotencia
  (1 → 0, total 1 al reinsertar), FK y `check` verificados contra Postgres real (PGlite) con
  001 + 0002 aplicadas.
- Migración 0002 aplicada y verificada en vivo contra el Supabase real (ver arriba y
  `docs/data-model.md` → "Migraciones").
- `scripts/revision.ts` **ejecutado de extremo a extremo contra el Supabase real** (2026-08-31):
  23 cierres del S&P 500 descargados de Yahoo Finance e insertados en `observaciones_mercado`,
  3 reglas activas leídas, 1 cliente evaluado, `eventos: []` (ninguna regla cruzó su umbral),
  `correo_cliente_activo: false`, 0 fallos, salida con código 0. La ficha queda **Verificada**.

## Por qué

Era la pieza que faltaba para pasar de "tenemos ficha + diagnóstico de cada cliente" a "avisamos
proactivamente cuando el mercado se mueve en contra del plan". La lógica se separó en funciones
puras testeables (`src/lib/alertas/`) del proceso con efectos secundarios (`scripts/revision.ts`),
igual que se hizo con `lib/motor/`. Los tres `UNIQUE` son deliberados: permiten que la revisión
corra en un cron a diario sin miedo a duplicar avisos si se reejecuta.

## Pendiente

- **Secrets de GitHub Actions:** poner `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el repo
  (Settings → Secrets and variables → Actions) para que el cron diario `revision-diaria.yml` se
  ejecute solo. La corrida a mano del 2026-08-31 ya funcionó; falta que quede automatizada.
- **Correo al cliente:** apagado a propósito (`REVISION_ENVIAR_CORREO_CLIENTE=false`). Activarlo
  requiere un dominio verificado en Resend + `REVISION_EMAIL_FROM`, y una decisión de negocio sobre
  cuándo empezar a escribir a clientes por movimientos de mercado (queda fuera del criterio de M-09
  hoy — ver la ficha).
- **Otras clases de activo:** el esquema soporta `liquidez` / `renta_fija` / `oro`, pero la revisión
  solo descarga renta variable (S&P 500).
