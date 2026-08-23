# Roadmap

<!-- Planificación de fases de desarrollo. No es un calendario con fechas exactas,
     sino una guía de prioridades.
     Actualizar cuando algo pase de una fase a otra, o cuando se redefinan las prioridades. -->

---

## Fase 1 — MVP

- [ ] Reescribir `instrucciones-sistema.md` e `instrucciones-motor.md` para el nuevo flujo:
      diagnóstico mostrado al visitante en el chat, persistencia en Supabase en vez de archivos
      markdown locales. Prerrequisito de todo lo demás (ver decisión técnica en `architecture.md`).
- [ ] Migración inicial de base de datos (`001_esquema_inicial.sql`, ver `docs/data-model.md`).
- [ ] Portar la lógica de cálculo de `instrucciones-motor.md` + `docs/criterio/reglas-recomendacion.md` a
      `lib/motor/` (TypeScript determinista, con el catálogo de 16 casos borde) — soporta `M-03`.
- [ ] Landing pública con presentación de la asesoría y el agente — `M-01`.
- [ ] Chat de entrevista guiada, Módulo 1 integrado con Claude — `M-02`.
- [ ] Diagnóstico y propuesta automáticos mostrados en el propio chat al cerrar la entrevista,
      con el disclaimer reforzado — `M-03`.
- [ ] Persistencia de cada conversación (ficha + informe) en Supabase — `M-04`.
- [ ] Aviso automático por email al asesor al completarse una conversación — `M-05`.

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
- [ ] Simulación de probabilidad de cumplimiento por Monte Carlo (`docs/criterio/reglas-recomendacion.md`,
      R10), hoy marcada explícitamente "no implementada" en `instrucciones-motor.md` §5.
- [ ] URLs personalizadas por destinatario, si el volumen de leads justifica dejar de usar un
      enlace genérico.

---

## Descartado (con motivo)

| Funcionalidad | Motivo del descarte |
|---------------|---------------------|
| Cobro o pago dentro del sitio | Es una herramienta de captación gratuita; el negocio de la asesoría cobra fuera de este sistema (ver `docs/prd.md`) |
| Cuentas de usuario / login para visitantes | El acceso se controla por difusión de la URL, no por autenticación (ver "Estrategia de autenticación" en `docs/architecture.md`) |
| Multi-asesor / multi-tenant | El producto es para una sola asesoría en esta versión |
