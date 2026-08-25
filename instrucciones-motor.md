# Instrucciones del motor — Fases 3-4: análisis y entrega del plan

> Entrada: la ficha que cerró la Fase 2 (`instrucciones-sistema.md`), ya persistida en `fichas` +
> `deudas`.
> Salida: un informe técnico interno (Parte A/B/C, §7 — auditable, nunca se entrega tal cual al
> visitante) **y** un plan en lenguaje llano (§8) que sí se muestra en el chat, en la misma
> conversación, y se persiste en `planes`.
> Fuente de criterio: **`docs/criterio/reglas-recomendacion.md`**. Este archivo NO contiene criterio
> financiero: solo define CÓMO aplicarlo. Si un valor o umbral aparece aquí, es un error — debe
> vivir en las reglas.
> Principio rector: el motor aplica las reglas literalmente. **Caso sin regla escrita → no se
> improvisa: se marca "pendiente para la reunión" y se lista en la sección de pendientes.**

## 0 · Activación

Esta fase se ejecuta automáticamente, sin que nadie la pida, en cuanto la Fase 2 confirma la ficha
— es la continuación de la misma conversación con el visitante, no un módulo aparte que espera a
que el asesor lo active. §1-§7 (parseo, clasificación, cálculo, informe interno) son código
determinista (`lib/motor/`): no habla nadie con nadie, es una función pura que recibe la ficha y
devuelve números. §8 (redacción del plan) es el único punto de esta fase donde Claude interviene de
nuevo, y solo para traducir a lenguaje llano los números que `lib/motor/` ya calculó — nunca para
calcular ninguno él mismo (ver decisión técnica en `docs/architecture.md`).

## 1 · Pipeline

1. **Leer** la ficha completa y `docs/criterio/reglas-recomendacion.md`. Si falta cualquiera de los
   dos, decirlo y detenerse.
2. **Parsear** las claves fijas (§2).
3. **Clasificar la meta** (§3).
4. **Evaluar calidad del dato**: determinar el modo del informe (§4).
5. **Calcular con código** (§5). Ningún número del informe puede salir "de cabeza".
6. **Redactar** el informe interno (§7).
7. **Redactar el plan** para el visitante (§8) y mostrarlo en el chat, en el mismo hilo de la
   entrevista.
8. **Persistir**: fila en `informes` (con `version_motor`/`version_reglas`) y fila en `planes` (con
   el descargo exacto mostrado). Si por lo que sea se reprocesa la misma ficha, se versiona con una
   fila nueva en vez de sobrescribir.

## 2 · Parseo de la ficha

- Claves esperadas: las del contrato de la Fase 2 (ver `instrucciones-sistema.md`) —
  `ingresos_netos_mensual`, `ingresos_estabilidad`, `gastos_fijos_mensual`, `deudas_numero` +
  `deuda_N_tipo/importe/cuota`, `deudas_interes_alto_declarado`, `patrimonio_liquido`,
  `patrimonio_invertido`, `patrimonio_distribucion`, `aportacion_mensual_actual`, `colchon_meses`,
  `objetivo_proposito/importe/plazo_anios`, `riesgo_tolerancia_declarada`,
  `riesgo_comportamiento_real`, `edad`, `personas_a_cargo`, `situacion_laboral`.
- Cada valor lleva etiqueta `[confirmado|estimado|pendiente]`. Valor sin etiqueta → tratar como
  `estimado` y señalarlo como anomalía en la sección de calidad del dato.
- Rangos dentro de un valor (p. ej. «300-400 €») → usar el extremo prudente según la dirección de
  sesgo de R9 (sesgo en datos estimados) y declararlo.
- `patrimonio_distribucion` alimenta la transición del patrimonio (R7) cuando está disponible
  (`confirmado` o `estimado`). Si viene `pendiente` o el cliente respondió "no lo sé", la transición
  sigue el tratamiento de C15: no se inventa la composición.
- `deudas_interes_alto_declarado` es una señal de respaldo, no un sustituto de las filas de deuda:
  solo se usa para la priorización de R1 cuando `deudas_numero` queda `pendiente` (ver C17). Si las
  deudas sí están detalladas, este campo se ignora aunque tenga valor.
- `nombre`/`email` no entran en el cálculo financiero — son el enlace con `clientes`, ya resuelto
  por la Fase 2. No se vuelven a tratar aquí.

## 3 · Clasificación de la meta

| Tipo | Detección | Tratamiento |
|---|---|---|
| **Patrimonio** | `objetivo_importe` es una cifra en € totales (no €/mes) | Fórmulas directas: % camino recorrido, proyección, gap. |
| **Renta de cartera** | `objetivo_proposito` describe una renta mensual/anual a vivir, sin negocio propio de por medio (p. ej. «vivir de las rentas», jubilación anticipada) | Convertir con R6 (tasa de retirada según horizonte de la retirada). Documentar la conversión en el informe. |
| **Renta de negocio propio** | `objetivo_proposito` o `situacion_laboral` indican que la renta procede de una actividad/negocio propio del cliente | **No convertir** (R6). La meta no se persigue vía cartera; el informe lo dice explícitamente. La cartera se analiza por su papel real (colchón, diversificación), no como vehículo de la meta. |
| **Mixta / ambigua** | Parte cartera, parte negocio; o `objetivo_importe`/`objetivo_plazo_anios` = «no facilitado» | Separar la parte convertible si es posible; el resto, pendiente. Sin cifra o sin plazo → sin proyección: solo situación actual + escenarios condicionados. |

## 4 · Modos del informe según calidad del dato

- **Completo:** las 6 variables críticas de R9 (ingresos y gastos esenciales, deudas, liquidez y
  colchón, patrimonio invertido, objetivo y plazo, capacidad y tolerancia al riesgo) presentes,
  aunque alguna sea `estimado` → diagnóstico + propuesta preliminar ejecutable + probabilidad R10.
- **Condicionado:** falta alguna crítica → diagnóstico con lo disponible + solo escenarios
  condicionados («si X fuera..., entonces...»). Sin propuesta ejecutable, sin probabilidad R10.
- **Suspendido:** deudas marcadas «no facilitado» por negativa explícita del cliente → diagnóstico
  descriptivo y recomendación expresamente suspendida, explicando por qué.

En todos los modos: los supuestos aplicados a datos `estimado` se listan con su dirección de sesgo.
El modo condiciona también el plan de §8 — ver ahí la línea roja de qué no se muestra nunca en
`condicionado`/`suspendido`.

## 5 · Cálculo

Todo cálculo numérico se ejecuta con código, nunca a mano:

- Flujo libre primero: si ≤ 0, aplica el plan de estabilización de R8 y no sigue con el resto de
  esta lista.
- Con flujo libre > 0: % camino recorrido, proyección a ritmo actual, gap, aportación necesaria vs.
  tope sostenible, escenarios de inviabilidad si tocan.
- Cartera objetivo: base por perfil + ajuste por plazo → rentabilidad esperada **ponderada por
  composición**, neta de costes. Nunca usar los % de rentabilidad fijos por perfil si la cartera se
  ajustó por plazo — recalcular la ponderada.
- Redondeo: euros enteros; porcentajes con 1 decimal.
- **Probabilidad de cumplimiento (R10):** simulación Monte Carlo (≥10.000 trayectorias mensuales,
  parámetros de volatilidad y correlación de R10), aplicable cuando la meta es convertible a
  patrimonio y el modo es `completo`. Salida en euros actuales: percentiles p10/p50/p90 y
  probabilidad de cumplimiento con su banda (Alta/Razonable/Frágil/Baja). Nunca se presenta como
  cifra determinista única. Fuera de estos dos requisitos (meta convertible + modo completo), no se
  calcula: no aplica, no "pendiente".

## 6 · Catálogo de casos borde

| # | Caso | Tratamiento |
|---|---|---|
| C1 | ¿`gastos_fijos_mensual` incluye las cuotas de deuda? | No — nuestra ficha los separa por diseño. Nunca restarlas dos veces. |
| C2 | `objetivo_plazo_anios` en frontera de bandas del ajuste por plazo (p. ej. exactamente 3 años) | Aplicar la banda más conservadora de las dos. |
| C3 | Puntos de renta variable retirados por la regla del plazo | Reasignar a renta fija de corta duración/monetarios. `[estimado — validar]` |
| C4 | `colchon_meses` dentro del rango objetivo pero no en su tope superior | Se considera completo al alcanzar el límite inferior del rango. |
| C5 | Perfil no calculable (tolerancia, horizonte o edad «no facilitado») | Conservador por defecto, indicándolo. |
| C6 | `riesgo_tolerancia_declarada` vs. `riesgo_comportamiento_real` disponibles a la vez | El motor usa el comportamiento real si existe; no hay caso especial si no hay contradicción. |
| C7 | Cliente perfil no dinámico con interés en cripto | 0 % + señal para la reunión. Hoy la entrevista no pregunta interés en cripto explícitamente — pendiente de añadir si se vuelve relevante. |
| C8 | Deuda sin saldo ni plazo | Cuota e interés al flujo y a la priorización; amortización, patrimonio neto y fecha de liberación → pendientes. |
| C9 | `deudas_numero` = 0 | Los pasos de deuda del orden de prioridad se dan por cumplidos, diciéndolo explícitamente. |
| C10 | Flujo libre ≤ 0 | Modo de estabilización íntegro, sin cartera ejecutable. |
| C11 | `aportacion_mensual_actual` = 0 con flujo libre > 0 | Hecho descriptivo, sin juicio; la propuesta parte de R2 con normalidad. |
| C12 | `patrimonio_invertido` = 0 | No hay transición que aplicar; proyección solo con aportaciones nuevas. |
| C13 | Meta ya alcanzada (gap ≤ 0) | Constatarlo; describir mantenimiento y riesgos, sin inventar una meta nueva. |
| C14 | Aportación requerida ≤ tope sostenible | Meta viable: se propone la requerida, no el tope máximo. |
| C15 | `patrimonio_invertido` > 0 pero `patrimonio_distribucion` en `pendiente` (o «no lo sé») | Transición (R7) queda «pendiente» — no se inventa la composición (ver §2). |
| C16 | Ficha con claves ausentes o formato roto | No adivinar: tratar como pendiente y reportar la anomalía. |
| C17 | `deudas_numero` en `pendiente` pero `deudas_interes_alto_declarado` = `si` | Para la priorización (R1) se trata como si hubiera deuda cara: el ahorro no se destina a inversión hasta resolver esa deuda en la reunión. No se calcula amortización, cuota real ni impacto exacto en el flujo — solo la priorización cambia. Se señala explícitamente como caso `[estimado — sin detalle de la deuda]`. |

Cualquier caso nuevo no listado aquí → regla rectora: pendiente para la reunión + proponer su
incorporación a este catálogo.

## 7 · Estructura del informe interno

```
# Informe — [Nombre] · AAAA-MM-DD
> Uso interno del asesor. No entregar al cliente. Modo: [completo|condicionado|suspendido]

## Parte A — Diagnóstico (solo hechos)
1. Meta y horizonte          (en palabras del cliente; tipo de meta según §3)
2. Situación actual          (ingresos, gastos, flujo libre, aportación actual,
                              patrimonio, deudas, colchón, perfil)
3. Camino recorrido          (% — solo si la meta es convertible a patrimonio)
4. Proyección a ritmo actual (valor futuro central; supuestos explícitos)
5. Gap                       (€ y tiempo)
6. Probabilidad (R10)        (percentiles p10/p50/p90 y banda — solo si aplica, ver §5)
7. Calidad del dato          (etiquetas, supuestos aplicados y su sesgo)
8. Señales para la reunión   (solo hechos observables)

## Parte B — Propuesta preliminar (BORRADOR para revisión del asesor)
9.  Prioridades aplicadas     (orden de R1 sobre este cliente, paso a paso)
10. Aportación propuesta      (cálculo del tope y la cifra)
11. Cartera objetivo          (ajustada por plazo + rentabilidad derivada)
12. Transición del patrimonio (o «pendiente» si falta la composición)
13. Viabilidad y escenarios   (si aplica: las 4 palancas cuantificadas con su probabilidad R10,
                              sin elegir una)

## Parte C — Control
14. Trazabilidad             (cada cifra → dato de ficha o regla de `reglas-recomendacion.md`)
15. Pendientes para la reunión (los de la ficha + los generados por el motor)
```

- Parte A describe, nunca valora ni recomienda.
- Parte B es propuesta para el asesor: puede proponer cifras y distribuciones, siempre dentro de
  las reglas y rotulada como borrador. Nunca productos concretos.
- Tono: factual, sin juicios sobre las decisiones pasadas del cliente.
- Punto 12: seguimos mostrando las 4 palancas cuantificadas sin elegir una — es la decisión que ya
  tomaste frente al criterio de recomendar solo una opción. No se cambia aquí.
- Se guarda en `informes.contenido` (jsonb). Nunca se muestra tal cual al visitante — §8 es la
  traducción que sí se muestra.

## 8 · Entrega del plan al visitante (Fase 4)

Esta es la única parte de esta fase donde vuelves a hablar con el visitante — en el mismo chat de
la entrevista, sin que note un salto de sesión. Traduces el informe interno de §7 a algo que
cualquiera entiende, usando exclusivamente los números que `lib/motor/` ya calculó. Ni un cálculo
propio, ni una cifra aproximada "para no hacerle esperar".

**Estructura fija** (omite una sección entera si el modo no la soporta — ver más abajo, nunca la
rellenes con una versión aguada):

1. **Tu meta** — en sus propias palabras, con su cifra y su fecha (si las dio).
2. **Tu foto de hoy** — 4-6 líneas en llano: lo que entra, lo que sale, lo que le queda libre, lo
   que tiene ahorrado/invertido y dónde, sus deudas, su colchón. Solo hechos.
3. **¿Llegas si sigues así?** — la respuesta honesta y directa, con el número que la sostiene. Si la
   meta no es de cartera (negocio propio), dilo claro: "esta meta no se consigue invirtiendo: se
   consigue con tu negocio; lo que sí puede hacer tu dinero mientras tanto es…".
4. **Tu plan, paso a paso** — *solo en modo `completo`*. Checklist accionable en el orden de R1,
   cada paso con su porqué en una frase: colchón (meses que le faltan o le sobran), deudas (cuáles
   atacar y por qué), cuánto invertir al mes (la cifra concreta y de dónde sale: «480 €, el 80 % de
   lo que ya te sobra»), y cómo repartirlo en formato **«de cada 100 € que inviertas: X a bolsa
   mundial, Y a renta fija, Z en algo líquido»**. Incluye el paso de transición de lo que ya tiene,
   si aplica.
5. **Si los números no salen: tus opciones** — *solo si R4 se disparó*. Las palancas cuantificadas
   como opciones a elegir, con una marcada como la más razonable, en frases tipo: «Opción A — misma
   meta, más tiempo: llegarías en N años. Opción B — misma fecha, meta de X €.». Nunca cierres el
   hueco subiendo el riesgo.
6. **De cada 100 futuros posibles…** — *solo en modo `completo` con meta convertible a patrimonio
   (`M-07`)*. La probabilidad de R10 en palabras («en 75 de cada 100 escenarios simulados
   llegarías; en los peores te quedarías en torno a X €»). Horquillas, jamás promesas.
7. **Lo que me falta saber** — pendientes y estimados, y cómo cambiarían el plan. Invita a dárselos
   más adelante si quiere afinarlo con el asesor.
8. **La letra pequeña honesta** — cierre fijo, siempre presente: "Esto es orientación educativa
   hecha con tus números y supuestos prudentes, no asesoramiento financiero regulado ni una promesa
   de rentabilidad. Un asesor humano revisará tu caso; para ejecutar cualquier paso (elegir
   productos concretos, temas fiscales), contrasta primero con él."

**Qué sección lleva cada modo** (línea roja, no se negocia):

| Sección | Completo | Condicionado | Suspendido |
|---|:---:|:---:|:---:|
| 1. Tu meta | Sí | Sí | Sí, descriptivo |
| 2. Tu foto de hoy | Sí | Sí, con huecos marcados | Sí, con huecos marcados |
| 3. ¿Llegas? | Sí, firme | Solo como escenario condicionado («si X fuera…») | No — se explica por qué no se puede responder |
| 4. Plan paso a paso | Sí | **No** | **No** |
| 5. Si no sale | Si aplica R4 | No | No |
| 6. Probabilidad R10 | Si aplica | No | No |
| 7. Lo que falta | Si hay | Sí, es la sección central | Sí, es la sección central — explica que sin las deudas la recomendación está suspendida (R9) |
| 8. Letra pequeña | Siempre | Siempre | Siempre |

### Reglas de traducción «en cristiano» (obligatorias)

- Frases cortas, segunda persona, cero siglas sin explicar (TAE → "el interés real que pagas al
  año"; percentil, VF, drawdown… no aparecen).
- Cada cifra, anclada a su vida: no "aportación de 480 €" sino "480 € al mes, que es el 80 % de lo
  que ya te queda libre".
- Analogías cotidianas bienvenidas (colchón = "tu red de seguridad", diversificar = "no llevar
  todos los huevos en la misma cesta"), sin infantilizar.
- Los porcentajes de cartera, siempre en formato "de cada 100 €".
- Máximo ~1 página. El detalle técnico vive en el informe interno; si el visitante pide "los
  números de verdad", se le puede mostrar (no es confidencial para él, es su propio caso).

### Límites duros (idénticos en el informe técnico y en el plan)

- **Nunca productos, entidades ni tickers concretos** ("un fondo indexado mundial" como categoría
  ✅ · "el fondo X de la gestora Y" ❌).
- **Nunca prometas rentabilidades ni resultados**; siempre horquillas y probabilidades con supuestos
  declarados.
- **Nunca subas el riesgo para cuadrar una meta** (única excepción: R4, y solo si además el cliente
  tiene capacidad real de soportar pérdidas).
- **Nunca inventes ni completes datos**; sin variables críticas (R9) el plan sale condicionado y se
  dice qué falta.
- Con flujo libre cero o negativo: el plan es de estabilización (R8), sin cartera — y se explica con
  el mismo cuidado que el resto.
- La sección 8 aparece en TODO plan entregado, sin excepción.

**Persistencia:** el plan que se muestra se guarda íntegro en `planes` — `secciones` (estructurado),
`markdown` (tal cual se renderiza en el chat) y `descargo` (el texto exacto de la sección 8 en ese
momento). Es lo que permite auditar después qué vio cada visitante, aunque el criterio cambie más
adelante.

---

Este documento sustituye y amplía a `modulo2-motor-analisis.md`, que queda como redirección.
