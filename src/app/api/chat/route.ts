import type Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { clienteClaude, MODELO_ENTREVISTA } from "@/lib/claude/client";
import { cargarSystemPromptEntrevista } from "@/lib/claude/system-prompt";

// fs.readFileSync (en system-prompt.ts) necesita el runtime de Node, no Edge.
export const runtime = "nodejs";

interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

/**
 * Tope duro de turnos, muy por encima del ~15 que pide `plantilla-entrevista.md` — es una red de
 * seguridad del servidor (evita una conversación descontrolada), no el límite de uso por IP
 * (`docs/architecture.md` → "Protección contra abuso"), que todavía no está construido.
 */
const MAX_MENSAJES = 40;

/**
 * Fases 1-2 del flujo (`instrucciones-sistema.md`): conduce un turno de la entrevista.
 *
 * Sin estado en el servidor a propósito: el cliente manda el historial completo en cada turno y
 * el servidor solo llama a Claude con ese historial + el system prompt. Así `M-02` no depende de
 * `M-04` (persistencia en Supabase) para poder probarse — la persistencia se añade encima de este
 * mismo contrato sin cambiarlo.
 *
 * Pendiente a propósito, ver docs/roadmap.md: comprobar consentimiento (`M-06`) y límite de uso
 * antes de procesar el turno. Se añaden a esta misma ruta cuando se construyan — no se han
 * simulado aquí para no dar una falsa sensación de que ya están.
 */
export async function POST(request: Request) {
  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const mensajes = validarMensajes(body.messages);
  if (!mensajes) {
    return NextResponse.json(
      { error: 'El cuerpo debe incluir "messages": [{ role, content }, ...].' },
      { status: 400 },
    );
  }
  if (mensajes.length === 0) {
    return NextResponse.json({ error: "La conversación no puede empezar vacía." }, { status: 400 });
  }
  if (mensajes.length > MAX_MENSAJES) {
    return NextResponse.json(
      { error: "Esta conversación ha alcanzado su límite de turnos." },
      { status: 400 },
    );
  }

  try {
    const claude = clienteClaude();
    const respuesta = await claude.messages.create({
      model: MODELO_ENTREVISTA,
      max_tokens: 1024,
      system: cargarSystemPromptEntrevista(),
      messages: mensajes,
    });

    const texto = respuesta.content
      .filter((bloque): bloque is Anthropic.TextBlock => bloque.type === "text")
      .map((bloque) => bloque.text)
      .join("\n");

    return NextResponse.json({ message: { role: "assistant", content: texto } });
  } catch (error) {
    console.error("Error llamando a Claude en /api/chat:", error);
    return NextResponse.json(
      { error: "No se pudo procesar el mensaje. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}

function validarMensajes(valor: unknown): MensajeChat[] | null {
  if (!Array.isArray(valor)) return null;
  const validos = valor.every(
    (m): m is MensajeChat =>
      typeof m === "object" &&
      m !== null &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string",
  );
  return validos ? (valor as MensajeChat[]) : null;
}
