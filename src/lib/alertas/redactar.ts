/**
 * redactar.ts — Traducción de un evento a lenguaje llano. DESCRIBE el hecho y nada más: nunca
 * recomienda comprar ni vender. El descargo legal vive en `umbrales.ts` (`DESCARGO_LEGAL`) y se
 * adjunta aparte, no lo genera esta función.
 */

import type { ClaseActivo, EventoDetectado } from './umbrales';

const SUJETO: Record<ClaseActivo, string> = {
  liquidez: 'La liquidez',
  renta_fija: 'La renta fija',
  renta_variable: 'La renta variable',
  oro: 'El oro',
};

/** '2026-01-05' → '05/01/2026'. Solo manipula la cadena: sin objetos Date ni zona horaria. */
function fechaLarga(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Tanto por uno con signo → porcentaje absoluto en formato español: -0.043 → '4,30 %'. */
function porcentaje(variacion: number): string {
  return `${(Math.abs(variacion) * 100).toFixed(2).replace('.', ',')} %`;
}

/**
 * Frase en español que describe el movimiento observado: qué clase de activo, cuánto se ha movido
 * y entre qué dos fechas. No emite ningún juicio ni recomendación.
 */
export function mensajeInterno(evento: EventoDetectado): string {
  const sujeto = SUJETO[evento.clase];
  const desde = fechaLarga(evento.desde);
  const hasta = fechaLarga(evento.hasta);

  if (evento.variacion === 0) {
    return `${sujeto} no ha variado entre el ${desde} y el ${hasta}.`;
  }

  const verbo = evento.variacion < 0 ? 'ha caído' : 'ha subido';
  return `${sujeto} ${verbo} un ${porcentaje(evento.variacion)} entre el ${desde} y el ${hasta}.`;
}
