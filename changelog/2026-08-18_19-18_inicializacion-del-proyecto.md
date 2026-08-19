# Inicialización del proyecto

**Fecha:** 2026-08-18 19:18
**Tipo:** Configuración
**Requisitos:** Ninguno

## Qué se hizo

Se completó la documentación de `docs/` (tabla "Producto": `prd.md`, `architecture.md`,
`testing.md`, `design-system.md`, `data-model.md`, `roadmap.md`, `user-flows.md`; `business.md`
se descartó por no aplicar) y se convirtió el repositorio de plantilla en el repositorio real del
proyecto: landing con chatbot de diagnóstico financiero para la asesoría del usuario.

## Qué se modificó

- `docs/*.md` — los siete documentos aplicables, rellenos con el alcance real del proyecto.
- `docs/business.md` — eliminado (no aplica: sin monetización directa en el sitio).
- `README.md` — reescrito para describir el producto.
- `CLAUDE.md` — placeholders rellenos (descripción, stack, estructura, convenciones, "Qué NO
  hacer"); eliminada la sección de inicialización y las referencias a `.template/`.
- `LICENSE` — copyright a nombre de Rafael Moreno Vicens.
- `.env.example` — variables ajustadas al stack real (Supabase, Anthropic, email de aviso).
- `.mcp.json` — servidor MCP oficial de Supabase registrado (alcance `project`, `read_only=true`);
  ver entrada de changelog previa.
- `.claude/commands/init-proyecto.md` — eliminado (ya no aplica).
- `.claude/commands/doctor.md` — quitada la comprobación de existencia de `.template/`.
- `.claude/commands/changelog.md` — quitada la regla de desviar entradas a `.template/changelog/`.
- `mejoras/backlog.md` — limpiado el ejemplo comentado.
- `docs/features/README.md` — quitada la referencia a `.template/assets/`.
- `.template/` — eliminada por completo (18 archivos: historial de la plantilla, GIFs de demo,
  su propio README), con confirmación explícita del usuario.
- `project-template-main.zip` — eliminado (zip de descarga de la plantilla, sin uso tras la
  inicialización), con confirmación explícita del usuario.

## Por qué

`CLAUDE.md` exige ejecutar esta inicialización por iniciativa propia en cuanto los documentos de
`docs/` que aplican al proyecto están rellenos, para que ningún archivo del repo siga
describiéndose a sí mismo como plantilla.
