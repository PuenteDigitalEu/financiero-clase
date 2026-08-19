# Cambios propuestos para integrar el Módulo 2 — para tu aprobación

Ninguno de estos cambios está aplicado. Es una lista de lo que detecto en tus instrucciones actuales que entra en conflicto o queda huérfano al añadir el Módulo 2, para que apruebes cada uno (o me digas otra cosa) antes de tocar nada.

---

**1. Conflicto de arquitectura — el más importante, decisión de producto, no de redacción.**

La cabecera de tus instrucciones dice: *«Flujo único en una misma conversación... Sustituye a la v1... ya no hay reunión posterior — el cliente recibe el resultado directamente de ti.»*

Esto choca de frente con el Módulo 2 tal como lo has pedido: se activa solo cuando el asesor lo pide, nunca durante la entrevista, y su informe nunca es un mensaje para el cliente. Con el Módulo 2 añadido, la entrevista (Fases 1-2) ya no puede terminar entregando un plan al cliente en la misma conversación — tiene que terminar en la ficha, y ahí parar.

En la práctica, esto reintroduce la separación cliente/asesor que la v2 había eliminado. Necesito que confirmes que esto es lo que quieres antes de tocar el resto de la lista, porque los puntos 2-5 dependen de esta decisión.

---

**2. Fase 3 · Motor de análisis y recomendación (la actual).**

Esta sección ya describe el cálculo del diagnóstico dentro del mismo flujo con el cliente (ejecuta `motor-calculos.py`, referencia `reglas-recomendacion.md`, genera `informe-[nombre].md`). Con el Módulo 2 nuevo cubriendo exactamente ese paso pero con activación separada, esta sección queda duplicada.

Propuesta: eliminar la Fase 3 actual y sustituirla por una referencia al Módulo 2, para no tener dos definiciones del mismo paso con reglas de activación distintas.

---

**3. Fase 4 · Entrega al cliente → `plan-[nombre].md`.**

Esta fase asume que, tras el análisis, el mismo agente traduce el informe a un plan y se lo cuenta al cliente en la misma conversación. Con el Módulo 2 como paso separado y activado solo por el asesor, esta fase queda huérfana: ¿quién genera `plan-[nombre].md` ahora, y cuándo?

No lo resuelvo por mi cuenta porque es una pieza que falta, no un ajuste de texto — podría ser un futuro «Módulo 3» que traduzca `informe-[nombre].md` a lenguaje de cliente, o algo que hagas tú a mano a partir del informe.

Propuesta: dejar la Fase 4 marcada como «en pausa / no activa» hasta que decidas si la recuperas como módulo independiente.

---

**4. Apertura del cliente (Fase 1).**

*«...y al final te entrego un plan claro con tu situación y qué puedes hacer»* — promete, dentro de la propia entrevista, algo que con el Módulo 2 separado ya no se entrega en esa conversación.

Propuesta: ajustar la frase para que no prometa un plan inmediato (p. ej. algo en la línea de «...y con eso preparo tu ficha para el análisis»). No propongo la redacción exacta aquí porque toca la plantilla de entrevista ya probada y prefiero que la ajustes tú o me la pidas aparte.

---

**5. Despedida del resumen de confirmación (Fase 1).**

*«Dame un momento, hago números y te lo cuento todo masticado»* — mismo problema que el punto 4: promete cálculo y entrega inmediatos al cliente.

Propuesta: alinear con que la ficha es el final del turno del cliente (algo como lo que ya usa `plantilla-entrevista.md` en su cierre original, antes de las excepciones de la v2).

---

**6. «Reglas de traducción en cristiano» y «Límites estrictos».**

Están redactadas pensando en la entrega directa al cliente (Fase 4). Si la Fase 4 queda en pausa (punto 3), esta sección deja de aplicarse en el flujo activo hoy — pero no la borraría, porque seguramente la necesites igual el día que retomes la entrega al cliente, sea como Módulo 3 o como tarea manual tuya.

Propuesta: marcarla como «en espera», no eliminarla.

---

**7. Supuestos de rentabilidad — ya resuelto, sin cambio necesario.**

Tu Fase 3 actual ya dice que los supuestos v1 (2/4,5/6,5%) están derogados y remite a `reglas-recomendacion.md` como fuente única — que es exactamente donde viven ahora (sección 5 de ese archivo). No hace falta tocar nada aquí; lo confirmo y sigo.

---

**8. Referencias a R1–R10, C1–C16 e `instrucciones-motor.md`.**

Tu Fase 3 actual menciona un catálogo de reglas numeradas (R1-R10) y casos borde (C1-C16) que viven en `instrucciones-motor.md`, además de referencias sueltas en Fase 4 y en Límites estrictos («R3», «R4», «R8», «R9»). Ese archivo no está entre lo que tenemos construido en esta carpeta, y `reglas-recomendacion.md` tal como lo redactamos usa secciones 1-5 sin numeración R/C.

El punto «criterio» del Módulo 2 nuevo («si un caso no está cubierto, pregunta al asesor») funciona igual sin esa numeración, así que esto no bloquea activar el módulo hoy. Pero si quieres conservar las referencias cruzadas tipo «R4» que aparecen en tus instrucciones, en algún momento habrá que numerar `reglas-recomendacion.md` (o sustituir esas referencias por descripciones en texto).

Lo dejo anotado como pendiente, no lo resuelvo ahora — no es necesario para que el Módulo 2 funcione.
