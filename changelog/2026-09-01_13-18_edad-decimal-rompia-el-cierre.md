# Fix: una edad con decimales rompía el guardado de la ficha al cerrar el chat

**Fecha:** 2026-09-01 13:18
**Tipo:** Fix
**Requisitos:** M-04 (regresión encontrada probando en producción)

## Qué se hizo

Detectado por el usuario probando el chat en producción: al confirmar el resumen y cerrar la
entrevista, saltaba "No se pudo procesar el mensaje". En los registros de Vercel:

```
Error procesando el turno en /api/chat: Error: No se pudo guardar la ficha:
invalid input syntax for type integer: "59.5"
```

**Causa:** la respuesta a la edad fue "59 años y medio". El agente lo tradujo a `edad: 59.5` en la
ficha de cierre. `parseo.ts` lo leía como número tal cual (`datoNumero`), y al persistir,
`fichas.edad` es una columna `integer` — Postgres rechaza `59.5`. El error abortaba todo el cierre
(informe, plan, persistencia y aviso).

**Arreglo:** helper nuevo `datoEntero` en `src/lib/motor/parseo.ts` para los dos campos que el
modelo de datos guarda como `integer` (`edad`, `personas_a_cargo`). Si el valor trae decimales, se
redondea al entero más cercano (`Math.round`) y se anota como anomalía — que el asesor ve en la
sección "Calidad del dato" del informe. Un valor ya entero pasa sin tocar y sin anomalía. El resto
del parseo no cambia; sigue sin lanzar excepciones por un dato raro (C16).

## Qué se modificó

- `src/lib/motor/parseo.ts` — nuevo `datoEntero`; `edad` y `personas_a_cargo` pasan a usarlo en vez
  de `datoNumero`.
- `src/lib/motor/parseo.test.ts` — dos tests: `edad: 59.5` → `60` + anomalía con "decimales"; y
  `edad`/`personas_a_cargo` enteras se dejan tal cual sin anomalía.
- `docs/data-model.md` — nota en `fichas.edad` de que el parser garantiza el entero.

## Por qué

Rompía el cierre de la entrevista para cualquier visitante que diera la edad con un "y medio" o
similar. El visitante completaba toda la entrevista y, en el último paso, no recibía ni diagnóstico
ni plan — y no quedaba nada persistido. Se descubrió en la primera prueba real del cierre en
producción tras cambiar la clave de Anthropic (la clave no tenía nada que ver: el fallo estaba en
la persistencia, latente desde M-04).

## Verificación

- `pnpm exec tsc --noEmit` → sin errores.
- `pnpm test` → 163/163 (161 previas + 2 nuevas).
- Pendiente: repetir el cierre en producción con la misma ficha ("59 años y medio") tras
  desplegar, para confirmar que ahora llega el diagnóstico.
