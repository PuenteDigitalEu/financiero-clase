# Configuración del servidor MCP de Supabase

**Fecha:** 2026-08-18 18:36
**Tipo:** Configuración
**Requisitos:** Ninguno

## Qué se hizo

Se registró el servidor MCP oficial de Supabase (`https://mcp.supabase.com/mcp`), en alcance
`project` y modo `read_only=true`, para poder consultar el esquema y los datos del proyecto
Supabase (`ekuxwmktzasyxvziijdz`) desde el editor sin salir a la consola web.

## Qué se modificó

- `.mcp.json` (nuevo) — registro del servidor `supabase`.
- `docs/architecture.md` — tabla "MCPs del proyecto" actualizada con el servidor, su alcance y su
  propósito.

## Por qué

El stack del proyecto (`docs/architecture.md`) ya fija Supabase como base de datos. Con el stack
decidido, `CLAUDE.md` marca ese momento como el punto para plantear los MCPs del proyecto. Se
autenticará por OAuth en el navegador, sin token guardado en el repo. Se eligió `read_only=true`
como punto de partida porque `docs/data-model.md` (con las tablas y migraciones reales) todavía no
está escrito — se retirará esa restricción cuando haga falta aplicar migraciones de verdad.
