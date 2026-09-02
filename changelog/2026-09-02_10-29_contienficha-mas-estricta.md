# Fix: `contieneFicha` disparaba el cierre con una ficha incompleta

**Fecha:** 2026-09-02 10:29
**Tipo:** Fix
**Requisitos:** M-03 (regresión detectada haciendo el recorrido de validación en producción)

## Qué se hizo

Haciendo el recorrido completo de la entrevista en producción para validar el flujo, la entrevista
se cortó a mitad (turno 9, tras responder el objetivo). Revisando el código en vez de los logs
(Vercel gratuito no guarda logs de más de 1 h):

`app/api/chat/route.ts` llama a `contieneFicha(texto)` en cada turno para decidir si el mensaje del
agente es la ficha de cierre y hay que lanzar el pipeline (calcular informe + plan + persistir). La
versión anterior era demasiado laxa:

```ts
return /\bfecha_entrevista\s*:/i.test(texto) && /\bingresos_netos_mensual\s*:/i.test(texto);
```

Bastaba con que el mensaje del agente contuviera esas dos claves **en cualquier parte** —por
ejemplo, un resumen intermedio del tipo "voy anotando: fecha_entrevista: …, ingresos_netos_mensual:
…"— para disparar el cierre con una ficha incompleta. `calcularInforme` / `generarPlan` sobre esa
ficha a medias falla, y el turno acaba en `502` ("No se pudo procesar el mensaje").

**Arreglo:** `contieneFicha` ahora exige que aparezcan como línea `clave:` las **cinco claves
ancla** (`fecha_entrevista`, `ingresos_netos_mensual`, `objetivo_proposito`,
`riesgo_perfil_derivado`, `situacion_laboral` — recorren la ficha de arriba abajo; las tres últimas
son de los bloques finales de la entrevista, así que un resumen intermedio no las tiene) **y**, de
las 22 claves fijas del contrato de `instrucciones-sistema.md`, al menos 15 (una ficha real las
trae todas).

## Qué se modificó

- `src/lib/motor/parseo.ts` — `contieneFicha` reescrita; constantes `CLAVES_FICHA`, `CLAVES_ANCLA`,
  `CLAVES_FICHA_MINIMO`.
- `src/lib/motor/parseo.test.ts` — 2 tests nuevos: no dispara con un resumen de dos claves sueltas
  (regresión), ni con una recapitulación de los primeros bloques sin los finales.

## Verificación

- `pnpm exec tsc --noEmit` → sin errores.
- `pnpm exec eslint` → sin avisos en los archivos tocados.
- `pnpm test` → 165/165 (163 previas + 2 nuevas).

## Notas del recorrido de validación (no cerrado)

- **URL de producción real: `financiero-clase.vercel.app`.** La `financiera-clase.vercel.app` que
  figura en "Dominios" de Vercel devuelve 404 — hay que reapuntarla o quitarla.
- Landing → consentimiento → chat → Claude responde: OK. Recorridos 7 bloques de entrevista sin
  problema (la clave nueva de Anthropic funciona).
- **El cierre sigue sin re-verificarse de extremo a extremo.** Solo una conversación ha llegado a
  `completada` en todo el proyecto (2026-08-31). La del 2026-09-01 falló por el bug de la edad
  decimal (ya corregido, changelog 2026-09-01) y la de hoy por este `contieneFicha`. Falta una
  entrevista entera hasta el diagnóstico + comprobación en Supabase.
- Vi la pantalla de consentimiento reaparecer a mitad de entrevista. Según el código, `ChatWindow`
  ante un error de `/api/chat` solo muestra una línea de error, no reinicia — solo vuelve a
  consentimiento si `token` es `null`, y eso solo pasa al recargar la página. Probablemente fue una
  recarga de la pestaña durante la automatización del navegador, no un bug; no se pudo confirmar.
- Quedan 2 filas de prueba `en_curso` en `conversaciones` (`b1bb19f3`, `b0ec8e4e`) de los intentos
  de hoy — inofensivas.
