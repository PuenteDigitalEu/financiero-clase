# Backlog de mejoras

<!-- Ideas de mejora que no entran en el sprint actual pero que no queremos perder.
     No es un compromiso, es un repositorio de ideas.
     Añadir una entrada cada vez que surja una idea durante el desarrollo. -->

---

## Formato de entrada

```
### [MEJORA-XX] Título de la idea
**Área:** Frontend / Backend / UX / Infraestructura / Negocio
**Prioridad estimada:** Alta / Media / Baja
**Origen:** De dónde salió la idea (conversación, feedback de usuario, etc.)

Descripción breve de la mejora y por qué aportaría valor.
```

---

### [MEJORA-01] Clonar el stack como base para una encuesta de "necesidad de IA en el entorno laboral y empresarial"
**Área:** Infraestructura / Negocio
**Prioridad estimada:** Media
**Origen:** Conversación con el usuario (2026-09-02) — quiere reutilizar lo construido para un caso real de su empresa.

Reaprovechar la infraestructura de este proyecto para un producto distinto: una encuesta
conversacional que evalúa dónde y cómo puede ayudar la IA en una empresa. **Repo NUEVO** copiado de
este (no se toca el de la asesoría, que ya está en producción); proyecto Supabase nuevo; vaciar
`docs/` y arrancar con la pregunta del `CLAUDE.md` ("¿Qué quieres construir y para quién?").

**Se reaprovecha casi tal cual (~60-70% del trabajo):** landing + chat embebido, acceso sin cuentas
por URL genérica, consentimiento (M-06) y su registro, bucle de turnos `/api/chat` (historial
completo del lado cliente, una pregunta cada vez, tope de turnos), persistencia en Supabase
(conversación → ficha → informe → resultado con `token` de sesión), aviso automático por email al
terminar, límite de uso por IP (hash + pepper), despliegue Vercel + Supabase y el patrón Edge
Function + `pg_cron` si hiciera falta algún proceso periódico. También la disciplina "Claude
conduce, no calcula".

**Se reescribe la capa de dominio:**
- `plantilla-entrevista.md` / `instrucciones-sistema.md`: nuevo guion — tamaño y sector de la
  empresa, procesos actuales, tareas repetitivas o con mucho dato, herramientas en uso, madurez
  digital del equipo, sensibilidad de los datos y cumplimiento, presupuesto y apetito, quién
  decide.
- Tabla `fichas` + migración inicial: columnas nuevas que casen con ese guion (fuera las ~30 de
  ingresos/deudas/patrimonio).
- `lib/motor/` + `docs/criterio/` → una **rúbrica**: de las respuestas a un nivel de preparación
  para IA + una lista priorizada de casos de uso por impacto × viabilidad. Conviene una capa
  determinista mínima aunque el resultado sea cualitativo, para que el output sea consistente y
  defendible.
- Fuera el disclaimer regulatorio ("no es asesoramiento de inversión"); como mucho un "orientación
  preliminar".
- Rebranding de copy y sistema de diseño.
- **Se elimina entera la capa M-09** (migración `0002_alertas_de_mercado.sql`, `src/lib/alertas/`,
  `scripts/revision.ts`, `supabase/functions/revision-mercado/`) — no aplica.

**Valor:** la infraestructura ya está construida y verificada en producción; partir de aquí ahorra
la mayor parte del trabajo frente a empezar de cero.
