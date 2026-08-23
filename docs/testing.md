# Estrategia de testing

<!-- Documento vivo. Actualizar cuando cambie el stack o las convenciones de testing.
     Los cambios deben registrarse también en changelog/. -->

---

## Filosofía

Cobertura exhaustiva donde vive el riesgo real, ligera en el resto. `lib/motor/` es el módulo
crítico: ejecuta cálculos con dinero real de personas reales, y desde que el diagnóstico se
muestra directamente al visitante (sin revisión previa del asesor — ver decisión técnica en
`docs/architecture.md`) no hay ningún filtro humano entre un error de cálculo y la persona que lo
lee. Ahí se testea cada caso del catálogo de `instrucciones-motor.md` §6, uno por uno.

Para el resto —landing, chat UI, panel del asesor— tests de integración selectivos en los flujos
críticos (`FLOW-01`, `FLOW-02`) y nada de cobertura exhaustiva de componentes puramente visuales.

---

## Cuándo se escriben los tests

**Después de implementar, en una pasada propia.** No durante la planificación, y no a la vez que
el código.

El compromiso de que un requisito se va a validar se adquiere antes: es la tercera columna de la
tabla de cobertura de `docs/features/`. Pero el test en sí se escribe cuando el código ya existe,
leyéndolo. Es una diferencia de calendario pequeña con una consecuencia grande: un test escrito
antes que el código apunta a selectores, rutas y respuestas *imaginados*. Cuando luego no
coinciden con la realidad, casi nadie reescribe el test — se le van quitando aserciones hasta que
pasa, y acaba siendo un test que no comprueba nada pero que da luz verde. Escrito después, apunta
a lo que hay.

Reglas que se derivan de eso:

- **Antes de escribir una aserción, verifica que el selector existe en el código.** No lo
  supongas por el nombre del componente.
- **Si un elemento no tiene selector estable, añádele uno.** Meter un `data-testid` en el código
  es un cambio mínimo aceptable y preferible a colgar el test de una clase de estilos o de un
  texto que cambiará con el próximo ajuste de copy.
- **Cada "entonces" del criterio de aceptación necesita al menos una aserción.** Si el criterio
  define caso negativo, va su propio test.
- **Un test que falla no se arregla quitándole aserciones.** Si falla, o el código está mal o el
  criterio estaba mal escrito. Ambas cosas se corrigen donde toca; degradar el test para forzar el
  verde convierte la suite en decoración.
- **Los datos que crea un test los borra ese test.** Prefija lo que insertes para poder
  identificarlo y limpia al terminar, aunque el test falle a mitad.

---

## Stack de testing

| Tipo | Herramienta |
|------|-------------|
| Unitario | Vitest |
| Integración | Vitest + Testing Library |
| E2E | Playwright |

---

## Qué testear

### Sí testear
- **`lib/motor/` completo:** flujo libre, % camino recorrido, proyección, gap, cartera objetivo
  ponderada por composición, clasificación de la meta (§3), y **cada uno** de los 17 casos borde
  del catálogo de `instrucciones-motor.md` §6 (C1–C17) con su propio test.
- Modo del informe según calidad del dato (completo / condicionado / suspendido —
  `instrucciones-motor.md` §4), incluida la regla de que un modo `condicionado` o `suspendido`
  nunca debe devolver una propuesta ejecutable.
- Persistencia de ficha e informe en Supabase: que cada campo se guarda con su `_estado`
  (`confirmado`/`estimado`/`pendiente`) correcto, y que un dato sin etiqueta se trata como
  `estimado` (regla de `instrucciones-motor.md` §2).
- Flujo de entrevista (`FLOW-01`): orden fijo de los 8 bloques, tope de una repregunta por
  variable, manejo de dato sensible saltado, cierre con resumen de confirmación.
- Envío del aviso al asesor (`M-05`) y su registro correcto en `notificaciones_asesor`, incluido el
  caso de fallo de envío.
- E2E del camino feliz completo de `FLOW-01`: desde la landing hasta ver el diagnóstico en el chat.
- E2E de al menos un caso con modo `condicionado` o `suspendido`, para comprobar que el chat nunca
  muestra una propuesta ejecutable cuando no la hay.

### No testear (o mockear)
- Estilo puramente visual (colores, tipografía, espaciado) — sin tests de regresión visual en esta
  versión.
- La respuesta real de la Claude API en tests unitarios/integración: se mockea. Lo que se testea es
  el contrato (qué datos entran, qué estructura de ficha/informe sale, que `lib/motor/` recibe y
  devuelve lo esperado), no la calidad conversacional del modelo, que no es determinista.
- Envío real de emails: se mockea el proveedor; se testea que se invoca con los datos correctos y
  que el fallo se registra.

---

## Convenciones

- Archivos: `nombre.test.ts` junto al archivo que testea (unitario/integración); E2E en
  `tests/e2e/*.spec.ts`.
- Describe en presente, redactado como el criterio de aceptación de la ficha: "calcula el flujo
  libre restando cuotas de deuda", "marca el informe como suspendido si las deudas están pendientes
  por negativa del cliente".
- Cada caso borde del catálogo (`instrucciones-motor.md` §6) referencia su número (`C1`…`C17`) en
  el nombre del test, para poder cruzarlo con el catálogo sin buscar por contenido.
- Un assert por test cuando sea posible; los tests de `lib/motor/` pueden agrupar varios asserts
  sobre el mismo resultado calculado una sola vez, si separar el cálculo sería artificial.

---

## Cobertura objetivo

- **`lib/motor/`:** no se mide en porcentaje — el objetivo es que los 17 casos borde del catálogo
  tengan cada uno su test, más los cálculos base (§5 de `instrucciones-motor.md`). Un archivo con
  100% de líneas cubiertas pero sin test para un caso borde no cumple el objetivo.
- **Resto de lógica de negocio** (persistencia, envío de aviso, orquestación del chat): ≥ 80%.
- **UI/landing:** sin objetivo numérico; se cubre por los E2E de `FLOW-01`/`FLOW-02`, no por tests
  unitarios de componentes visuales.

---

## Cómo correr los tests

```bash
# Todos los tests
pnpm test

# Modo watch
pnpm test:watch

# Con cobertura
pnpm test:coverage

# E2E
pnpm test:e2e
```

<!-- Ajusta los comandos al stack elegido una vez relleno architecture.md. -->
