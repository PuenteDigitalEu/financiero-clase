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
- [~] Landing pública con presentación de la asesoría y el agente — `M-01`. Construida siguiendo
      `docs/design-system.md` (paleta, tipografía Sora/Inter, tono). CTA de entrada a `/chat`
      (placeholder hasta `M-02`). Verificado que compila, pasa lint y el servidor de desarrollo
      sirve ambas rutas sin errores; **sin revisión visual en navegador real** — la extensión de
      Chrome no estaba conectada en este entorno sin supervisión. Revisar visualmente antes de
      dar `M-01` por cerrada del todo.
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
- [ ] Aviso automático por email al asesor al completarse una conversación — `M-05`.
- [x] Consentimiento de tratamiento de datos antes de crear la conversación — `M-06`. Ver `M-04`
      arriba (construidas y verificadas juntas). `POST /api/conversacion` crea la conversación con
      `consentimiento_en` al aceptar la nueva `ConsentScreen`, antes de la cual no existe ninguna
      fila ni dato personal. Sigue pendiente solo la revisión visual del clic en un navegador real
      (mismo bloqueo que M-01/M-02: la extensión de Chrome no tiene el plan necesario).
- [ ] Límite de uso por IP (hash) en `app/api/chat/` (ver `architecture.md` → "Protección contra
      abuso"). Bloqueante: la URL es pública y cada mensaje cuesta dinero real.

**Objetivo de validación:** confirmar que un visitante real completa la entrevista sin abandonarla
a mitad camino, que el diagnóstico automático que recibe es coherente y útil incluso sin filtro
previo del asesor, y que a ti (el asesor) el par ficha+diagnóstico te ahorra de verdad la primera
conversación manual.

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
