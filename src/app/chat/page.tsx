import { ChatWindow } from "@/components/chat/chat-window";

export default function ChatPage() {
  return (
    // Altura fija a la ventana (no min-h-full, que hereda body y deja crecer la página entera):
    // así el único que hace scroll es el área de mensajes de ChatWindow, y el cuadro de texto
    // (fuera de esa zona, fijo debajo) nunca queda fuera de la vista.
    <main className="flex h-dvh flex-col overflow-hidden bg-surface">
      <ChatWindow />
    </main>
  );
}
