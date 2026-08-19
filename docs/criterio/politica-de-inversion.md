# Política de inversión — Marta

> Archivo de política del motor de análisis y recomendación (módulo 2).
> Fuente: entrevista de extracción de reglas con el asesor, 2026-08-06.
> Etiquetas: `[confirmado]` = regla dictada por el asesor · `[estimado]` = supuesto por defecto pendiente de validar.
> Este archivo es la única fuente de criterio del motor: si una regla no está aquí, el motor no la improvisa — marca el caso como pendiente para la reunión.
> Revisión de supuestos: al menos anual. [confirmado]

---

## 1 · Aportación mensual propuesta

- Punto de partida: la aportación que exige la meta; después se acota a lo sostenible. [confirmado]
- Tope sostenible: **70-80 % del flujo libre real** (ingresos − gastos − cuotas de deuda), dejando 20-30 % para imprevistos y vida cotidiana. [confirmado]
- Se puede llegar al 100 % del flujo libre **solo si** ya existen fondo de emergencia suficiente y provisiones para gastos irregulares. [confirmado]
- Si la aportación sostenible no alcanza la meta → NO se fuerza la aportación: se activan las palancas de la sección 6. [confirmado]

## 2 · Jerarquía de prioridades

Orden de asignación del ahorro mensual:

1. Mantener al día las cuotas mínimas de todas las deudas. [confirmado]
2. Colchón inicial de **1 mes de gastos**. [confirmado]
3. Cancelar deudas caras. [confirmado]
4. Completar el fondo de emergencia. [confirmado]
5. Aumentar la inversión. [confirmado]

Umbrales:

- Colchón suficiente: **3-6 meses** de gastos con ingresos estables; **6-12 meses** con ingresos variables, empleo incierto o personas dependientes. [confirmado]
- Deuda cara: **TAE > 7-8 %** → prioridad absoluta sobre invertir. TAE 4-7 % → zona gris, valorar según riesgo y liquidez y justificarlo en el informe. TAE < 4 % → razonable avanzar en paralelo con la inversión. [confirmado]
- No estrictamente secuencial: tras el colchón inicial, puede destinarse un **5-10 % del ahorro mensual** a inversión para crear hábito mientras se completa el colchón o se amortiza deuda. Excepción: tarjetas o créditos de interés muy alto absorben el 100 % del ahorro disponible, sin esta excepción. [confirmado]
- El fondo de emergencia vive **fuera** de la cartera invertida: el % de liquidez de las carteras de la sección 3 es adicional al colchón, no lo sustituye. [estimado]

## 3 · Carteras de referencia por perfil

| Perfil | Renta variable | Renta fija | Liquidez/monetarios |
|---|---:|---:|---:|
| Conservador | 20 % | 60 % | 20 % |
| Moderado | 50 % | 40 % | 10 % |
| Dinámico | 80 % | 15 % | 5 % |

[confirmado]

## 4 · Construcción sobre el perfil

**El plazo prevalece sobre el perfil:** [confirmado]

- `objetivo_plazo` < 3 años → renta variable 0-10 %; resto en monetarios y renta fija de corta duración.
- 3-7 años → renta variable de referencia −10 a −20 puntos.
- ≥ 8-10 años → distribución base; > 15 años → puede acercarse al extremo más dinámico compatible con el cliente.

**Otras clases:** [confirmado]

- Oro: 0-5 % opcional como diversificador, descontado de renta fija o variable.
- Cripto: fuera de la cartera básica. Solo si el cliente la solicita Y entiende el riesgo: **1-2 % máximo, solo perfil dinámico**.
- Cliente no dinámico que pide cripto → 0 % en la propuesta + señal para la reunión. [estimado]

La distribución final se ajusta a la **capacidad real de soportar pérdidas** (colchón, estabilidad de ingresos, obligaciones), no solo a la actitud declarada (`riesgo_perfil_derivado` ya pondera conducta sobre declaración). [confirmado]

## 5 · Supuestos de rentabilidad

La rentabilidad esperada de cada cartera se **deriva de su composición** (media ponderada por clase), nunca se asigna directamente al perfil. [confirmado]

| Clase | Rentabilidad nominal anual |
|---|---:|
| Liquidez/monetarios | 2 % |
| Renta fija | 3 % |
| Renta variable global | 6,5 % |
| Oro | 3 % |

- Costes: **−0,4 % anual** sobre la cartera. [confirmado]
- Resultantes con las carteras base de la sección 3 (escenario central, neto de costes): **conservador ≈ 3,1 % · moderado ≈ 4,3 % · dinámico ≈ 5,4 %**. Si la cartera se ajusta por plazo (sección 4), recalcular la ponderada — no usar estas cifras fijas. [confirmado]
- Inflación de referencia: **2 %** (objetivo BCE). Cálculo interno en nominal; resultados presentados en **euros actuales**. [confirmado]
- Estos supuestos sustituyen a cualquier cifra fija provisional en TODOS los módulos, diagnóstico incluido. [confirmado]
- Perfil `pendiente` → tratar como conservador, indicándolo en el informe. [confirmado]

## 6 · Política de inviabilidad

**Disparo:** la aportación sostenible (sección 1) no alcanza `objetivo_cifra` en `objetivo_plazo` con los supuestos de la sección 5. El informe lo declara sin eufemismos y presenta **escenarios cuantificados con uno recomendado**. [confirmado]

Orden de preferencia de las palancas (el recomendado es el primero que resulte realista para el cliente): [confirmado]

1. **Ajustar gastos o aumentar ingresos** de forma realista.
2. **Alargar el plazo**, si la fecha es flexible.
3. **Combinación**: plazo algo mayor + aportación algo superior.
4. **Reducir la cifra objetivo**, si lo anterior no basta.

Cada escenario muestra: aportación mensual, plazo resultante y probabilidad de cumplimiento (sección 11). Decide el cliente con el asesor, conociendo las consecuencias. [confirmado]

**Regla de riesgo — línea roja:** nunca se sube el nivel de riesgo para hacer viable una meta. Única excepción admisible: la cartera inicial era demasiado conservadora para el horizonte (sección 4, regla del plazo) Y el cliente tiene capacidad real de soportar pérdidas. Con plazos cortos o metas imprescindibles, subir el riesgo está prohibido siempre. [confirmado]

**Meta ya alcanzada:** si el gap es ≤ 0, no se activan estas palancas. El informe lo constata y describe mantenimiento y riesgos, sin inventar una meta nueva. [estimado]

## 7 · Metas expresadas como renta mensual

- Convertir solo la renta que debe generar **la cartera**: descontar antes pensiones, alquileres y otros ingresos previsibles. [confirmado]
- `patrimonio_objetivo = renta_anual_neta_necesaria ÷ tasa_retirada`, con tasa según horizonte de la retirada: **3 %** (× 400) a +40 años · **3-3,5 %** (× 343-400) a ~30 años · hasta **4 %** (× 300) a ~20 años con gasto flexible. Nunca el 4 % automático. [confirmado]
- Renta procedente de negocio propio: **no se convierte**. Los flujos del negocio se proyectan aparte (estabilidad, continuidad); la cartera solo cubre el déficit restante; el negocio puede valorarse como activo independiente. Si la ficha no trae datos del negocio → la parte de negocio queda "pendiente para la reunión". [confirmado]

## 8 · Transición del patrimonio existente

Todo el patrimonio es **una única cartera** y la transición lleva **fecha límite** — nunca se deja indefinidamente una cartera inadecuada. [confirmado]

- En liquidez (tras separar colchón y dinero de corto plazo): entrada de una vez si horizonte largo; si preocupa el momento de entrada, escalonar **6-12 meses**. [confirmado]
- Invertido pero mal distribuido: riesgos graves (concentración, costes altos, productos inadecuados) se corrigen pronto; el resto se reajusta cuantificando antes impuestos y comisiones. [confirmado]
- Solo con aportaciones nuevas: válido únicamente si corrige el desequilibrio en **12-24 meses**. [confirmado]
- Fiscalidad (España): traspasos entre fondos con requisitos difieren tributación; vender acciones/ETF materializa plusvalías → cuantificar el coste fiscal antes de elegir entre recolocación inmediata o gradual. [confirmado]

## 9 · Flujo libre cero o negativo

El informe cambia de objetivo: **recuperar estabilidad financiera**. [confirmado]

- Foco en presupuesto, gastos recortables, ingresos y deuda; proteger liquidez; detener nuevas inversiones.
- No se propone cartera ejecutable; como máximo, una cartera futura **condicionada** a superávit recurrente sostenido varios meses + colchón.

Mínimos y costes (aplican siempre): sin mínimo universal — 25-50 €/mes valen para crear hábito con productos baratos; no invertir si hay comisiones fijas relevantes o si esa aportación hace falta para el colchón; coste total máximo de un plan: **~1 % anual**. [confirmado]

## 10 · Calidad del dato

**Variables críticas** — si alguna falta (`pendiente`), el informe emite solo **escenarios condicionados**, nunca propuesta ejecutable: ingresos y gastos esenciales · deudas (cuotas e intereses relevantes) · liquidez y colchón · patrimonio invertido · objetivo y plazo · capacidad y tolerancia al riesgo. [confirmado]

- `deudas: pendiente` por negativa del cliente → recomendación **expresamente suspendida**. [confirmado]

**Datos secundarios `estimado`** — supuestos prudentes, visibles en el informe, sesgados siempre contra el optimismo: gastos, inflación, costes e impuestos **al alza**; ingresos, rentabilidad y valor realizable **a la baja**; colchón: solo lo confirmado. [confirmado]

**Deudas incompletas:** con cuota + interés → se integran en el flujo y se decide su prioridad (sección 2). Sin saldo ni plazo → no calcular amortización, patrimonio neto ni fecha de liberación de cuota; pendiente para la reunión. [confirmado]

## 11 · Probabilidad de cumplimiento

- Simulación **Monte Carlo ≥ 10.000 trayectorias** con volatilidad, correlaciones, inflación, aportaciones y retiradas. Presentar percentiles pesimista / central / optimista — nunca una cifra determinista única. [confirmado]
- Bandas: **Alta ≥ 80 % · Razonable 65-79 % · Frágil 50-64 % · Baja < 50 %**. [confirmado]
- Parámetros de simulación (estándar de mercado): volatilidad anual — liquidez 0,5 %, renta fija 5 %, renta variable global 15 %, oro 15 %; correlaciones — RV-RF 0,1 · RV-oro 0,0 · RF-oro 0,2 · liquidez ≈ 0 con todo. [estimado]

---

## Límites duros (recordatorio transversal)

- Nunca productos concretos (fondos, tickers, plataformas): solo clases de activo y porcentajes. La entrega al cliente se hace en el formato llano definido en las instrucciones del agente, siempre con el descargo de orientación educativa no regulada.
- Nunca subir el riesgo para cuadrar una meta (única excepción en la sección 6).
- Nunca inventar ni completar datos: lo que falte, `pendiente` y a la reunión.
- Todo número sale de código ejecutado, Monte Carlo incluido.

## Pendientes de validación

1. Colchón fuera de la cartera invertida (sección 2). `[estimado]`
2. Cripto a 0 % + señal de reunión en perfiles no dinámicos (sección 4). `[estimado]`
3. Volatilidades y correlaciones del Monte Carlo (sección 11). `[estimado]`

---

**Nota de reconstrucción:** las secciones 1-3 están transcritas directamente de la captura que compartiste. Las secciones 4-11 son mi reconstrucción a partir del contenido completo de Marta que ya teníamos (antes en `reglas-recomendacion.md`), renumerado para encajar con la pista "sección 6" que aparece en tu captura para la política de inviabilidad. Si tienes forma de confirmar los títulos exactos de las secciones 4 en adelante (haciendo scroll en el Claude del profe), lo ajusto.
