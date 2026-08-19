# Informe — Silvia · 2026-08-17

> Uso interno del asesor. No entregar a la cliente. Modo: **completo**

## Parte A — Diagnóstico (solo hechos)

### 1. Meta y horizonte
Eliminar la hipoteca de construcción (200.000€ pendientes) para liberar la cuota mensual, en un plazo máximo de 10 años.

**Aviso de clasificación — caso nuevo, no cubierto por el catálogo actual.** Las 4 categorías de meta definidas (patrimonio / renta de cartera / renta de negocio propio / mixta) asumen que el cliente quiere *acumular* un capital. La meta de Silvia es *amortizar una deuda concreta* — no encaja limpiamente en ninguna. Por detección literal (objetivo_importe es una cifra en € totales) clasificaría como "Patrimonio", pero aplicar el marco de rentabilidad esperada por perfil de riesgo a una meta de amortización de deuda no tiene sentido financiero: nadie invierte en renta variable con horizonte de pagar una hipoteca. Este informe calcula la aportación necesaria como amortización pura (sin rentabilidad), y dejo este caso como pendiente de incorporar al catálogo de casos borde de `instrucciones-motor.md` (candidato a C17).

### 2. Situación actual
- Ingresos netos: 2.700€/mes [confirmado]
- Gastos fijos: 2.500€/mes [estimado]
- Cuotas de deuda: 140€/mes (préstamo de consumo) + 0€/mes (hipoteca de construcción, en carencia hasta licencia de habitabilidad)
- **Flujo libre: 60€/mes** — extremadamente ajustado
- Aportación actual: 0€/mes (no aporta nada de forma regular; el plan de pensiones lo nutre solo la empresa)
- Patrimonio líquido: 4.000€ [estimado]
- Patrimonio invertido: 250.000€ en plan de pensiones, aportado íntegramente por la empresa durante 35 años [estimado]
- Deudas: préstamo de consumo (importe pendiente no facilitado, cuota 140€) + hipoteca de construcción (200.000€, cuota 0€ actual)
- Colchón: 1,6 meses (4.000€ ÷ 2.500€) — **incompleto**: el umbral aplicable es 3-6 meses (ingresos estables, prejubilada con PSI)
- Perfil de riesgo: **Conservador** (2 puntos: tolerancia declarada "prefiere evitar caídas" = 0 · horizonte 10 años = 1 · edad 60 años, banda 45-60 = 1). Coincide con la tolerancia declarada — sin contradicción con comportamiento real (no aplica, sin experiencia previa de inversión).

**Nota fuera de los campos core:** Silvia tiene una propiedad en construcción valorada en ~1.500.000€ si se vendiera. No hay campo en la ficha para patrimonio inmobiliario — no se computa en ningún cálculo de este informe, solo se deja constancia.

### 3. Camino recorrido
No se reporta un % de camino recorrido convencional. El patrimonio invertido (250.000€ en plan de pensiones) **no es aplicable a esta meta**: es un fondo aportado por la empresa, con restricciones normales de disposición de planes de pensiones en España, no una reserva disponible para amortizar una hipoteca. Calcularlo como "125% del camino recorrido" (250.000/200.000) sería engañoso y no lo hago.

### 4. Proyección a ritmo actual
Sin aportación actual (0€/mes) dedicada a este objetivo, la proyección a ritmo actual es: **no se avanza hacia la meta**.

### 5. Gap
200.000€ — el gap es el importe íntegro, dado que no hay aportación activa hacia este fin.

### 6. Calidad del dato
- `deuda_1_importe` (préstamo de consumo): pendiente — no se pudo calcular su amortización ni fecha de cancelación.
- `gastos_fijos_mensual`, `patrimonio_liquido`, `patrimonio_invertido`: estimados, no confirmados con precisión.
- `riesgo_comportamiento_real`: sin dato (sin experiencia previa de inversión, no por reticencia).
- Sesgo aplicado: ninguno de los estimados cambia la conclusión central (flujo libre extremo), así que no se ha necesitado forzar el sesgo conservador para que el diagnóstico sea prudente.

### 7. Señales para la reunión
- Flujo libre de solo 60€/mes pese a un patrimonio considerable (250.000€ en pensión + propiedad ~1.500.000€) — perfil "rico en activos, pobre en liquidez".
- Colchón muy por debajo de su umbral (1,6 de 3-6 meses).
- Deuda de consumo sin importe confirmado.
- La meta tal como está planteada no es alcanzable por la vía de ahorro mensual (ver Parte B) — el camino real probablemente pase por el propio patrimonio (venta/refinanciación de la propiedad, u otra vía), que queda fuera del alcance de este motor.

---

## Parte B — Propuesta preliminar (BORRADOR para revisión del asesor)

### 8. Prioridades aplicadas
1. Cuotas mínimas al día — cumplido (préstamo 140€/mes se paga; hipoteca sin cuota exigible aún).
2. Colchón inicial de 1 mes — cumplido (1,6 meses > 1 mes).
3. Cancelar deuda cara — el préstamo de consumo no trae TAE declarado; por tipo (préstamo personal) se infiere **cara por defecto**. Prioridad de cancelación, pero sin importe pendiente no se puede calcular cuánto falta ni cuándo se liquidaría.
4. Completar el colchón — pendiente, faltan entre 1,4 y 4,4 meses de gasto según el extremo del rango (3-6 meses).
5. Inversión — no se llega a esta fase con el orden estricto, dado el flujo libre disponible.

### 9. Aportación propuesta
- Tope sostenible: 70-80% de 60€/mes = **42-48€/mes**.
- Aportación necesaria para la meta (amortización pura, sin rentabilidad, en 120 meses): 200.000 ÷ 120 = **1.667€/mes**.
- La necesaria supera el tope sostenible en más de 30 veces. **Meta no viable con la capacidad actual** → se activa la sección 12.

### 10. Cartera objetivo
No aplica en el sentido convencional, dado el tipo de meta (ver aviso de clasificación). Si se considerara el patrimonio invertido existente (250.000€ en pensión) como cartera de referencia: perfil Conservador → 20% RV / 60% RF / 20% liquidez, rentabilidad esperada ≈3,1% neta — pero esto no tiene relación directa con el objetivo de amortizar la hipoteca.

### 11. Transición del patrimonio
Pendiente — no hay `patrimonio_distribucion` en la ficha (composición del plan de pensiones por clase de activo no disponible). No se puede evaluar si la cartera del plan de pensiones está bien distribuida.

### 12. Viabilidad y escenarios
La meta no es viable con la aportación sostenible actual. Palancas cuantificadas:

1. **Más aportación** — se necesitarían 1.667€/mes, frente a los 42-48€/mes sostenibles. Deficit de ~1.620-1.625€/mes.
2. **Más plazo** — al tope sostenible (~45€/mes), se tardarían ≈4.444 meses (≈370 años). No es una alternativa realista; se muestra el cálculo pero se señala explícitamente como no viable en ningún horizonte de vida razonable.
3. **Meta ajustada** — con la aportación sostenible durante 10 años (45€/mes × 120), se alcanzarían ≈5.400€ — una fracción mínima de los 200.000€ objetivo.
4. **Más rentabilidad asumida** — no aplica: no tiene sentido invertir en mercados para amortizar una deuda con este planteamiento; se omite este escenario en vez de forzar un número sin sentido.
5. **Combinación** — ninguna combinación razonable de las palancas anteriores cierra una brecha de esta magnitud.

**Conclusión de esta sección:** con los datos actuales, esta meta no se resuelve por la vía de ahorro/inversión mensual. El patrimonio existente de Silvia (pensión, propiedad) sugiere que el camino real hacia "liberarse de la hipoteca" pasa por otra vía (venta, refinanciación, disposición de patrimonio) que este motor no está diseñado para analizar — queda como pendiente para la reunión.

---

## Parte C — Control

### 13. Trazabilidad
- Flujo libre (60€/mes) → `ingresos_netos_mensual` − `gastos_fijos_mensual` − suma de `deuda_N_cuota`.
- Tope sostenible (42-48€/mes) → política §1, 70-80% del flujo libre.
- Aportación necesaria (1.667€/mes) → `objetivo_importe` ÷ (`objetivo_plazo_anios` × 12), sin rentabilidad por no aplicar el marco de inversión a este tipo de meta.
- Colchón (1,6 meses) → `patrimonio_liquido` ÷ `gastos_fijos_mensual`.
- Perfil (Conservador, 2 puntos) → política §3, fórmula de puntos sobre `riesgo_tolerancia_declarada`, `objetivo_plazo_anios`, `edad`.
- Clasificación "cara por defecto" del préstamo de consumo → política §2, inferencia por tipo (sin TAE en la ficha).

### 14. Pendientes para la reunión
- Importe pendiente del préstamo de consumo (`deuda_1_importe`).
- Composición del plan de pensiones (`patrimonio_distribucion` — campo inexistente en la ficha actual).
- Cómo tratar una meta de "amortización de deuda específica" que no encaja en las 4 categorías del catálogo — candidato a nuevo caso borde (C17) en `instrucciones-motor.md`.
- Vía real para alcanzar el objetivo (venta/refinanciación de la propiedad u otra), fuera del alcance de este motor.
- Valor de la propiedad en construcción (~1.500.000€, estimado) no tiene campo en la ficha — considerar añadir `patrimonio_inmobiliario` si este tipo de caso se repite.
