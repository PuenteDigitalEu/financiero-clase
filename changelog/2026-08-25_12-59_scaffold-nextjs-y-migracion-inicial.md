# Escafoldado de Next.js y migración inicial de Supabase

**Fecha:** 2026-08-25 12:59
**Tipo:** Feature
**Requisitos:** Ninguno directamente (infraestructura para M-01 a M-07)

## Qué se hizo

Segunda tarea de la Fase 1 del roadmap: crear el proyecto Next.js real (hasta ahora no existía
ningún archivo de aplicación, solo documentación) y escribir la migración inicial de base de
datos.

- **Next.js:** escafoldado con `pnpm create next-app` (Next.js 16, App Router, TypeScript
  estricto, Tailwind 4, ESLint), siguiendo la estructura de `docs/architecture.md`. Se descartaron
  los archivos generados que habrían pisado los nuestros (`CLAUDE.md`, `AGENTS.md`, `README.md`).
  Se añadieron `@anthropic-ai/sdk` y `@supabase/supabase-js` como dependencias, y `vitest` +
  `@vitest/coverage-v8` como dev, con scripts `test`/`test:watch`/`test:coverage`. `pnpm install`,
  `pnpm build` y `pnpm lint` verificados localmente, sin errores.
- **`supabase/migrations/001_esquema_inicial.sql`:** traducción ejecutable completa de
  `docs/data-model.md` — 9 tablas, el enum `dato_estado`, RLS activado en todas, y la función
  `es_asesor()`. Verificada de verdad (no solo leída): se instaló PGlite (Postgres real compilado
  a WASM) en el scratchpad, se aplicó la migración contra una base limpia con un `auth.users` /
  roles de Supabase simulados, y se comprobó que aplica sin error, que RLS queda activo en las 9
  tablas, que una fila completa se puede insertar por toda la cadena de FKs
  (`clientes→conversaciones→fichas→deudas→informes→planes`), que los `check` de dominio rechazan
  valores fuera de lista, y que `conversaciones.consentimiento_en not null` impide crear una
  conversación sin consentimiento (`M-06`).

## Qué se modificó

- Nuevo: `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
  `postcss.config.mjs`, `next-env.d.ts`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`.
- Nuevo: `src/app/layout.tsx`, `src/app/page.tsx` (placeholder), `src/app/globals.css`,
  `src/app/favicon.ico`.
- Nuevo: `supabase/migrations/001_esquema_inicial.sql`.
- `docs/data-model.md` — sección "Migraciones" actualizada con el detalle de la verificación
  realizada y por qué no se aplicó contra el Supabase real (sin credenciales en este entorno, MCP
  en modo `read_only`).
- `docs/architecture.md` — `supabase/migrations/` añadido a la estructura de carpetas; nota de
  estado real de qué existe y qué no todavía.
- `docs/roadmap.md`, `CLAUDE.md` — ambas tareas marcadas como hechas.

## Por qué

Continuación de la Fase 1 del roadmap, autorizado por el usuario a avanzar sin confirmación en
cada paso. No se aplicó la migración contra el proyecto Supabase real: ni el MCP (registrado en
modo `read_only=true`) ni las variables de entorno de este equipo dan acceso de escritura, y aunque
lo dieran, es una acción sobre infraestructura compartida que corresponde ejecutar al usuario.
