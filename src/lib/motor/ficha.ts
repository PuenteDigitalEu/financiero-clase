/**
 * ficha.ts — El contrato de datos del sistema.
 *
 * Las claves son las mismas de `instrucciones-sistema.md` (contrato de la ficha) y de la tabla
 * `fichas`/`deudas` en `docs/data-model.md`. No renombrar sin actualizar los tres a la vez: el
 * motor, el parseo de la ficha en `app/api/chat/` y la fase 4 (redacción del plan) dependen de que
 * coincidan exactamente.
 */

/** Calidad del dato (R9). Decide el modo del informe. */
export type Etiqueta = 'confirmado' | 'estimado' | 'pendiente';

/** Un dato de la ficha nunca viaja solo: lleva su calidad. Sin ella no se puede decidir el modo. */
export interface Dato<T> {
  valor: T | null;
  etiqueta: Etiqueta;
}

export type EstabilidadIngresos = 'estable' | 'variable';
export type ToleranciaRiesgo = 'baja' | 'media' | 'alta';
export type DeudaInteresAltoDeclarado = 'si' | 'no' | 'no_facilitado';

export interface Deuda {
  tipo: string | null;
  importe: number | null;
  cuota: number | null;
}

export interface Ficha {
  nombre: Dato<string>;

  ingresosNetosMensual: Dato<number>;
  ingresosEstabilidad: Dato<EstabilidadIngresos>;
  gastosFijosMensual: Dato<number>;

  /**
   * R9 · Bloque 3 es el único de la entrevista con protocolo de insistencia — nunca se "no
   * preguntó". Por eso `etiqueta === 'pendiente'` aquí siempre implica negativa explícita del
   * cliente, y basta para determinar el modo `suspendido` (§4 de instrucciones-motor.md).
   */
  deudas: Dato<Deuda[]>;
  /** Fallback de C17 cuando `deudas` queda pendiente. No sustituye a `deudas`. */
  deudasInteresAltoDeclarado: Dato<DeudaInteresAltoDeclarado>;

  patrimonioLiquido: Dato<number>;
  patrimonioInvertido: Dato<number>;
  /** Reparto aproximado por clase de activo, en prosa. "no aplica" si patrimonioInvertido es 0. */
  patrimonioDistribucion: Dato<string>;
  aportacionMensualActual: Dato<number>;

  colchonMeses: Dato<number>;

  objetivoProposito: Dato<string>;
  /** Cifra en € totales si la meta es de patrimonio; null si es cualitativa. */
  objetivoImporte: Dato<number>;
  objetivoPlazoAnios: Dato<number>;

  riesgoToleranciaDeclarada: Dato<ToleranciaRiesgo>;
  /** "sin dato" si nunca vivió una caída real — prevalece sobre la tolerancia declarada (R3/C6). */
  riesgoComportamientoReal: Dato<string>;

  edad: Dato<number>;
  personasACargo: Dato<number>;
  situacionLaboral: Dato<string>;
}

/** §3 de instrucciones-motor.md · Clasificación de la meta. Determina si es convertible a patrimonio. */
export type TipoMeta = 'patrimonio' | 'renta_cartera' | 'renta_negocio' | 'mixta_ambigua';

/** §4 de instrucciones-motor.md · Modo del informe según la calidad del dato (R9). */
export type ModoInforme = 'completo' | 'condicionado' | 'suspendido';

/**
 * R9 · Variables críticas. Si alguna está `pendiente` (y no es el caso especial de deudas, que
 * suspende directamente), el informe no puede emitir propuesta ejecutable.
 */
export const VARIABLES_CRITICAS = [
  'ingresosNetosMensual',
  'gastosFijosMensual',
  'deudas',
  'colchonMeses',
  'patrimonioInvertido',
  'objetivoImporte',
  'objetivoPlazoAnios',
  'riesgoToleranciaDeclarada',
] as const satisfies ReadonlyArray<keyof Ficha>;

/**
 * §4 · Determina el modo del informe.
 *
 * La negativa del cliente a hablar de deudas no es «un dato menos»: suspende la recomendación
 * entera, porque sin ella el plan podría aconsejar invertir a alguien que primero debería cancelar
 * una deuda cara.
 */
export function determinarModo(ficha: Ficha): { modo: ModoInforme; faltantes: string[] } {
  if (ficha.deudas.etiqueta === 'pendiente') {
    return { modo: 'suspendido', faltantes: ['deudas'] };
  }

  const faltantes = VARIABLES_CRITICAS.filter(
    (clave) => (ficha[clave] as Dato<unknown>).etiqueta === 'pendiente',
  );

  return {
    modo: faltantes.length > 0 ? 'condicionado' : 'completo',
    faltantes: [...faltantes],
  };
}

/**
 * §3 · Clasifica el tipo de meta a partir de `objetivoProposito` y `situacionLaboral`.
 *
 * Heurística de texto simple y deliberadamente conservadora: ante la duda, `mixta_ambigua` — que
 * es justo el modo que obliga a no proyectar nada sin dejarlo dicho (§3 de instrucciones-motor.md).
 */
export function clasificarMeta(ficha: Ficha): TipoMeta {
  const objetivoImporteValido =
    ficha.objetivoImporte.etiqueta !== 'pendiente' && ficha.objetivoImporte.valor !== null;
  const plazoValido =
    ficha.objetivoPlazoAnios.etiqueta !== 'pendiente' && ficha.objetivoPlazoAnios.valor !== null;

  const proposito = (ficha.objetivoProposito.valor ?? '').toLowerCase();
  const laboral = (ficha.situacionLaboral.valor ?? '').toLowerCase();
  const textoNegocio = /negocio|autónomo|autonomo|empresa propia|mi empresa|facturación|facturacion/;

  const esRentaMensual = /renta|vivir de|al mes|mensual/.test(proposito) && !objetivoImporteValido;
  const esDeNegocio = textoNegocio.test(proposito) || textoNegocio.test(laboral);

  if (esDeNegocio) return 'renta_negocio';
  if (esRentaMensual) return 'renta_cartera';
  if (objetivoImporteValido && plazoValido) return 'patrimonio';
  return 'mixta_ambigua';
}
