import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCrearConversacion = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  clienteSupabase: () => ({}),
}));

vi.mock("@/lib/supabase/persistencia", () => ({
  crearConversacion: (...args: unknown[]) => mockCrearConversacion(...args),
}));

const { POST } = await import("./route");

describe("POST /api/conversacion", () => {
  beforeEach(() => {
    mockCrearConversacion.mockReset();
  });

  it("devuelve el token de la conversación recién creada", async () => {
    mockCrearConversacion.mockResolvedValue({ id: "conv-1", token: "tok-1" });

    const res = await POST();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ token: "tok-1" });
  });

  it("nunca devuelve el id interno de la conversación, solo el token", async () => {
    mockCrearConversacion.mockResolvedValue({ id: "conv-1", token: "tok-1" });
    const res = await POST();
    const data = await res.json();
    expect(data).not.toHaveProperty("id");
  });

  it("devuelve 502 (no 500 sin explicación) si falla la creación", async () => {
    mockCrearConversacion.mockRejectedValue(new Error("boom"));
    const res = await POST();
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });
});
