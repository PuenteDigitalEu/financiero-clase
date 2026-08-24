# Monte Carlo (R10) pasa de Fase 3 / WON'T a Fase 1 (M-07)

**Fecha:** 2026-08-24 08:08
**Tipo:** Documentación
**Requisitos:** M-07 (nuevo)

## Qué se hizo

Al comparar `motor-python/motor-calculos.py` y `src/lib/motor/calculos.ts` de
`polmarza/Clase-Agente-Financiero`, se confirmó que la simulación Monte Carlo de R10 (percentiles
p10/p50/p90, probabilidad de cumplimiento con banda) ya tiene una implementación de referencia
completa y con tests. Nuestro `instrucciones-motor.md` la marcaba como "fuera de alcance por
ahora... no está implementado", y sobre esa base `docs/roadmap.md` la había dejado en Fase 3 y
`docs/prd.md` en WON'T. Esa suposición ya no era cierta. Por decisión del usuario, se mueve a
alcance del MVP.

## Qué se modificó

- `docs/prd.md` — nuevo requisito MUST **`M-07`** (probabilidad de cumplimiento); quitada la
  entrada de Monte Carlo de `WON'T`.
- `docs/roadmap.md` — quitada de Fase 3; la tarea de portar el motor en Fase 1 ahora incluye
  explícitamente Monte Carlo, con nota de que existe una implementación de referencia (Python +
  port a TypeScript) que reduce el coste de construcción.
- `instrucciones-motor.md` — §5 ya no dice "no implementado": describe el cálculo real (≥10.000
  trayectorias, percentiles, banda), aplicable solo con meta convertible a patrimonio y modo
  `completo`. Estructura del informe (§7) renumerada para incluir el punto de probabilidad en la
  Parte A.
- `docs/data-model.md` — columnas nuevas en `informes` (`mc_percentil_pesimista/central/optimista`,
  `mc_probabilidad_cumplimiento`, `mc_banda`).
- `docs/testing.md` — cobertura esperada para Monte Carlo (reproducibilidad con semilla fija,
  umbrales de banda, que no se calcula fuera de sus condiciones).
- `docs/design-system.md` — `DiagnosisCard` incluye la probabilidad como banda + percentiles
  cuando aplica, nunca como cifra única.
- `docs/architecture.md` — nota de Monte Carlo en la estructura de carpetas de `lib/motor/`.

## Por qué

El alcance de Fase 1 se había fijado asumiendo que Monte Carlo requería construir un motor de
simulación desde cero. Al comparar con el repo de referencia de la clase se descubrió que esa
implementación ya existe y está probada, lo que cambia el cálculo de coste/beneficio de incluirlo
ahora. Decisión del usuario, no automática.
