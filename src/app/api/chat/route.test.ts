import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();

// Mockeado a propósito: esto verifica la LÓGICA de la ruta (validación, tope de turnos, manejo
// de errores) sin necesitar una ANTHROPIC_API_KEY real. Lo único que este archivo NO prueba es
// si la llamada real a Claude funciona — eso solo se verifica en local con una clave de verdad
// (ver docs/roadmap.md).
vi.mock("@/lib/claude/client", () => ({
  clienteClaude: () => ({ messages: { create: mockCreate } }),
  MODELO_ENTREVISTA: "claude-sonnet-5",
}));

vi.mock("@/lib/claude/system-prompt", () => ({
  cargarSystemPromptEntrevista: () => "system prompt de prueba",
}));

const { POST } = await import("./route");

function req(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("rechaza JSON inválido", async () => {
    const res = await POST(
      new Request("http://localhost/api/chat", { method: "POST", body: "{invalido" }),
    );
    expect(res.status).toBe(400);
  });

  it('rechaza si "messages" no es un array', async () => {
    const res = await POST(req({ messages: "hola" }));
    expect(res.status).toBe(400);
  });

  it("rechaza mensajes con role inválido", async () => {
    const res = await POST(req({ messages: [{ role: "system", content: "x" }] }));
    expect(res.status).toBe(400);
  });

  it("rechaza mensajes sin content de tipo string", async () => {
    const res = await POST(req({ messages: [{ role: "user", content: 42 }] }));
    expect(res.status).toBe(400);
  });

  it("rechaza conversación vacía", async () => {
    const res = await POST(req({ messages: [] }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rechaza por encima del tope de turnos", async () => {
    const mensajes = Array.from({ length: 41 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: "x",
    }));
    const res = await POST(req({ messages: mensajes }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("acepta justo en el tope de turnos", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
    const mensajes = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: "x",
    }));
    const res = await POST(req({ messages: mensajes }));
    expect(res.status).toBe(200);
  });

  it("llama a Claude con el system prompt correcto y devuelve su respuesta", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Hola, ¿cómo te llamas?" }],
    });
    const res = await POST(req({ messages: [{ role: "user", content: "Hola" }] }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toEqual({ role: "assistant", content: "Hola, ¿cómo te llamas?" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-5",
        system: "system prompt de prueba",
        messages: [{ role: "user", content: "Hola" }],
      }),
    );
  });

  it("concatena solo los bloques de texto de una respuesta con varios bloques", async () => {
    mockCreate.mockResolvedValue({
      content: [
        { type: "text", text: "Primera parte." },
        { type: "text", text: "Segunda parte." },
      ],
    });
    const res = await POST(req({ messages: [{ role: "user", content: "Hola" }] }));
    const data = await res.json();
    expect(data.message.content).toBe("Primera parte.\nSegunda parte.");
  });

  it("devuelve 502 (no 500 sin explicación) si la llamada a Claude falla", async () => {
    mockCreate.mockRejectedValue(new Error("boom"));
    const res = await POST(req({ messages: [{ role: "user", content: "Hola" }] }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  describe("cuando el mensaje del agente trae la ficha de cierre", () => {
    const FICHA_MINIMA = `
nombre: Silvia [confirmado]
fecha_entrevista: 2026-08-25

ingresos_netos_mensual: 2800 [confirmado]
ingresos_estabilidad: estable [confirmado]
gastos_fijos_mensual: 1600 [confirmado]

deudas_numero: 1
deuda_1_tipo: hipoteca [confirmado]
deuda_1_importe: 150000 [confirmado]
deuda_1_cuota: 620 [confirmado]
deuda_1_interes: 1.9 [confirmado]
deudas_interes_alto_declarado: no [confirmado]

patrimonio_liquido: 12000 [confirmado]
patrimonio_invertido: 10000 [confirmado]
patrimonio_distribucion: todo en un fondo indexado [confirmado]
aportacion_mensual_actual: 150 [confirmado]

colchon_meses: 5 [confirmado]

objetivo_proposito: bajar el ritmo a los 60 [confirmado]
objetivo_importe: 150000 [confirmado]
objetivo_plazo_anios: 20 [confirmado]

riesgo_tolerancia_declarada: media [confirmado]
riesgo_comportamiento_real: aguantó la caída del covid sin vender [confirmado]
riesgo_perfil_derivado: moderado [confirmado]

edad: 40 [confirmado]
personas_a_cargo: 0 [confirmado]
situacion_laboral: diseñadora gráfica en plantilla [confirmado]
`;

    it("no enseña el volcado en crudo: calcula el informe y devuelve el plan redactado", async () => {
      mockCreate
        .mockResolvedValueOnce({ content: [{ type: "text", text: FICHA_MINIMA }] })
        .mockResolvedValueOnce({ content: [{ type: "text", text: "## Tu meta\n..." }] });

      const res = await POST(req({ messages: [{ role: "user", content: "ya está" }] }));

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message.content).toBe("## Tu meta\n...");
      expect(data.message.content).not.toContain("ingresos_netos_mensual");
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it("la segunda llamada (redacción del plan) usa un system prompt distinto al de la entrevista", async () => {
      mockCreate
        .mockResolvedValueOnce({ content: [{ type: "text", text: FICHA_MINIMA }] })
        .mockResolvedValueOnce({ content: [{ type: "text", text: "plan" }] });

      await POST(req({ messages: [{ role: "user", content: "ya está" }] }));

      const segundaLlamada = mockCreate.mock.calls[1][0];
      expect(segundaLlamada.system).not.toBe("system prompt de prueba");
      expect(segundaLlamada.system).toContain("Entrega del plan al visitante");
    });

    it("si falla la llamada de redacción del plan, responde 502", async () => {
      mockCreate
        .mockResolvedValueOnce({ content: [{ type: "text", text: FICHA_MINIMA }] })
        .mockRejectedValueOnce(new Error("boom"));

      const res = await POST(req({ messages: [{ role: "user", content: "ya está" }] }));
      expect(res.status).toBe(502);
    });
  });
});
