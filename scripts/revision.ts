/**
 * scripts/revision.ts — Envoltorio Node/tsx para ejecutar la revisión diaria de mercado (M-09)
 * A MANO en local. Toda la lógica vive en `src/lib/alertas/revision-core.ts` (compartida sin
 * duplicar con la Edge Function `supabase/functions/revision-mercado/`).
 *
 * Este archivo solo hace lo específico de Node: leer variables de entorno, montar el cliente de
 * Supabase, llamar a `ejecutarRevision`, imprimir el resumen en JSON y fijar el código de salida.
 *
 * Ejecutar:  pnpm revision       (carga .env.local si existe; en cron real, usa el entorno)
 * Ninguna credencial vive en el código: todo por variables de entorno (ver .env.example).
 */

import { createClient } from '@supabase/supabase-js';

import { ejecutarRevision } from '../src/lib/alertas/revision-core.ts';

function requerido(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Rellénala en .env.local (ver .env.example).`,
    );
  }
  return valor;
}

const enviarCorreoCliente = process.env.REVISION_ENVIAR_CORREO_CLIENTE === 'true';

const supabase = createClient(
  requerido('NEXT_PUBLIC_SUPABASE_URL'),
  requerido('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } },
);

ejecutarRevision({
  supabase,
  enviarCorreoCliente,
  resendApiKey: enviarCorreoCliente ? requerido('RESEND_API_KEY') : '',
  emailFrom:
    process.env.REVISION_EMAIL_FROM?.trim() || 'Asesoría · seguimiento <onboarding@resend.dev>',
})
  .then((resumen) => {
    console.log(JSON.stringify(resumen, null, 2));
    process.exitCode = resumen.totales.correos_fallidos > 0 ? 1 : 0;
  })
  .catch((err) => {
    console.error(err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
