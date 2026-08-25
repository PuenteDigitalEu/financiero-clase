"use client";

import { useState } from "react";

import { ChatBubble } from "./chat-bubble";
import { DisclosureBanner } from "./disclosure-banner";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

/**
 * M-02: entrevista guiada por chat. Sin estado en el servidor a propósito (ver
 * src/app/api/chat/route.ts) — el historial completo vive aquí, en el cliente, y se manda entero
 * en cada turno.
 *
 * Pendiente a propósito, ver docs/roadmap.md: el consentimiento explícito de M-06 debería ocurrir
 * antes de la pantalla de "Empezar" (hoy solo se ve el disclaimer regulatorio, que es un acto
 * distinto — ver instrucciones-sistema.md). Se añade cuando se construya M-06, sin cambiar este
 * componente por dentro.
 */
export function ChatWindow() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empezado, setEmpezado] = useState(false);

  /**
   * `historialParaApi` es lo que se manda a Claude (incluye el "Hola" sintético del arranque);
   * `mostrarDesde` es cuántos mensajes de ese historial ya estaban en pantalla antes de esta
   * llamada — así el "Hola" que dispara la apertura nunca se renderiza como burbuja del visitante.
   */
  async function enviarTurno(historialParaApi: Mensaje[], mostrarDesde: number) {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historialParaApi }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error ?? "Algo ha ido mal.");
      }
      setMensajes([...historialParaApi.slice(mostrarDesde), datos.message]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha ido mal. Recarga e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  function empezar() {
    setEmpezado(true);
    void enviarTurno([{ role: "user", content: "Hola" }], 1);
  }

  function handleEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = entrada.trim();
    if (!texto || cargando) return;
    const nuevoMensaje: Mensaje = { role: "user", content: texto };
    const historial = [...mensajes, nuevoMensaje];
    setMensajes(historial);
    setEntrada("");
    // El primer "Hola" no está en `mensajes` (se ocultó al empezar), así que hay que
    // reconstruirlo delante del historial visible para que Claude siga viendo la conversación
    // completa, aunque el visitante nunca la haya visto en pantalla.
    void enviarTurno([{ role: "user", content: "Hola" }, ...historial], historial.length + 1);
  }

  if (!empezado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <DisclosureBanner />
        <button
          onClick={empezar}
          className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent/90"
        >
          Empezar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        <DisclosureBanner />
        {mensajes.map((mensaje, indice) => (
          <ChatBubble
            key={indice}
            sender={mensaje.role === "assistant" ? "agent" : "visitor"}
            content={mensaje.content}
          />
        ))}
        {cargando && <p className="text-sm text-text-secondary">Escribiendo…</p>}
        {error && <p className="text-sm text-error">{error}</p>}
      </div>

      <form onSubmit={handleEnviar} className="flex gap-2 border-t border-surface p-4">
        <input
          value={entrada}
          onChange={(evento) => setEntrada(evento.target.value)}
          disabled={cargando}
          placeholder="Escribe tu respuesta…"
          className="flex-1 rounded-lg border border-surface px-4 py-2 text-[15px] focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={cargando || !entrada.trim()}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-white transition-colors disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
