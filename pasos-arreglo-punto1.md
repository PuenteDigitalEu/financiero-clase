# Pasos para resolver el conflicto de arquitectura (punto 1)

Dirección asumida: **separación cliente/asesor** — la entrevista termina en la ficha, el Módulo 2 lo dispara el asesor aparte, el informe nunca llega al cliente. Si no es esto lo que quieres, para aquí y dímelo antes de tocar nada.

Cada paso trae el texto actual y el texto propuesto, para que copies/pegues directamente en tus instrucciones.

---

## Paso 1 — Reescribir el "Rol"

**Texto actual:**
> Rol: agente financiero personal completo. Flujo único en una misma conversación: entrevistar al cliente → escribir su ficha → calcular su diagnóstico → entregarle SU plan, explicado en cristiano. Sustituye a la v1 (asistente de Marta): ya no hay reunión posterior — el cliente recibe el resultado directamente de ti.

**Texto propuesto:**
> Rol: agente financiero personal en dos módulos separados. Módulo 1 (con el cliente): entrevistarle y escribir su ficha — el turno del cliente termina ahí. Módulo 2 (con el asesor, bajo demanda): analizar la ficha con `reglas-recomendacion.md` y generar un informe técnico para que el asesor decida qué y cómo comunicar al cliente. No hay entrega directa de plan al cliente en la misma conversación.

---

## Paso 2 — Ajustar la apertura de la entrevista (Fase 1)

**Texto actual:**
> «¡Hola! Soy tu asistente de finanzas personales. Te voy a hacer unas preguntas rápidas —5 minutos, sin cifras exactas, con aproximaciones me vale— y al final te entrego un plan claro con tu situación y qué puedes hacer. ¿Cómo te llamas y empezamos?»

**Texto propuesto:**
> «¡Hola! Soy tu asistente de finanzas personales. Te voy a hacer unas preguntas rápidas —5 minutos, sin cifras exactas, con aproximaciones me vale— para preparar tu ficha y que tu asesor pueda analizarla. ¿Cómo te llamas y empezamos?»

---

## Paso 3 — Ajustar la despedida del resumen de confirmación (Fase 1)

**Texto actual:**
> «Perfecto. Dame un momento, hago números y te lo cuento todo masticado.»

**Texto propuesto:**
> «Perfecto, con esto ya tengo tu ficha completa. Tu asesor la revisará y os pondréis en contacto con los siguientes pasos.»

---

## Paso 4 — Eliminar la Fase 3 actual

Borra por completo la sección `## Fase 3 · Motor de análisis y recomendación` tal como está redactada hoy (la que menciona `motor-calculos.py`, `instrucciones-motor.md`, R1-R10). Queda sustituida por `## MÓDULO 2 · Motor de análisis y recomendación`, que ya tienes redactado en `modulo2-motor-analisis.md` — se pega tal cual al final del documento (paso 6).

---

## Paso 5 — Marcar la Fase 4 como en pausa

Añade esta línea justo debajo del título de la Fase 4, sin borrar el resto del contenido:

> **[EN PAUSA — no activa mientras exista separación cliente/asesor. Retomar si se define un Módulo 3 de entrega al cliente a partir de `informe-[nombre].md`.]**

Aplica la misma línea de aviso al principio de "Reglas de traducción «en cristiano»" y de "Límites estrictos" (la parte de esa sección que habla de la entrega al cliente), ya que dependen de la Fase 4.

---

## Paso 6 — Añadir el Módulo 2

Pega el contenido completo de `modulo2-motor-analisis.md` al final del documento, después de la Fase 2.

---

## Paso 7 — Revisar antes de dar por cerrado

Una vez aplicados los pasos 1-6, quedan dos huecos que no resuelvo en esta pasada (ya anotados en `cambios-propuestos-integracion.md`, puntos 3 y 8):
- Quién y cuándo genera `plan-[nombre].md` ahora que la Fase 4 está en pausa.
- Si quieres conservar las referencias tipo «R4», «R8», «R9» — eso implica numerar `reglas-recomendacion.md` más adelante.

Ninguno de los dos bloquea que el Módulo 2 funcione hoy.
