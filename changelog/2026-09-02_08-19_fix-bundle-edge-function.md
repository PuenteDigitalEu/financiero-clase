# Fix: la Edge Function no bundleaba (import map fuera de sitio + especificador bare)

**Fecha:** 2026-09-02 08:19
**Tipo:** Fix
**Requisitos:** M-09 (arregla el despliegue de la Edge Function del changelog 2026-09-01)

## Qué se hizo

El primer `supabase functions deploy revision-mercado` subió los assets pero falló al bundlear:

```
Failed to bundle the function (reason: Relative import path "@supabase/supabase-js" not prefixed
with / or ./ or ../ ... hint: try `deno add npm:@supabase/supabase-js`)
  at .../supabase/functions/revision-mercado/index.ts:22:30
```

Dos causas:

1. **El import map no se subía.** Estaba en `supabase/functions/deno.json`, y la CLI solo incluye
   `deno.json` como asset si está **dentro de la carpeta de la función**. Movido a
   `supabase/functions/revision-mercado/deno.json`.
2. **El import de valor de `index.ts` no debía depender del map.** `import { createClient } from
   '@supabase/supabase-js'` pasa a `import { createClient } from 'npm:@supabase/supabase-js@2.112.4'`
   (especificador npm directo, que Deno resuelve sin map). El `deno.json` se queda igualmente para el
   `import type { SupabaseClient }` de `src/lib/alertas/revision-core.ts`, que sigue con el
   especificador bare para que `revision-core.ts` funcione también en Node/tsx.

## Qué se modificó

- `supabase/functions/deno.json` → `supabase/functions/revision-mercado/deno.json` (movido).
- `supabase/functions/revision-mercado/index.ts` — import de `createClient` con especificador `npm:`.

## Por qué

Sin esto la función no se despliega. El lado Node (`pnpm revision`) no se ve afectado: `tsc`,
`eslint` y los 163 tests siguen en verde; `supabase/functions/` queda fuera de ambos.

## Nota

El `REVISION_SECRET` que se puso en el primer intento apareció en una captura de pantalla. Conviene
regenerarlo (`supabase secrets set REVISION_SECRET=<otro>` + actualizar el secreto del Vault) al
retomar el despliegue.
