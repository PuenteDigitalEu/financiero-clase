import { describe, expect, it } from 'vitest';

import { clientesAfectados, detectarEventos } from './evaluar';
import { mensajeInterno } from './redactar';
import type {
  ClienteConPlan,
  ModoAnalisis,
  Observacion,
  PerfilRiesgo,
  ReglaAlerta,
} from './umbrales';

// ── Fixtures ────────────────────────────────────────────────────────────────
let contador = 0;
const obs = (
  fecha: string,
  nivel: number,
  clase: Observacion['clase'] = 'renta_variable',
): Observacion => ({
  id: `obs-${++contador}`,
  clase,
  fecha,
  nivel,
  fuente: 'test',
  creado_en: `${fecha}T00:00:00.000Z`,
});

const reglaCaidaRV5d = (
  umbral: number,
  perfil: ReglaAlerta['perfil'] = 'moderado',
): ReglaAlerta => ({
  id: `regla-${umbral}-${perfil ?? 'todos'}`,
  nombre: `Caída RV 5d ${umbral}`,
  clase: 'renta_variable',
  direccion: 'caida',
  umbral,
  ventana_dias: 5,
  perfil,
  activa: true,
});

/** `modo` undefined → análisis en modo 'completo'; `modo: null` → cliente sin análisis. */
const cliente = (opts: {
  id?: string;
  perfil?: PerfilRiesgo | null;
  modo?: ModoAnalisis | null;
} = {}): ClienteConPlan => ({
  id: opts.id ?? 'cli-1',
  avisar_cliente: true,
  perfil: opts.perfil === undefined ? 'moderado' : opts.perfil,
  analisis:
    opts.modo === null
      ? null
      : { id: 'inf-1', modo: opts.modo ?? 'completo', probabilidad: null, banda: null },
});

// ── detectarEventos ─────────────────────────────────────────────────────────
describe('detectarEventos', () => {
  it('un día tranquilo no genera ningún evento', () => {
    const serie = [
      obs('2026-01-01', 100),
      obs('2026-01-02', 100.2),
      obs('2026-01-03', 99.9),
      obs('2026-01-04', 100.1),
      obs('2026-01-05', 100.0),
      obs('2026-01-06', 100.3),
    ];
    expect(detectarEventos(serie, [reglaCaidaRV5d(0.03)])).toEqual([]);
  });

  it('una caída por encima del umbral genera un evento con la variación firmada', () => {
    const serie = [obs('2026-01-01', 100), obs('2026-01-06', 95)]; // -5 % en 5 días
    const eventos = detectarEventos(serie, [reglaCaidaRV5d(0.03)]);

    expect(eventos).toHaveLength(1);
    expect(eventos[0].regla_id).toBe('regla-0.03-moderado');
    expect(eventos[0].clase).toBe('renta_variable');
    expect(eventos[0].variacion).toBeCloseTo(-0.05, 10);
    expect(eventos[0].desde).toBe('2026-01-01');
    expect(eventos[0].hasta).toBe('2026-01-06');
    expect(eventos[0].perfilObjetivo).toBe('moderado');
  });

  it('una caída que no llega al umbral no genera evento', () => {
    const serie = [obs('2026-01-01', 100), obs('2026-01-06', 98)]; // -2 %
    expect(detectarEventos(serie, [reglaCaidaRV5d(0.03)])).toEqual([]);
  });

  it('ignora las reglas inactivas', () => {
    const serie = [obs('2026-01-01', 100), obs('2026-01-06', 90)]; // -10 %
    const inactiva = { ...reglaCaidaRV5d(0.03), activa: false };
    expect(detectarEventos(serie, [inactiva])).toEqual([]);
  });

  it('con menos histórico que la ventana usa la observación más antigua disponible', () => {
    const serie = [obs('2026-01-04', 100), obs('2026-01-06', 94)]; // 2 días de histórico, ventana 5
    const eventos = detectarEventos(serie, [reglaCaidaRV5d(0.05)]);

    expect(eventos).toHaveLength(1);
    expect(eventos[0].desde).toBe('2026-01-04');
    expect(eventos[0].variacion).toBeCloseTo(-0.06, 10);
  });

  it('varias reglas de la misma clase disparan un evento cada una', () => {
    const serie = [obs('2026-01-01', 100), obs('2026-01-06', 95)]; // -5 %
    const eventos = detectarEventos(serie, [
      reglaCaidaRV5d(0.03, 'conservador'),
      reglaCaidaRV5d(0.04, 'moderado'),
      reglaCaidaRV5d(0.06, 'dinamico'), // no cruza: -5 % < 6 %
    ]);
    expect(eventos.map((e) => e.regla_id)).toEqual([
      'regla-0.03-conservador',
      'regla-0.04-moderado',
    ]);
  });
});

// ── clientesAfectados ───────────────────────────────────────────────────────
describe('clientesAfectados', () => {
  const [evento] = detectarEventos(
    [obs('2026-01-01', 100), obs('2026-01-06', 95)],
    [reglaCaidaRV5d(0.03, 'moderado')],
  );

  it('incluye a un cliente con análisis vigente y perfil coincidente', () => {
    const c = cliente({ perfil: 'moderado', modo: 'completo' });
    expect(clientesAfectados(evento, [c])).toEqual([c]);
  });

  it('excluye al cliente con el análisis suspendido', () => {
    const c = cliente({ perfil: 'moderado', modo: 'suspendido' });
    expect(clientesAfectados(evento, [c])).toEqual([]);
  });

  it('excluye al cliente sin análisis', () => {
    const c = cliente({ perfil: 'moderado', modo: null });
    expect(clientesAfectados(evento, [c])).toEqual([]);
  });

  it('excluye al cliente de perfil distinto al de la regla', () => {
    const c = cliente({ perfil: 'conservador', modo: 'completo' });
    expect(clientesAfectados(evento, [c])).toEqual([]);
  });

  it('una regla sin perfil aplica a cualquier perfil', () => {
    const [eventoSinPerfil] = detectarEventos(
      [obs('2026-01-01', 100), obs('2026-01-06', 95)],
      [reglaCaidaRV5d(0.03, null)],
    );
    const conservador = cliente({ id: 'cli-c', perfil: 'conservador', modo: 'completo' });
    const dinamico = cliente({ id: 'cli-d', perfil: 'dinamico', modo: 'completo' });
    expect(clientesAfectados(eventoSinPerfil, [conservador, dinamico])).toEqual([
      conservador,
      dinamico,
    ]);
  });
});

// ── mensajeInterno ──────────────────────────────────────────────────────────
describe('mensajeInterno', () => {
  const [evento] = detectarEventos(
    [obs('2026-01-01', 100), obs('2026-01-06', 95.7)], // -4,3 %
    [reglaCaidaRV5d(0.03)],
  );

  it('describe el hecho con el porcentaje y las dos fechas', () => {
    expect(mensajeInterno(evento)).toBe(
      'La renta variable ha caído un 4,30 % entre el 01/01/2026 y el 06/01/2026.',
    );
  });

  it('nunca recomienda comprar ni vender', () => {
    const texto = mensajeInterno(evento).toLowerCase();
    for (const prohibida of ['compr', 'vend', 'recomend', 'deberías', 'aconsej']) {
      expect(texto).not.toContain(prohibida);
    }
  });
});
