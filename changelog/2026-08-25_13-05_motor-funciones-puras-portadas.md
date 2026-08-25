# Funciones puras del motor portadas a TypeScript, con tests reales

**Fecha:** 2026-08-25 13:05
**Tipo:** Feature
**Requisitos:** M-03, M-07 (parcial — ver "Qué queda pendiente")

## Qué se hizo

Tercera tarea de la Fase 1 del roadmap: portar el cálculo de `docs/criterio/reglas-recomendacion.md`
a código. Se crea `src/lib/motor/` con las funciones puras (R1–R10), adaptadas a nuestros propios
nombres de campo — no una copia de los de `polmarza/Clase-Agente-Financiero`, que usa un esquema de
ficha distinto:

- `supuestos.ts` — transcripción literal de las reglas (carteras base, retornos, volatilidades,
  correlaciones, bandas de probabilidad, tasas de retirada).
- `numerico.ts` — redondeo bancario, percentil por interpolación lineal, formato de euros.
- `aleatorio.ts` — PRNG con semilla (mulberry32 + Box–Muller) para el Monte Carlo.
- `ficha.ts` — tipos de la ficha (coinciden con el contrato de `instrucciones-sistema.md` y con
  `docs/data-model.md`), `determinarModo` (§4) y `clasificarMeta` (§3).
- `calculos.ts` — `flujoLibre`, `aportacionPropuesta`, `ajustarCarteraPorPlazo`,
  `rentabilidadCartera`, `volatilidadCartera`, `vfDeterminista`, `aEurosActuales`,
  `aniosHastaMeta`, `convertirMetaRenta`, `monteCarlo`.

**Verificación real, no solo lectura:** 41 tests (`calculos.test.ts` + `ficha.test.ts`) ejecutados
con `pnpm test` — reproducibilidad del Monte Carlo con semilla fija, bandas de probabilidad,
frontera de plazo (C2), redondeo bancario en los empates, `aportacionPropuesta` con `requerida
null`. Un test propio falló al principio por comparar contra la etiqueta redondeada "≈4,3 %" de
R5 en vez del valor exacto de la fórmula (4,25 %) — corregido; no era un bug del código, era una
aserción mal escrita. `pnpm lint`, `tsc --noEmit --strict` y `pnpm build` limpios.

## Qué queda pendiente (a propósito)

No se implementó la orquestación completa que recibe una `Ficha` entera y aplica el catálogo de 17
casos borde (C1–C17) para producir el informe final. Construir eso ahora, aislado, obligaría a
adivinar cómo `app/api/chat/` va a parsear la ficha real del chat — se haría a ciegas y habría que
rehacerlo al integrar. Queda como la pieza que se completa junto con `M-02`/`M-03`.

## Qué se modificó

- Nuevo: `src/lib/motor/{supuestos,numerico,aleatorio,ficha,calculos}.ts` y sus tests
  (`calculos.test.ts`, `ficha.test.ts`).
- `docs/roadmap.md` — tarea de Fase 1 marcada como parcial (`[~]`), con el detalle de qué está
  hecho y qué falta.

## Por qué

Continuación de la Fase 1 del roadmap, autorizado por el usuario a avanzar sin confirmación en
cada paso.
