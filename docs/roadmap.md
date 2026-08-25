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
- [~] Portar la lógica de cálculo de `instrucciones-motor.md` + `docs/criterio/reglas-recomendacion.md` a
      `lib/motor/` (TypeScript determinista) — soporta `M-03` y `M-07`. **Hecho:** las funciones
      puras (R1–R10: flujo libre, aportación propuesta, cartera ajustada por plazo, rentabilidad y
      volatilidad, proyección determinista, conversión de meta de renta, Monte Carlo con semilla
      fija) en `src/lib/motor/{supuestos,numerico,aleatorio,calculos}.ts`, más los tipos de la
      ficha y `determinarModo`/`clasificarMeta` en `ficha.ts` — 41 tests, todos verificados
      ejecutando de verdad (`pnpm test`), no solo leídos. **Falta:** la orquestación completa que
      recibe una `Ficha` y aplica el catálogo de 17 casos borde entero (C1–C17) para producir el
      informe final — se deja para cuando se construya junto con `app/api/chat/`, porque depende
      de cómo se parsea la ficha ahí; hacerla antes, a ciegas, se tendría que rehacer.
- [~] Landing pública con presentación de la asesoría y el agente — `M-01`. Construida siguiendo
      `docs/design-system.md` (paleta, tipografía Sora/Inter, tono). CTA de entrada a `/chat`
      (placeholder hasta `M-02`). Verificado que compila, pasa lint y el servidor de desarrollo
      sirve ambas rutas sin errores; **sin revisión visual en navegador real** — la extensión de
      Chrome no estaba conectada en este entorno sin supervisión. Revisar visualmente antes de
      dar `M-01` por cerrada del todo.
- [~] Chat de entrevista guiada, Fases 1-2 (`instrucciones-sistema.md`) integradas con Claude —
      `M-02`. `app/api/chat/` (sin estado en servidor: el cliente manda el historial completo en
      cada turno) + UI (`ChatBubble`, `DisclosureBanner`, `ChatWindow`). 10 tests con el cliente de
      Claude mockeado (validación, tope de turnos, formato de respuesta, manejo de error 502) —
      todos pasan de verdad. **Sin verificar en vivo:** necesita `ANTHROPIC_API_KEY` real, que
      sigue vacía en `.env.local`; tampoco se ha podido ver en un navegador real (extensión de
      Chrome sin conectar). Pendiente además el consentimiento (`M-06`) antes de la pantalla de
      "Empezar" y el límite de uso — el código ya deja sitio para los dos, sin implementarlos.
- [ ] Diagnóstico y propuesta automáticos mostrados en el propio chat al cerrar la entrevista,
      con el disclaimer reforzado — `M-03`.
- [ ] Persistencia de cada conversación (ficha + informe) en Supabase — `M-04`.
- [ ] Aviso automático por email al asesor al completarse una conversación — `M-05`.
- [ ] Consentimiento de tratamiento de datos antes de crear la conversación — `M-06`. Bloqueante:
      no se expone la landing sin esto.
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
