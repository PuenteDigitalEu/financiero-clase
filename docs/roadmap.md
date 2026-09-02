# Roadmap

<!-- Planificación de fases de desarrollo. No es un calendario con fechas exactas,
     sino una guía de prioridades.
     Actualizar cuando algo pase de una fase a otra, o cuando se redefinan las prioridades. -->

---

## Fase 1 — MVP

- [x] Reescribir `instrucciones-sistema.md` e `instrucciones-motor.md` para el nuevo flujo:
      diagnóstico y plan mostrados al visitante en el chat, persistencia en Supabase en vez de
      archivos markdown locales, nueva Fase 4 de entrega del plan en lenguaje llano. Hecho
      2026-08-24 (ver decisión técnica en `architecture.md`). De paso se añadió el bloque 0 de
      `plantilla-entrevista.md` (nombre + email), que faltaba y sin el cual `clientes`/`M-05`
      nunca podían funcionar.
- [x] Migración inicial de base de datos escrita y verificada localmente
      (`supabase/migrations/001_esquema_inicial.sql`, ver `docs/data-model.md`). Falta aplicarla
      contra el Supabase real — requiere credenciales que no están disponibles en este entorno.
- [x] Portar la lógica de cálculo de `instrucciones-motor.md` + `docs/criterio/reglas-recomendacion.md` a
      `lib/motor/` (TypeScript determinista) — soporta `M-03` y `M-07`. Funciones puras (R1–R10:
      flujo libre, aportación propuesta, cartera ajustada por plazo, rentabilidad y volatilidad,
      proyección determinista, aportación requerida (inversa), conversión de meta de renta, Monte
      Carlo con semilla fija) en `src/lib/motor/{supuestos,numerico,aleatorio,calculos}.ts`; parseo
      del texto de la ficha a `Ficha` tolerante a anomalías (`parseo.ts`, C16); y el orquestador
      `calcularInforme()` (`informe.ts`) que aplica el catálogo de casos borde (C1–C17: TAE de
      deuda pendiente, transición de patrimonio, perfil de riesgo no calculable con su fallback
      conservador, deudas_numero=0, R4 con sus dos escenarios de inviabilidad, R6 con meta de renta
      de cartera vs. de negocio, R8/R9) y aplica la línea roja de que ninguna propuesta ejecutable
      sale fuera de modo `completo` con flujo libre positivo — 87 tests, todos verificados
      ejecutando de verdad (`pnpm test`).
- [x] Landing pública con presentación de la asesoría y el agente — `M-01`. Construida siguiendo
      `docs/design-system.md` (paleta, tipografía Sora/Inter, tono). CTA de entrada a `/chat`.
      Verificado que compila, pasa lint y el servidor de desarrollo sirve ambas rutas sin errores.
      **Revisión visual completada el 2026-08-30**: en local con la extensión de Chrome (hero con
      Sora en el `h1`, CTA naranja `#FF6B4A` que es un `<a href="/chat">` y navega de verdad a la
      pantalla de consentimiento, disclaimer en hero y footer, secciones "Cómo funciona" y "Tus
      datos, con cuidado", `[Nombre de la asesoría]` intacto como placeholder — correcto hasta que
      se confirme la marca, sin overflow horizontal, breakpoints `sm:` presentes) y por el usuario
      en producción (incluida la vista móvil real, sin incidencias).
- [x] Chat de entrevista guiada, Fases 1-2 (`instrucciones-sistema.md`) integradas con Claude —
      `M-02`. `app/api/chat/` (sin estado en servidor: el cliente manda el historial completo en
      cada turno) + UI (`ChatBubble`, `DisclosureBanner`, `ChatWindow`). 10 tests con el cliente de
      Claude mockeado, más **verificación en vivo real** el 2026-08-25 con `ANTHROPIC_API_KEY` de
      verdad: la apertura sale con el disclaimer completo, pasa al bloque 0 (nombre + email) y, al
      recibirlos, avanza correctamente al bloque 1 (ingresos) recordando el nombre dado — orden y
      memoria de la conversación confirmados con Claude de verdad, no solo con el mock. Sin
      revisión visual en navegador (Claude in Chrome requiere un plan que la cuenta de este
      usuario no tiene — no es un problema técnico, no se puede resolver aquí). Pendiente el
      consentimiento (`M-06`) antes de la pantalla de "Empezar" y el límite de uso — el código ya
      deja sitio para los dos, sin implementarlos.
- [x] Diagnóstico y propuesta automáticos mostrados en el propio chat al cerrar la entrevista,
      con el disclaimer reforzado — `M-03`. `app/api/chat/` detecta la ficha de cierre
      (`contieneFicha`), la parsea, calcula el informe con `calcularInforme()` y llama a Claude una
      segunda vez (`lib/claude/plan.ts`) solo para traducir esas cifras ya calculadas a la
      estructura fija de §8 — nunca para recalcular nada. **Verificado en vivo** el 2026-08-27 con
      `ANTHROPIC_API_KEY` real: las 8 secciones salen completas y con el gating correcto (R4 y R10
      solo aparecieron porque el caso de prueba los disparaba), y cada cifra citada en el plan
      coincide exactamente con la que calculó el motor — sin alucinaciones. De paso, dos fallos
      reales encontrados y corregidos en esta verificación: (1) el razonamiento extendido de
      Sonnet 5 consumía el presupuesto de `max_tokens` y podía dejar la respuesta vacía o cortada a
      mitad — se desactiva explícitamente (`thinking: { type: "disabled" }`) en las dos llamadas;
      (2) el modelo envolvía el plan en una valla ```markdown pese a que se le pedía no hacerlo — se
      corrigió el prompt y se añadió un desenvolvido defensivo. También se creó `vitest.config.mts`
      (faltaba la resolución del alias `@/*` para vitest, que hasta ahora solo hacía falta porque
      todo lo que lo usaba estaba mockeado) y se añadió `MarkdownLite` para que `ChatBubble`
      renderice el plan como el markdown que es, no como texto plano con los `#`/`**` literales
      (ver `docs/data-model.md` → `planes.markdown`). **Sin revisión visual en navegador** — mismo
      bloqueo que M-01/M-02. Persistencia en Supabase (`informes`/`planes`) queda para `M-04`, sin
      la cual esta ruta sigue sin estado en servidor a propósito (igual que `M-02`).
- [x] Persistencia de cada conversación (ficha + informe) en Supabase — `M-04`. Construida junto con
      `M-06` (ficha `docs/features/consentimiento-y-persistencia.md`, **Verificada**): comparten el
      `token` de sesión que crea el consentimiento. `lib/supabase/persistencia.ts` persiste cliente
      (enlazado por email si ya existía) + ficha + deudas + informe + plan al cerrar la entrevista, y
      marca la conversación `completada`. Sin transacción SQL (riesgo aceptado para el MVP, ver la
      ficha). **Verificado:** 115/115 tests con Supabase mockeado, `scripts/verificar-persistencia.mjs`
      (PGlite) con 5 casos negativos, **y en vivo contra el Supabase real** (2026-08-27): ciclo
      completo (crear conversación → validar token → incrementar turno → persistir cierre → leer
      cada fila de vuelta) verificado y limpiado sin dejar rastro. De camino apareció un problema
      real: el proyecto tenía un esquema completamente distinto (`entrevistas`/`analisis`/`mensajes`
      de una versión anterior), no el de esta migración — el usuario confirmó que estaba vacío, se
      limpió y se aplicó `001_esquema_inicial.sql` de verdad.
- [x] Aviso automático por email al asesor al completarse una conversación — `M-05`. Ficha
      `docs/features/aviso-al-asesor.md`, **Verificada**. Resend por API HTTP directa (decisión
      2026-08-27, ver `architecture.md` — más simple que una Edge Function de Supabase, nada que
      desplegar). Se dispara al mismo tiempo que `M-04` persiste el cierre; nunca bloquea la
      respuesta al visitante aunque el envío falle (`FLOW-02`) — se registra siempre en
      `notificaciones_asesor` (`enviado`/`fallido`). **Verificado:** 126/126 tests (mockeado) y en
      vivo (2026-08-27): email real enviado sin error, notificación registrada de verdad contra
      Supabase y limpiada sin dejar rastro.
- [x] Consentimiento de tratamiento de datos antes de crear la conversación — `M-06`. Ver `M-04`
      arriba (construidas y verificadas juntas). `POST /api/conversacion` crea la conversación con
      `consentimiento_en` al aceptar la nueva `ConsentScreen`, antes de la cual no existe ninguna
      fila ni dato personal. Sigue pendiente solo la revisión visual del clic en un navegador real
      (mismo bloqueo que M-01/M-02: la extensión de Chrome no tiene el plan necesario).
- [x] Límite de uso por IP — `M-08` (añadido a `docs/prd.md` con esta feature; antes era prosa sin
      ID). Ficha `docs/features/limite-de-uso.md`, **Verificada**. `POST /api/conversacion` y
      `POST /api/chat` comprueban `comprobarLimiteUso()` antes de actuar (10 conversaciones/24h,
      150 mensajes/24h — constantes en `lib/ip.ts`); IP con HMAC-SHA256 + pepper de despliegue
      (`IP_HASH_PEPPER`, no un hash desnudo — el espacio IPv4 es pequeño y se revierte por fuerza
      bruta). 144 tests (mockeado) y **en vivo** (2026-08-27) contra Supabase real y una llamada
      HTTP real a `/api/conversacion` — todo limpiado después.

**Objetivo de validación:** confirmar que un visitante real completa la entrevista sin abandonarla
a mitad camino, que el diagnóstico automático que recibe es coherente y útil incluso sin filtro
previo del asesor, y que a ti (el asesor) el par ficha+diagnóstico te ahorra de verdad la primera
conversación manual.

**Qué queda para cerrar la validación** (a 2026-09-01):

- [ ] **Recorrido completo del asesor en producción**, de principio a fin: aceptar el
      consentimiento → responder la entrevista entera → ver el diagnóstico y el plan en el chat →
      recibir el email de aviso → comprobar que la conversación queda `completada` en Supabase con
      su ficha, informe y plan.
- [ ] **Enviar el enlace genérico a las primeras 5-10 personas** y dejar pasar 1-2 semanas antes de
      revisar nada — con menos datos los porcentajes no dicen nada.
- [ ] **Revisar con los datos reales:** tasa de abandono y en qué punto se caen, coherencia y
      utilidad de los diagnósticos automáticos, y si el par ficha+diagnóstico ahorra la primera
      llamada. Para lo del abandono hay 3 consultas SQL preparadas (embudo desde el consentimiento,
      distribución por `turnos_totales`, comparativa completadas vs abandonadas) — entregadas el
      2026-09-01. No hay tabla de mensajes, así que el "bloque" de abandono se aproxima por número
      de turnos y "abandonada" se toma como "no completada y fría >2 h".

Hecho ya de la preparación: variables de entorno de producción verificadas (2026-08-31), revisión
visual de M-01 (2026-08-30), y el fix del cierre cuando la edad venía con decimales (2026-09-01,
changelog).

---

## Puesta en producción y estabilización (post-Fase 1)

Con la Fase 1 cerrada, el proyecto pasó a producción. El trabajo desde entonces ha sido prepararlo
para desplegar y corregir lo que solo apareció al probar la app real a través del navegador —
ningún alcance nuevo, todo `M-02`.

- [x] README reescrito al estado real (Fase 1 ya construida, no "implementación sin empezar") con
      sección nueva de **Despliegue**: variables de entorno explicadas una a una, estructura real
      de `src/`, pasos exactos de Vercel. El agente lo deja listo y explicado; el botón lo pulsa el
      usuario. Changelog 2026-08-28.
- [x] App desplegada en Vercel, en producción (2026-08-28).
- [x] **Bug crítico en producción (`M-02`):** el chat perdía el historial a partir del tercer
      turno — `ChatWindow` sustituía el historial visible en vez de acumularlo, así que el tercer
      turno mandaba a `/api/chat` una conversación sin el nombre/email del bloque 0 y Claude los
      volvía a pedir. Lo detectó el usuario probando la app desplegada con sus propios dedos: la
      verificación por `curl` contra las APIs, aunque real, nunca ejerció la acumulación en el
      navegador. Arreglo: lógica de acumulación extraída a `lib` puro (`src/components/chat/historial.ts`)
      con test de regresión de 4 turnos. Changelog 2026-08-28.
- [x] **Auto-scroll del chat (`M-02`)**, en tres iteraciones: (1) `scrollIntoView` sobre un
      centinela dentro del área de mensajes — subía la última pregunta a la vista pero dejaba el
      cuadro de texto cortado; (2) fijar la altura de la página con `h-dvh` + `overflow-hidden` —
      no lo resolvió, revertido (`2516b37` / `4e60586`); (3) `window.scrollTo` a
      `document.body.scrollHeight` — desplaza la página entera hasta su final real, que incluye el
      cuadro de texto por definición y no depende de ninguna cadena de CSS entre archivos.
      **Confirmado en producción por el usuario** (2026-08-30). Changelog 2026-08-30.

Estado tras esto: 148/148 tests, `build` y `tsc` limpios, árbol de git limpio. La revisión visual
de M-01 se completó el 2026-08-30 (extensión de Chrome en local + usuario en producción); M-02/M-03/
M-06 ya se ejercieron de hecho en la prueba en producción del usuario, con los bugs que salieron ya
corregidos arriba.

---

## Vigilancia de mercado (M-09)

Capa nueva montada **encima** del MVP, sin tocar el flujo del chat. Vigila movimientos de mercado y,
cuando uno cruza el umbral de un perfil, registra un evento y una alerta por cliente afectado. Ficha:
`docs/features/vigilancia-de-mercado.md` (**Verificada**).

- [x] Migración `0002_alertas_de_mercado.sql` — 4 enums, 3 columnas nuevas, 5 tablas con los 3
      `unique` de idempotencia, RLS (SELECT `es_asesor()`), 3 reglas sembradas. Escrita y **aplicada
      contra el Supabase real** (2026-08-31, `apply_migration`). Changelog 2026-08-31.
- [x] `src/lib/alertas/` — `detectarEventos` y `clientesAfectados` (puras) + `mensajeInterno`
      (descriptivo, nunca recomienda) + `DESCARGO_LEGAL`. 13 tests vitest.
- [x] `src/lib/alertas/revision-core.ts` — el cuerpo de la revisión, agnóstico del entorno:
      descarga los cierres del S&P 500 (Yahoo Finance, sin clave), guarda en `observaciones_mercado`
      (`on conflict do nothing`), decide con la lógica importada, registra evento + alertas por los
      `unique`, devuelve el resumen JSON. Envoltorios finos: `scripts/revision.ts` (Node) y la Edge
      Function (Deno). Sin duplicar lógica.
- [x] **Ejecución de extremo a extremo** contra el Supabase real (2026-08-31, y de nuevo tras el
      refactor el 2026-09-01): cierres del S&P 500 insertados, 0 eventos en día tranquilo, y en una
      prueba con caída sintética −7,49% → 3 eventos + 2 alertas por perfil, idempotente en la 2ª
      pasada. Verificación estructural aparte con `scripts/verificar-revision.mjs` (PGlite).
- [x] Programación: **Supabase Edge Function + `pg_cron`** (`supabase/functions/revision-mercado/`),
      cron diario L-V (`15 22 * * 1-5` UTC). `pg_cron` llama a la URL de la función con `pg_net`,
      autorizada por un secreto propio (`REVISION_SECRET`) en la cabecera `Authorization`, no por el
      login de un usuario. Reemplaza la decisión anterior de GitHub Actions. Changelog 2026-09-01.
- [x] **Desplegada y con el `pg_cron` de alta** (2026-09-02): `supabase functions deploy
      revision-mercado --no-verify-jwt` + el SQL del README (extensiones, secreto en Vault,
      `cron.schedule`). Verificado: `curl` con el secreto → 200 con el resumen; la llamada de prueba
      del cron (`net.http_post`) → 200. Job `revision-mercado-diaria` activo. Changelog 2026-09-02.
- [x] Retirado `.github/workflows/revision-diaria.yml` (2026-09-02).
- [ ] **Borrar los secrets `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` del repo de GitHub** — ya no
      los usa nada; paso manual del usuario.
- [ ] **Correo al cliente:** apagado a propósito (`REVISION_ENVIAR_CORREO_CLIENTE=false`). Para
      activarlo hace falta un dominio verificado en Resend. Pendiente de decidir cuándo.

---

## Fase 2 — Mejora sobre validación

- [ ] Panel de consulta para el asesor (`S-01`), si revisar los emails uno a uno se queda corto en
      volumen.
- [ ] Ajustes al guion o al tono del chat según dónde abandonen realmente los visitantes en la
      Fase 1 (qué bloque de la entrevista genera más abandono).
- [ ] Revisión del disclaimer regulatorio y del propio flujo con criterio legal/de cumplimiento,
      una vez hay datos reales de cómo lo leen y reaccionan los visitantes — la Fase 1 ya lo
      incluye por defecto, pero puede necesitar ajuste con uso real.

---

## Fase 3 — Escalado

- [ ] Historial accesible para el propio visitante (`C-01`).
- [ ] URLs personalizadas por destinatario, si el volumen de leads justifica dejar de usar un
      enlace genérico.

---

## Descartado (con motivo)

| Funcionalidad | Motivo del descarte |
|---------------|---------------------|
| Cobro o pago dentro del sitio | Es una herramienta de captación gratuita; el negocio de la asesoría cobra fuera de este sistema (ver `docs/prd.md`) |
| Cuentas de usuario / login para visitantes | El acceso se controla por difusión de la URL, no por autenticación (ver "Estrategia de autenticación" en `docs/architecture.md`) |
| Multi-asesor / multi-tenant | El producto es para una sola asesoría en esta versión |
