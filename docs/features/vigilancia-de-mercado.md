# Vigilancia de mercado (M-09)

**Estado:** Verificada
**Requisitos que cierra:** M-09
**Fecha de acuerdo:** 2026-08-31

## Qué se construye

Una capa nueva, montada **encima** del MVP sin tocar el flujo del chat, que vigila los movimientos
de mercado y avisa cuando uno va en contra del plan de un cliente. Todos los días:

1. Se descargan los cierres del último mes de un índice de referencia de renta variable (S&P 500 vía
   el ETF SPY, API pública de Yahoo Finance, sin clave) y se guardan en `observaciones_mercado`.
2. Para cada regla activa de `reglas_alerta`, se compara el último nivel con el del inicio de su
   ventana de días. Si la variación cruza el umbral en su dirección, se registra un **evento**.
3. Cada evento se reparte a los **clientes afectados**: los que tienen un análisis vigente y cuyo
   perfil coincide con el de la regla (o la regla no tiene perfil). Quedan fuera los que no tienen
   análisis, los que lo tienen en modo `suspendido` y los de otro perfil.
4. Por cada cliente afectado se registra una **alerta** con una frase que describe el hecho
   (porcentaje y fechas) — nunca una recomendación de comprar o vender.

Todo el pipeline es **idempotente**: reejecutar la revisión sobre los mismos datos no crea
observaciones, eventos ni alertas duplicados. Eso lo garantizan tres `unique` — `(clase, fecha)`,
`(regla_id, hasta)` y `(evento_id, cliente_id)` — y el uso de `on conflict do nothing` en el script.

El asesor consulta las alertas en la base de datos (RLS: SELECT solo para asesores). El aviso por
correo **al propio cliente** queda fuera de esta feature de momento (ver "Fuera de esta feature").

## Decisiones tomadas

- **`analisis` del enunciado original = tabla `informes`.** No existe una tabla `analisis` en el
  esquema vigente; el "análisis" de un cliente es su informe más reciente, y su perfil el de la
  ficha de ese informe.
- **`umbral` y `variacion` en tanto por uno** (`0.03` = 3 %), no en porcentaje. `variacion` se
  guarda **con signo** (negativa = caída).
- **`EventoDetectado.perfilObjetivo`** es el único campo que no es columna de `eventos_mercado`: se
  arrastra de `reglas_alerta.perfil` porque `clientesAfectados(evento, clientes)` no recibe la regla.
- **`clientesAfectados` aplica exactamente tres exclusiones** (suspendido, sin análisis, perfil
  distinto). No filtra por `avisar_cliente` ni por si el cliente tiene posiciones en esa clase.
- **Lógica pura separada del efecto secundario:** `src/lib/alertas/` no toca IA;
  `src/lib/alertas/revision-core.ts` es quien descarga, lee, escribe y envía, pero de forma
  agnóstica del entorno (recibe el cliente de Supabase y la config ya montados, devuelve el
  resumen). Mismo patrón que `lib/motor/` vs. `app/api/chat/`.
- **Un solo cuerpo, dos envoltorios finos** (`revision-core.ts` no se duplica): `scripts/revision.ts`
  (Node/tsx, ejecución a mano) y `supabase/functions/revision-mercado/` (Deno, la Edge Function).
  Los imports de `src/lib/alertas/` llevan extensión `.ts` porque Deno la exige.
- **Programación con Supabase Edge Function + `pg_cron`** (2026-09-01, reemplaza a la decisión de
  GitHub Actions del 2026-08-31): `pg_cron` solo sabe llamar a una URL y no hay ninguna app
  desplegada que sirva de destino; la Edge Function es esa URL sin nada más que mantener.
- **La Edge Function no usa el login de Supabase** (`verify_jwt = false`): la autoriza un secreto
  propio, `REVISION_SECRET`, en `Authorization: Bearer …`, guardado en el Vault de Supabase para no
  dejarlo en claro en `cron.job`. Lo comprueba el propio código de la función.
- **Correo al cliente apagado por defecto** (`REVISION_ENVIAR_CORREO_CLIENTE=false`, 2026-08-31): la
  alerta se registra pero no se le escribe hasta que haya un dominio verificado en Resend y se
  decida activarlo.
- **`tsx`** como devDependency para ejecutar `scripts/revision.ts` (TypeScript) sin montar Next.js;
  `pnpm revision` es el comando. `pnpm-workspace.yaml` → `allowBuilds: esbuild: true`.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-09 | `src/lib/alertas/` — `detectarEventos`, `clientesAfectados`, `mensajeInterno` | `src/lib/alertas/evaluar.test.ts` |
| M-09 | `supabase/migrations/0002_alertas_de_mercado.sql` — los 3 `unique` de idempotencia | no verificable por interfaz: son constraints de base de datos; verificadas con `pg_get_constraintdef` tras aplicar 0002 (changelog 2026-08-31) y ejercitadas en `scripts/verificar-revision.mjs` reinsertando el mismo evento/alerta |
| M-09 | `src/lib/alertas/revision-core.ts` — descarga, upsert idempotente en `observaciones_mercado`/`eventos_mercado`/`alertas`, resumen JSON. Envoltorios: `scripts/revision.ts` (Node) y `supabase/functions/revision-mercado/` (Deno) | `scripts/verificar-revision.mjs` |

## Fuera de esta feature

- **Aviso por correo al cliente.** El código existe pero está apagado tras un flag. Activarlo
  requiere un dominio verificado en Resend y una decisión de negocio sobre cuándo empezar a escribir
  a clientes por movimientos de mercado. Si se retoma, va con su propia entrada de changelog (y
  quizá su propio ID, ya que el criterio de M-09 hoy no lo incluye).
- **Más clases de activo y más índices.** El esquema soporta `liquidez`, `renta_fija`,
  `renta_variable` y `oro`, pero la revisión solo descarga renta variable (S&P 500). Añadir fuentes
  para las otras clases es trabajo futuro (`mejoras/`).
- **Uso de `posiciones` para acotar el reparto.** La tabla existe pero `clientesAfectados` no la
  mira: hoy una alerta llega a todo cliente del perfil, tenga o no esa clase de activo en cartera.
- **Panel del asesor para las alertas.** Se consultan por SQL / lectura directa; la UI es `S-01` y
  su ampliación, no esta feature.
- **Corridas del cron en producción.** La Edge Function se desplegó y el `pg_cron` se dio de alta
  el 2026-09-02 (`supabase functions deploy` + el SQL del README): la llamada de prueba del cron
  devolvió 200 con el resumen. El `.github/workflows/revision-diaria.yml` de GitHub Actions se
  retiró ese mismo día. Las corridas diarias son operación normal, no parte de esta feature.
- **Borrar los secrets `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` del repo de GitHub** — ya no
  los usa nada; paso manual del usuario en la configuración del repo.
