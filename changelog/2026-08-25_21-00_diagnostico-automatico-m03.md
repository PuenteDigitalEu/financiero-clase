# Diagnóstico y plan automáticos en el chat — M-03

**Fecha:** 2026-08-25 21:00
**Tipo:** Feature
**Requisitos:** M-03

## Qué se hizo

Enganchado el motor determinista al chat: al terminar la entrevista, el visitante ya recibe el
diagnóstico y la propuesta preliminar en el propio chat, sin salto de sesión.

1. **`lib/motor/parseo.ts`** — convierte el texto de la ficha de cierre (contrato de
   `instrucciones-sistema.md`) al tipo `Ficha`. Nunca lanza una excepción por un dato raro (C16):
   cualquier clave ausente, mal formada o con un valor no reconocido queda `pendiente` y se reporta
   como anomalía, en vez de romper el turno o inventar un valor.
2. **`lib/motor/informe.ts`** (`calcularInforme`) — el orquestador que faltaba: aplica el catálogo
   de casos borde C1-C17 y las reglas R1-R10 sobre una `Ficha` ya parseada, con la línea roja de
   `instrucciones-motor.md` §4/§8 como puerta explícita — ninguna propuesta ejecutable
   (aportación, cartera, proyección, gap, Monte Carlo) sale si el modo no es `completo` o si el
   flujo libre no es positivo (R8), aunque el resto de los datos esté completo.
3. **`lib/claude/plan.ts`** (`generarPlan`) — segunda llamada a Claude, con `instrucciones-motor.md`
   §8 como system prompt. Recibe el informe YA calculado y solo traduce a la estructura fija de 8
   secciones en lenguaje llano — nunca recalcula ni aproxima una cifra.
4. **`app/api/chat/route.ts`** — cuando el mensaje del agente trae la ficha de cierre
   (`contieneFicha`), la ruta ya no le enseña ese volcado en crudo al visitante: parsea, calcula el
   informe y sustituye la respuesta por el plan redactado.
5. **`ChatBubble`/`MarkdownLite`** — el plan llega en markdown (`docs/data-model.md` documenta que
   así se guarda y así se muestra); el componente de chat solo pintaba texto plano, así que se
   añadió un traductor mínimo de markdown a JSX (encabezados, negrita, listas) para no enseñar los
   `#`/`**` literales.

**Verificado en vivo** con `ANTHROPIC_API_KEY` real (no solo con el mock de los tests): un caso con
meta inviable (R4) y meta convertible a patrimonio (R10) produjo las 8 secciones correctas, con el
gating de modo/R4/R10 aplicado bien y cada cifra citada coincidiendo exactamente con la que calculó
el motor — sin alucinaciones. De camino aparecieron dos fallos reales, corregidos en la misma
sesión (detalle en `docs/architecture.md` → "Trampas conocidas del stack"):

- El razonamiento extendido de Sonnet 5 consumía el presupuesto de `max_tokens` y podía dejar la
  respuesta vacía o cortada a mitad de frase — se desactiva explícitamente en las dos llamadas.
- El modelo envolvía el plan en una valla ` ```markdown ` pese a que se le pedía no hacerlo — se
  corrigió el prompt y se añadió un desenvolvido defensivo.

También se corrigió un bug de diseño en `clasificarMeta` (exigía `objetivoImporte` nulo para
clasificar `renta_cartera`, lo que habría hecho imposible convertir esa misma cifra después con
R6) y se añadió `vitest.config.mts`, que faltaba: vitest no lee el alias `@/*` de `tsconfig.json`
por su cuenta, y hasta ahora el hueco estaba oculto porque todo import `@/...` en los tests
pasaba por `vi.mock`.

## Qué queda sin verificar

Revisión visual en navegador — mismo bloqueo que M-01/M-02 (la extensión de Chrome requiere un
plan de pago que la cuenta no tiene). `MarkdownLite` no tiene test propio (componente puramente
visual, cubierto por E2E según `docs/testing.md`, no construidos aún).

## Qué se modificó

- Nuevos: `src/lib/motor/{parseo,informe}.ts` + sus tests, `src/lib/claude/plan.ts` + su test,
  `src/components/chat/markdown-lite.tsx`, `vitest.config.mts`.
- Modificados: `src/app/api/chat/route.ts` (+ tests), `src/components/chat/chat-bubble.tsx`,
  `src/lib/motor/ficha.ts` (fix de `clasificarMeta`), `docs/roadmap.md`, `docs/architecture.md`.

## Por qué

Es el criterio de aceptación central de `M-03`: el visitante tiene que ver su diagnóstico en el
chat sin depender de que el asesor revise cada caso a mano primero — decisión de negocio ya
tomada, documentada en `docs/prd.md`.
