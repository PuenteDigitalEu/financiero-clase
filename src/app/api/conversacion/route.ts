import { NextResponse } from "next/server";

import { clienteSupabase } from "@/lib/supabase/server";
import { crearConversacion } from "@/lib/supabase/persistencia";

// Igual que app/api/chat/: necesita el runtime de Node para leer variables de entorno de servidor
// y usar el cliente de Supabase con la clave de servicio.
export const runtime = "nodejs";

/**
 * M-06: crea la conversación al aceptar el consentimiento de tratamiento de datos. Hasta esta
 * llamada no existe ninguna fila ni ningún dato personal — la pantalla de consentimiento la llama
 * al pulsar "Acepto y empiezo", antes de que exista el resto de la conversación.
 *
 * Sin body: `consentimiento_en` se marca con la hora del servidor en el momento de la llamada, no
 * con nada que mande el cliente (no hay nada que el visitante pueda falsear aquí).
 *
 * Pendiente a propósito, ver docs/roadmap.md: el límite de uso por IP (`limites_uso`) no se
 * comprueba todavía en esta ruta — es una feature aparte (ver
 * docs/features/consentimiento-y-persistencia.md → "Fuera de esta feature").
 */
export async function POST() {
  try {
    const supabase = clienteSupabase();
    const { token } = await crearConversacion(supabase);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error creando la conversación en /api/conversacion:", error);
    return NextResponse.json(
      { error: "No se pudo iniciar la conversación. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
