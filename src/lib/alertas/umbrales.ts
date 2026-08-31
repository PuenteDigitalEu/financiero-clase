/**
 * umbrales.ts — Tipos de la capa de vigilancia de mercado y el descargo legal obligatorio.
 *
 * Los tipos corresponden columna a columna con las tablas de
 * `supabase/migrations/0002_alertas_de_mercado.sql`. Los campos que Postgres genera con DEFAULT
 * (`id`, `creado_en`) van como opcionales: la lógica de detección crea eventos antes de que
 * existan filas. No hay ningún nombre ni forma fuera de esa migración, salvo
 * `EventoDetectado.perfilObjetivo` — ver su comentario.
 */

// ── Enumerados (idénticos a los tipos ENUM de la migración 0002) ─────────────
export type ClaseActivo = 'liquidez' | 'renta_fija' | 'renta_variable' | 'oro';
export type DireccionMovimiento = 'caida' | 'subida';
export type EstadoAlerta = 'nueva' | 'vista' | 'descartada';
export type BandaProbabilidad = 'alta' | 'razonable' | 'fragil' | 'baja';

// Definidos en 001 (fichas.riesgo_perfil_derivado, informes.modo). Se replican aquí para que
// esta carpeta no dependa de lib/motor.
export type PerfilRiesgo = 'conservador' | 'moderado' | 'dinamico';
export type ModoAnalisis = 'completo' | 'condicionado' | 'suspendido';

// ── observaciones_mercado ───────────────────────────────────────────────────
export interface Observacion {
  id?: string;
  clase: ClaseActivo;
  /** DATE en ISO 'AAAA-MM-DD'. */
  fecha: string;
  nivel: number;
  fuente: string;
  creado_en?: string;
}

// ── reglas_alerta ───────────────────────────────────────────────────────────
export interface ReglaAlerta {
  id: string;
  nombre: string;
  clase: ClaseActivo;
  direccion: DireccionMovimiento;
  /** Tanto por uno: 0.03 = 3 %. */
  umbral: number;
  ventana_dias: number;
  /** null = la regla aplica a todos los perfiles. */
  perfil: PerfilRiesgo | null;
  activa: boolean;
  creado_en?: string;
}

// ── eventos_mercado ─────────────────────────────────────────────────────────
export interface EventoDetectado {
  id?: string;
  regla_id: string;
  clase: ClaseActivo;
  /** Tanto por uno, CON signo: negativo = caída, positivo = subida. */
  variacion: number;
  /** DATE ISO — observación del inicio de la ventana comparada. */
  desde: string;
  /** DATE ISO — última observación de la serie. */
  hasta: string;
  creado_en?: string;
  /**
   * Perfil al que apunta la regla que disparó el evento (= reglas_alerta.perfil).
   * NO es una columna de eventos_mercado: se arrastra aquí porque
   * `clientesAfectados(evento, clientes)` necesita conocerlo y su firma no recibe la regla.
   */
  perfilObjetivo: PerfilRiesgo | null;
}

// ── informes (subconjunto que necesita la capa de alertas) ───────────────────
export interface AnalisisCliente {
  id: string;
  modo: ModoAnalisis;
  /** informes.probabilidad (añadida en 0002). */
  probabilidad: number | null;
  /** informes.banda (añadida en 0002). */
  banda: BandaProbabilidad | null;
}

// ── clientes + su perfil (fichas) + su análisis (informes) ───────────────────
export interface ClienteConPlan {
  /** clientes.id */
  id: string;
  /** clientes.avisar_cliente (añadida en 0002). */
  avisar_cliente: boolean;
  /** fichas.riesgo_perfil_derivado — null si aún no se ha derivado. */
  perfil: PerfilRiesgo | null;
  /** Informe ligado al cliente, o null si no tiene análisis. */
  analisis: AnalisisCliente | null;
}

/**
 * Descargo legal obligatorio. Acompaña a todo mensaje que salga de esta capa; ningún texto de
 * `redactar.ts` puede sustituirlo ni omitirlo.
 */
export const DESCARGO_LEGAL = 'Esto no constituye asesoramiento de inversión.' as const;
