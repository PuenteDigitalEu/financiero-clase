/**
 * parseo.ts — Convierte el texto de la ficha (contrato de `instrucciones-sistema.md`, líneas
 * `clave: valor [estado]`) en el tipo `Ficha` de `ficha.ts`.
 *
 * C16 de `instrucciones-motor.md`: una clave ausente o mal formada nunca se adivina — se trata
 * como `pendiente` y se reporta como anomalía. Este parser nunca lanza una excepción por un dato
 * raro; si algo no encaja, esa variable queda pendiente y sigue con el resto.
 */

import type {
  Dato,
  Deuda,
  DeudaInteresAltoDeclarado,
  Etiqueta,
  Ficha,
} from './ficha';

export interface ResultadoParseo {
  ficha: Ficha;
  /** Anomalías encontradas al parsear — se listan en el informe (§7, "Calidad del dato"). */
  anomalias: string[];
}

interface Campo {
  valor: string;
  /** `null` = la línea no traía `[confirmado|estimado|pendiente]` reconocible. */
  etiqueta: Etiqueta | null;
}

const CON_ETIQUETA = /^([a-z0-9_]+)\s*:\s*(.+?)\s*\[\s*(confirmado|estimado|pendiente)\s*\]\s*$/i;
const SIN_ETIQUETA = /^([a-z0-9_]+)\s*:\s*(.+)$/i;

function extraerCampos(texto: string): Map<string, Campo> {
  const campos = new Map<string, Campo>();
  for (const lineaCruda of texto.split('\n')) {
    const linea = lineaCruda.trim();
    if (!linea) continue;
    const conMatch = linea.match(CON_ETIQUETA);
    if (conMatch) {
      campos.set(conMatch[1].toLowerCase(), {
        valor: conMatch[2].trim(),
        etiqueta: conMatch[3].toLowerCase() as Etiqueta,
      });
      continue;
    }
    const sinMatch = linea.match(SIN_ETIQUETA);
    if (sinMatch) {
      campos.set(sinMatch[1].toLowerCase(), { valor: sinMatch[2].trim(), etiqueta: null });
    }
  }
  return campos;
}

const esNoFacilitado = (valor: string) => valor.trim().toLowerCase() === 'no_facilitado';

function datoTexto(campos: Map<string, Campo>, clave: string, anomalias: string[]): Dato<string> {
  const campo = campos.get(clave);
  if (!campo) {
    anomalias.push(`falta la clave "${clave}"`);
    return { valor: null, etiqueta: 'pendiente' };
  }
  if (campo.etiqueta === null) {
    anomalias.push(`"${clave}" sin etiqueta reconocida — tratada como estimado (§2)`);
  }
  if (esNoFacilitado(campo.valor)) {
    return { valor: null, etiqueta: 'pendiente' };
  }
  return { valor: campo.valor, etiqueta: campo.etiqueta ?? 'estimado' };
}

function datoNumero(campos: Map<string, Campo>, clave: string, anomalias: string[]): Dato<number> {
  const texto = datoTexto(campos, clave, anomalias);
  if (texto.valor === null) return { valor: null, etiqueta: texto.etiqueta };
  const limpio = texto.valor.replace(/[^\d,.-]/g, '').replace(',', '.');
  const numero = Number(limpio);
  if (limpio === '' || Number.isNaN(numero)) {
    anomalias.push(`"${clave}" no es un número reconocible: "${texto.valor}"`);
    return { valor: null, etiqueta: 'pendiente' };
  }
  return { valor: numero, etiqueta: texto.etiqueta };
}

/**
 * Como `datoNumero`, pero para los campos que el modelo de datos guarda como `integer`
 * (`edad`, `personas_a_cargo`). Si el valor trae decimales —p. ej. "59 y medio" que el agente
 * traduce a `59.5`— se redondea al entero más cercano y se anota como anomalía. Nunca se deja
 * pasar un decimal: la columna `integer` de Postgres lo rechazaría al guardar la ficha.
 */
function datoEntero(campos: Map<string, Campo>, clave: string, anomalias: string[]): Dato<number> {
  const dato = datoNumero(campos, clave, anomalias);
  if (dato.valor === null || Number.isInteger(dato.valor)) return dato;
  const redondeado = Math.round(dato.valor);
  anomalias.push(`"${clave}" venía con decimales (${dato.valor}); se redondea a ${redondeado}`);
  return { valor: redondeado, etiqueta: dato.etiqueta };
}

function datoEnum<T extends string>(
  campos: Map<string, Campo>,
  clave: string,
  valoresValidos: readonly T[],
  anomalias: string[],
): Dato<T> {
  const texto = datoTexto(campos, clave, anomalias);
  if (texto.valor === null) return { valor: null, etiqueta: texto.etiqueta };
  const normalizado = texto.valor.trim().toLowerCase() as T;
  if (!valoresValidos.includes(normalizado)) {
    anomalias.push(`"${clave}" = "${texto.valor}" no es uno de [${valoresValidos.join('|')}]`);
    return { valor: null, etiqueta: 'pendiente' };
  }
  return { valor: normalizado, etiqueta: texto.etiqueta };
}

/**
 * `fecha_entrevista` es el único campo del contrato sin etiqueta `[estado]` — nunca pasa por
 * `datoTexto`, que espera esa etiqueta. Si falta o no tiene forma de fecha, se anota como anomalía
 * y se deja en `null`: la persistencia decide entonces el respaldo operativo (fecha de hoy), no
 * este parser — no es un dato del cliente que se pueda "estimar".
 */
function fechaEntrevista(campos: Map<string, Campo>, anomalias: string[]): string | null {
  const campo = campos.get('fecha_entrevista');
  if (!campo) {
    anomalias.push('falta la clave "fecha_entrevista"');
    return null;
  }
  const valor = campo.valor.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    anomalias.push(`"fecha_entrevista" no tiene forma YYYY-MM-DD: "${valor}"`);
    return null;
  }
  return valor;
}

/**
 * `deudas_interes_alto_declarado` es distinto del resto: "no_facilitado" es uno de sus tres
 * valores válidos (no el marcador genérico de "sin dato"), así que no puede pasar por
 * `datoTexto` — ahí "no_facilitado" se convierte en `null`/`pendiente` a propósito para todos
 * los demás campos.
 */
function datoDeudaInteresAlto(
  campos: Map<string, Campo>,
  anomalias: string[],
): Dato<DeudaInteresAltoDeclarado> {
  const campo = campos.get('deudas_interes_alto_declarado');
  if (!campo) {
    anomalias.push('falta la clave "deudas_interes_alto_declarado"');
    return { valor: null, etiqueta: 'pendiente' };
  }
  const normalizado = campo.valor.trim().toLowerCase();
  if (normalizado !== 'si' && normalizado !== 'no' && normalizado !== 'no_facilitado') {
    anomalias.push(`"deudas_interes_alto_declarado" = "${campo.valor}" no reconocido`);
    return { valor: null, etiqueta: 'pendiente' };
  }
  return { valor: normalizado, etiqueta: campo.etiqueta ?? 'estimado' };
}

function parsearDeudas(campos: Map<string, Campo>, anomalias: string[]): Dato<Deuda[]> {
  const numeroCampo = campos.get('deudas_numero');
  if (!numeroCampo) {
    anomalias.push('falta "deudas_numero"');
    return { valor: null, etiqueta: 'pendiente' };
  }
  const n = Number(numeroCampo.valor.trim());
  if (!Number.isInteger(n) || n < 0) {
    anomalias.push(`"deudas_numero" no es un entero válido: "${numeroCampo.valor}"`);
    return { valor: null, etiqueta: 'pendiente' };
  }

  const deudas: Deuda[] = [];
  for (let i = 1; i <= n; i++) {
    deudas.push({
      tipo: datoTexto(campos, `deuda_${i}_tipo`, anomalias),
      importe: datoNumero(campos, `deuda_${i}_importe`, anomalias),
      cuota: datoNumero(campos, `deuda_${i}_cuota`, anomalias),
      interes: datoNumero(campos, `deuda_${i}_interes`, anomalias),
    });
  }
  // deudas_numero = 0 (C9): confirmado y vacío, no pendiente — "sin deudas" es un dato en sí.
  return { valor: deudas, etiqueta: 'confirmado' };
}

export function parsearFicha(texto: string): ResultadoParseo {
  const campos = extraerCampos(texto);
  const anomalias: string[] = [];

  const ficha: Ficha = {
    nombre: datoTexto(campos, 'nombre', anomalias),
    email: datoTexto(campos, 'email', anomalias),
    fechaEntrevista: fechaEntrevista(campos, anomalias),
    ingresosNetosMensual: datoNumero(campos, 'ingresos_netos_mensual', anomalias),
    ingresosEstabilidad: datoEnum(
      campos,
      'ingresos_estabilidad',
      ['estable', 'variable'] as const,
      anomalias,
    ),
    gastosFijosMensual: datoNumero(campos, 'gastos_fijos_mensual', anomalias),
    deudas: parsearDeudas(campos, anomalias),
    deudasInteresAltoDeclarado: datoDeudaInteresAlto(campos, anomalias),
    patrimonioLiquido: datoNumero(campos, 'patrimonio_liquido', anomalias),
    patrimonioInvertido: datoNumero(campos, 'patrimonio_invertido', anomalias),
    patrimonioDistribucion: datoTexto(campos, 'patrimonio_distribucion', anomalias),
    aportacionMensualActual: datoNumero(campos, 'aportacion_mensual_actual', anomalias),
    colchonMeses: datoNumero(campos, 'colchon_meses', anomalias),
    objetivoProposito: datoTexto(campos, 'objetivo_proposito', anomalias),
    objetivoImporte: datoNumero(campos, 'objetivo_importe', anomalias),
    objetivoPlazoAnios: datoNumero(campos, 'objetivo_plazo_anios', anomalias),
    riesgoToleranciaDeclarada: datoEnum(
      campos,
      'riesgo_tolerancia_declarada',
      ['baja', 'media', 'alta'] as const,
      anomalias,
    ),
    riesgoComportamientoReal: datoTexto(campos, 'riesgo_comportamiento_real', anomalias),
    riesgoPerfilDerivado: datoEnum(
      campos,
      'riesgo_perfil_derivado',
      ['conservador', 'moderado', 'dinamico'] as const,
      anomalias,
    ),
    edad: datoEntero(campos, 'edad', anomalias),
    personasACargo: datoEntero(campos, 'personas_a_cargo', anomalias),
    situacionLaboral: datoTexto(campos, 'situacion_laboral', anomalias),
  };

  return { ficha, anomalias };
}

/**
 * Heurística para detectar si un mensaje del agente es la ficha de cierre de la Fase 2 (y no una
 * pregunta normal de la entrevista): busca dos claves del contrato que no aparecen nunca sueltas
 * en una pregunta.
 */
export function contieneFicha(textoMensaje: string): boolean {
  return (
    /\bfecha_entrevista\s*:/i.test(textoMensaje) &&
    /\bingresos_netos_mensual\s*:/i.test(textoMensaje)
  );
}
