/**
 * evaluar.ts — Funciones PURAS de la capa de vigilancia: sin red, sin base de datos, sin IA.
 * Reciben datos ya cargados y devuelven decisiones deterministas. No mutan sus argumentos.
 */

import type {
  ClienteConPlan,
  EventoDetectado,
  Observacion,
  ReglaAlerta,
} from './umbrales';

/**
 * Fecha ISO 'AAAA-MM-DD' → número de días desde época, en UTC. Solo aritmética de calendario,
 * sin zona horaria ni objetos Date expuestos.
 */
function enDias(fechaIso: string): number {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia) / 86_400_000;
}

/**
 * Para cada regla activa, compara el último nivel de su clase de activo con el del inicio de su
 * ventana de días. Si hay menos histórico que la ventana, usa la observación más antigua
 * disponible. Devuelve un evento por cada regla cuya variación cruza el umbral en su dirección.
 *
 * El umbral está en tanto por uno (0.03 = 3 %). La `variacion` del evento se devuelve con signo
 * (negativa para una caída).
 */
export function detectarEventos(
  serie: Observacion[],
  reglas: ReglaAlerta[],
): EventoDetectado[] {
  const eventos: EventoDetectado[] = [];

  for (const regla of reglas) {
    if (!regla.activa) continue;

    const deClase = serie
      .filter((o) => o.clase === regla.clase)
      .sort((a, b) => enDias(a.fecha) - enDias(b.fecha));

    if (deClase.length === 0) continue;

    const ultimo = deClase[deClase.length - 1];
    const objetivo = enDias(ultimo.fecha) - regla.ventana_dias;

    // Inicio de la ventana: la observación más reciente cuya fecha no pasa del objetivo. Si no
    // hay ninguna tan antigua (menos histórico que la ventana), la más antigua disponible.
    const previas = deClase.filter((o) => enDias(o.fecha) <= objetivo);
    const inicio = previas.length > 0 ? previas[previas.length - 1] : deClase[0];

    if (inicio.nivel === 0) continue; // sin base para una variación relativa

    const variacion = (ultimo.nivel - inicio.nivel) / inicio.nivel;

    const cruza =
      regla.direccion === 'caida'
        ? variacion <= -regla.umbral
        : variacion >= regla.umbral;

    if (!cruza) continue;

    eventos.push({
      regla_id: regla.id,
      clase: regla.clase,
      variacion,
      desde: inicio.fecha,
      hasta: ultimo.fecha,
      perfilObjetivo: regla.perfil,
    });
  }

  return eventos;
}

/**
 * Filtra los clientes a los que afecta un evento, con tres exclusiones obligatorias:
 *   a) análisis en modo 'suspendido',
 *   b) sin análisis (no hay plan contra el que comparar),
 *   c) perfil distinto al de la regla — salvo que la regla no tenga perfil (aplica a todos).
 */
export function clientesAfectados(
  evento: EventoDetectado,
  clientes: ClienteConPlan[],
): ClienteConPlan[] {
  return clientes.filter((cliente) => {
    if (cliente.analisis === null) return false; // (b) sin análisis
    if (cliente.analisis.modo === 'suspendido') return false; // (a) suspendido
    if (evento.perfilObjetivo !== null && cliente.perfil !== evento.perfilObjetivo) {
      return false; // (c) perfil distinto y la regla apunta a un perfil concreto
    }
    return true;
  });
}
