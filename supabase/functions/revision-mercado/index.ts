/**
 * revision-mercado — Edge Function (Deno) que ejecuta la revisión diaria de mercado (M-09).
 *
 * La dispara `pg_cron` (que solo sabe llamar a una URL), no una persona. Por eso NO usa el login
 * de Supabase: se protege con un secreto propio, `REVISION_SECRET`, que el cron manda en la
 * cabecera `Authorization: Bearer <secreto>` y esta función compara. La verificación de JWT de la
 * plataforma está desactivada (`verify_jwt = false` en `supabase/config.toml`, o `--no-verify-jwt`
 * al desplegar).
 *
 * Toda la lógica vive en `src/lib/alertas/revision-core.ts`, compartida sin duplicar con
 * `scripts/revision.ts`. Este archivo solo hace lo específico de la Edge Function: comprobar el
 * secreto, leer variables de entorno, montar el cliente de Supabase y devolver el resumen.
 *
 * Variables de entorno (secrets de la función):
 *   - REVISION_SECRET                 (obligatorio) — el secreto que autoriza la llamada.
 *   - SUPABASE_URL                    la plataforma lo inyecta sola.
 *   - SUPABASE_SERVICE_ROLE_KEY       la plataforma lo inyecta sola.
 *   - REVISION_ENVIAR_CORREO_CLIENTE  "true" para activar el correo al cliente (por defecto no).
 *   - RESEND_API_KEY / REVISION_EMAIL_FROM   solo si el correo al cliente está activo.
 */

// Especificador npm directo (Deno): así el bundler no depende del import map para el import de
// valor. El import map de `deno.json` sigue estando para el `import type` de revision-core.ts.
import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

import { ejecutarRevision } from '../../../src/lib/alertas/revision-core.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  const json = (cuerpo: unknown, status: number): Response =>
    new Response(JSON.stringify(cuerpo, null, 2), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // ── Autorización: secreto propio, no JWT de usuario ──────────────────────
  const secreto = Deno.env.get('REVISION_SECRET');
  if (!secreto) {
    return json({ error: 'REVISION_SECRET no está configurado en la función' }, 500);
  }
  if (req.headers.get('Authorization') !== `Bearer ${secreto}`) {
    return json({ error: 'No autorizado' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    return json({ error: 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY' }, 500);
  }

  const enviarCorreoCliente = Deno.env.get('REVISION_ENVIAR_CORREO_CLIENTE') === 'true';
  if (enviarCorreoCliente && !Deno.env.get('RESEND_API_KEY')) {
    return json({ error: 'REVISION_ENVIAR_CORREO_CLIENTE=true pero falta RESEND_API_KEY' }, 500);
  }

  try {
    const resumen = await ejecutarRevision({
      supabase: createClient(url, serviceRoleKey, { auth: { persistSession: false } }),
      enviarCorreoCliente,
      resendApiKey: enviarCorreoCliente ? (Deno.env.get('RESEND_API_KEY') ?? '') : '',
      emailFrom:
        Deno.env.get('REVISION_EMAIL_FROM')?.trim() ||
        'Asesoría · seguimiento <onboarding@resend.dev>',
    });
    return json(resumen, resumen.totales.correos_fallidos > 0 ? 500 : 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
