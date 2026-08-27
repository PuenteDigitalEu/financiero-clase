"use client";

import { useState } from "react";

import { ChatBubble } from "./chat-bubble";
import { ConsentScreen } from "./consent-screen";
import { DisclosureBanner } from "./disclosure-banner";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

/**
 * M-02 + M-06: entrevista guiada por chat, detrás del consentimiento de tratamiento de datos.
 * Sin estado adicional en el cliente más allá del `token` de sesión (ver
 * src/app/api/chat/route.ts) — el historial completo de mensajes sigue viviendo aquí y se manda
 * entero en cada turno; lo único que cambia es que ahora cada turno viaja con el `token` que
 * autoriza al servidor a escribir en esa conversación concreta.
 *
 * El `token` vive solo en este estado de React, nunca en `localStorage` (ver
 * docs/features/consentimiento-y-persistencia.md → "Decisiones tomadas"): recargar la página
 * pierde el hilo, a propósito — no hay forma de recuperar una conversación anterior en esta
 * versión (`C-01` queda fuera del MVP).
 */
export function ChatWindow() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * `historialParaApi` es lo que se manda a Claude (incluye el "Hola" sintético del arranque);
   * `mostrarDesde` es cuántos mensajes de ese historial ya estaban en pantalla antes de esta
   * llamada — así el "Hola" que dispara la apertura nunca se renderiza como burbuja del visitante.
   */
  async function enviarTurno(tokenActivo: string, historialParaApi: Mensaje[], mostrarDesde: number) {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenActivo, messages: historialParaApi }),
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

  /**
   * M-06: al aceptar, crea la conversación (consentimiento + token) y arranca la entrevista con
   * ese mismo token. Sin este paso no existe ninguna fila en `conversaciones` — ver
   * `docs/user-flows.md` → FLOW-01.
   */
  async function aceptarConsentimiento() {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/conversacion", { method: "POST" });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error ?? "No se pudo iniciar la conversación.");
      }
      setToken(datos.token as string);
      void enviarTurno(datos.token as string, [{ role: "user", content: "Hola" }], 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha ido mal. Recarga e inténtalo de nuevo.");
      setCargando(false);
    }
  }

  function handleEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = entrada.trim();
    if (!texto || cargando || !token) return;
    const nuevoMensaje: Mensaje = { role: "user", content: texto };
    const historial = [...mensajes, nuevoMensaje];
    setMensajes(historial);
    setEntrada("");
    // El primer "Hola" no está en `mensajes` (se ocultó al empezar), así que hay que
    // reconstruirlo delante del historial visible para que Claude siga viendo la conversación
    // completa, aunque el visitante nunca la haya visto en pantalla.
    void enviarTurno(token, [{ role: "user", content: "Hola" }, ...historial], historial.length + 1);
  }

  if (!token) {
    return <ConsentScreen onAceptar={() => void aceptarConsentimiento()} cargando={cargando} error={error} />;
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
