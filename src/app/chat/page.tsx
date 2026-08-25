import Link from "next/link";

/**
 * Placeholder — el chat real es M-02 del PRD (todavía sin construir: necesita
 * ANTHROPIC_API_KEY y SUPABASE_SERVICE_ROLE_KEY reales para funcionar de verdad).
 */
export default function ChatPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        El chat está en construcción
      </h1>
      <p className="max-w-md text-base text-text-secondary">
        Esta es la siguiente pieza del roadmap (M-02 del PRD) — la entrevista guiada por Claude
        todavía no está conectada.
      </p>
      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}
