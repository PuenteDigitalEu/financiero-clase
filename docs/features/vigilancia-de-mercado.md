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
- **Lógica pura separada del efecto secundario:** `src/lib/alertas/` no toca red, BD ni IA;
  `scripts/revision.ts` es quien descarga, escribe y envía. Mismo patrón que `lib/motor/` vs.
  `app/api/chat/`.
- **Programación con GitHub Actions**, no Vercel Cron: no hay que exponer ni proteger ninguna ruta
  HTTP pública; el runner efímero recibe los secrets y desaparece (decisión delegada, "la más
  rápida y segura", 2026-08-31).
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
| M-09 | `scripts/revision.ts` — descarga, upsert idempotente en `observaciones_mercado`/`eventos_mercado`/`alertas`, resumen JSON | `scripts/verificar-revision.mjs` |

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
- **Corridas siguientes del cron en producción.** La primera ejecución real contra el Supabase de
  producción se hizo el 2026-08-31 (23 cierres del S&P 500 insertados, 0 eventos porque ninguna
  regla cruzó su umbral, correo apagado) — es lo que cerró esta feature como Verificada. El cron
  diario de `revision-diaria.yml` queda a partir de ahí como operación normal, no como parte de
  esta feature.
