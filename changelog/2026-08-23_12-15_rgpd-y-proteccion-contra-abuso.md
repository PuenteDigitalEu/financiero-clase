# Consentimiento RGPD, límite de uso y separación informe/plan

**Fecha:** 2026-08-23 12:15
**Tipo:** Documentación
**Requisitos:** M-06 (nuevo)

## Qué se hizo

Se comparó `supabase/migrations/0001_esquema_inicial.sql` de `polmarza/Clase-Agente-Financiero`
contra `docs/data-model.md`. A diferencia de las comparaciones anteriores (discrepancias de
etiqueta o de variables), aquí aparecieron carencias reales de nuestro diseño: sin consentimiento
RGPD, sin protección contra abuso, sin separación entre el informe técnico interno y lo que
realmente se le muestra al visitante, sin trazabilidad de versión del motor/reglas.

## Qué se modificó

- `docs/data-model.md` — tablas nuevas `clientes`, `asesores`, `limites_uso`, `planes`;
  `conversaciones.token/consentimiento_en/expira_en`; `informes.version_motor/version_reglas`; RLS
  reescrito sobre el patrón "estar en `asesores` es el permiso" en vez de "cualquier
  `authenticated`".
- `docs/architecture.md` — sección nueva "Protección contra abuso"; "Estrategia de autenticación"
  actualizada; decisión técnica del consentimiento RGPD; diagrama de componentes ampliado.
- `docs/prd.md` — nuevo requisito MUST **`M-06`** (consentimiento antes de crear conversación);
  requisitos no funcionales de RGPD y protección contra abuso; flujo del visitante actualizado.
- `docs/user-flows.md` — `FLOW-01` con el paso de consentimiento explícito antes del disclaimer
  regulatorio (son actos distintos); casos de error de no-consentimiento y límite excedido.
- `docs/roadmap.md` — ambos marcados como bloqueantes de Fase 1, no opcionales.
- `docs/testing.md` — cobertura esperada para consentimiento y límite de uso.

## Por qué

El chat recoge datos financieros identificables a través de una URL pública sin autenticación —
sin consentimiento explícito ni límite de uso, el diseño anterior tenía un vacío legal (RGPD) y un
riesgo económico real (coste de API sin tope). Se detectó al comparar con el repo de referencia de
la clase, no por auditoría propia; queda registrado como decisión técnica en `architecture.md` que
esto requiere revisión legal antes de producción, no solo el mecanismo técnico.
