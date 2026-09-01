/**
 * revision-core.ts — El cuerpo de la revisión diaria de mercado (M-09), sin nada específico de
 * un entorno de ejecución: recibe el cliente de Supabase y la config del correo ya montados y
 * DEVUELVE el resumen (no imprime, no lee variables de entorno, no termina el proceso).
 *
 * Lo usan dos envoltorios finos, sin duplicar nada:
 *   - `scripts/revision.ts` (Node/tsx) — para ejecutarlo a mano en local.
 *   - `supabase/functions/revision-mercado/` (Deno) — la Edge Function que dispara pg_cron.
 *
 * Qué hace, en orden:
 *   1. Descarga los cierres del último mes del S&P 500 (ETF SPY) de la API pública de Yahoo
 *      Finance y los guarda en `observaciones_mercado` con ON CONFLICT (clase, fecha) DO NOTHING.
 *   2. Lee las reglas activas y los clientes con su perfil, su modo y su análisis.
 *   3. Decide con `detectarEventos` + `clientesAfectados` (de `./evaluar`, sin duplicar la lógica).
 *   4. Registra el evento y una alerta por cliente afectado apoyándose en los UNIQUE de la
 *      migración 0002: reejecutar no crea nada nuevo.
 *   5. Envía un correo real SOLO por cada alerta recién insertada cuyo cliente tenga
 *      `avisar_cliente` — y solo si `enviarCorreoCliente` está activo.
 *   6. Devuelve el resumen.
 *
 * Los imports relativos llevan extensión `.ts` a propósito: Deno la exige y tsx la acepta.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { clientesAfectados, detectarEventos } from './evaluar.ts';
import { mensajeInterno } from './redactar.ts';
import { DESCARGO_LEGAL } from './umbrales.ts';
import type {
  BandaProbabilidad,
  ClaseActivo,
  ClienteConPlan,
  DireccionMovimiento,
  EventoDetectado,
  ModoAnalisis,
  Observacion,
  PerfilRiesgo,
  ReglaAlerta,
} from './umbrales.ts';

const CLASE_SP500: ClaseActivo = 'renta_variable';
const FUENTE = 'yahoo-finance:SPY';

// ── Config de entrada ───────────────────────────────────────────────────────
export interface OpcionesRevision {
  supabase: SupabaseClient;
  /** false = registra alertas pero no envía correo al cliente ni marca `avisado_cliente_en`. */
  enviarCorreoCliente: boolean;
  /** Solo se usa si `enviarCorreoCliente` es true. */
  resendApiKey: string;
  /** Remitente del correo al cliente. */
  emailFrom: string;
}

interface ConfigCorreo {
  resendApiKey: string;
  emailFrom: string;
}

// ── Resumen de salida ───────────────────────────────────────────────────────
export interface ResumenEvento {
  regla_id: string;
  clase: string;
  variacion: number;
  desde: string;
  hasta: string;
  evento_id: string;
  evento_nuevo: boolean;
  clientes_afectados: number;
  alertas_nuevas: number;
  alertas_existentes: number;
  correos_enviados: number;
  correos_fallidos: number;
  avisos_cliente_omitidos: number;
}

export interface ResumenRevision {
  ejecutado_en: string;
  fuente: string;
  observaciones: { descargadas: number; insertadas: number };
  reglas_activas: number;
  clientes_evaluados: number;
  correo_cliente_activo: boolean;
  eventos: ResumenEvento[];
  totales: {
    eventos_nuevos: number;
    alertas_nuevas: number;
    correos_enviados: number;
    correos_fallidos: number;
    avisos_cliente_omitidos: number;
  };
}

// ── 1. Descarga de Yahoo Finance ────────────────────────────────────────────
interface YahooChart {
  chart: {
    result:
      | Array<{
          timestamp?: number[];
          indicators: { quote: Array<{ close?: Array<number | null> }> };
        }>
      | null;
    error: unknown;
  };
}

interface Cierre {
  fecha: string;
  nivel: number;
}

async function descargarCierresSP500(): Promise<Cierre[]> {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/SPY?range=1mo&interval=1d';
  const res = await fetch(url, {
    headers: {
      // Yahoo rechaza el User-Agent por defecto de undici; cualquiera de navegador vale.
      'User-Agent': 'Mozilla/5.0 (revision-diaria; landing-agente-financiero) AppleWebKit/537.36',
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Yahoo Finance devolvió ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as YahooChart;
  const serie = json.chart.result?.[0];
  const timestamps = serie?.timestamp;
  const closes = serie?.indicators?.quote?.[0]?.close;
  if (!timestamps || !closes || timestamps.length === 0) {
    throw new Error('Respuesta de Yahoo Finance sin datos de cierre utilizables.');
  }

  // Un nivel por fecha (clave de observaciones_mercado); si Yahoo repitiera una fecha, gana el último.
  const porFecha = new Map<string, number>();
  for (let i = 0; i < timestamps.length; i++) {
    const nivel = closes[i];
    if (nivel == null || !Number.isFinite(nivel)) continue;
    const fecha = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
    porFecha.set(fecha, nivel);
  }
  return [...porFecha.entries()].map(([fecha, nivel]) => ({ fecha, nivel }));
}

// ── 2. Lectura de Supabase ──────────────────────────────────────────────────
interface ReglaRow {
  id: string;
  nombre: string;
  clase: string;
  direccion: string;
  umbral: number;
  ventana_dias: number;
  perfil: string | null;
  activa: boolean;
}
interface ObservacionRow {
  id: string;
  clase: string;
  fecha: string;
  nivel: number;
  fuente: string;
  creado_en: string;
}
interface ClienteRow {
  id: string;
  nombre: string | null;
  email: string;
  avisar_cliente: boolean;
}
interface InformeRow {
  id: string;
  modo: string;
  probabilidad: number | null;
  banda: string | null;
  created_at: string;
  fichas: {
    riesgo_perfil_derivado: string | null;
    conversaciones: { cliente_id: string } | null;
  } | null;
}

async function leerReglasActivas(supabase: SupabaseClient): Promise<ReglaAlerta[]> {
  const { data, error } = await supabase
    .from('reglas_alerta')
    .select('id, nombre, clase, direccion, umbral, ventana_dias, perfil, activa')
    .eq('activa', true)
    .returns<ReglaRow[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    clase: r.clase as ClaseActivo,
    direccion: r.direccion as DireccionMovimiento,
    umbral: Number(r.umbral),
    ventana_dias: Number(r.ventana_dias),
    perfil: (r.perfil as PerfilRiesgo | null) ?? null,
    activa: r.activa,
  }));
}

async function leerSerie(supabase: SupabaseClient, desdeIso: string): Promise<Observacion[]> {
  const { data, error } = await supabase
    .from('observaciones_mercado')
    .select('id, clase, fecha, nivel, fuente, creado_en')
    .gte('fecha', desdeIso)
    .order('fecha', { ascending: true })
    .returns<ObservacionRow[]>();
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    clase: o.clase as ClaseActivo,
    fecha: o.fecha,
    nivel: Number(o.nivel),
    fuente: o.fuente,
    creado_en: o.creado_en,
  }));
}

interface ClientePlanContacto {
  plan: ClienteConPlan;
  email: string;
  nombre: string | null;
}

async function leerClientesConPlan(supabase: SupabaseClient): Promise<ClientePlanContacto[]> {
  const { data: clientes, error: e1 } = await supabase
    .from('clientes')
    .select('id, nombre, email, avisar_cliente')
    .returns<ClienteRow[]>();
  if (e1) throw e1;

  const { data: informes, error: e2 } = await supabase
    .from('informes')
    .select(
      'id, modo, probabilidad, banda, created_at, fichas!inner(riesgo_perfil_derivado, conversaciones!inner(cliente_id))',
    )
    .order('created_at', { ascending: false })
    .returns<InformeRow[]>();
  if (e2) throw e2;

  // El "análisis" de un cliente = su informe más reciente; su perfil = el de la ficha de ese informe.
  const ultimoPorCliente = new Map<string, InformeRow>();
  for (const inf of informes ?? []) {
    const clienteId = inf.fichas?.conversaciones?.cliente_id;
    if (!clienteId) continue;
    if (!ultimoPorCliente.has(clienteId)) ultimoPorCliente.set(clienteId, inf);
  }

  return (clientes ?? []).map((c) => {
    const inf = ultimoPorCliente.get(c.id) ?? null;
    const plan: ClienteConPlan = {
      id: c.id,
      avisar_cliente: c.avisar_cliente,
      perfil: (inf?.fichas?.riesgo_perfil_derivado as PerfilRiesgo | null) ?? null,
      analisis: inf
        ? {
            id: inf.id,
            modo: inf.modo as ModoAnalisis,
            probabilidad: inf.probabilidad,
            banda: (inf.banda as BandaProbabilidad | null) ?? null,
          }
        : null,
    };
    return { plan, email: c.email, nombre: c.nombre };
  });
}

// ── 5. Correo al cliente ────────────────────────────────────────────────────
function porcentajeConSigno(variacion: number): string {
  const signo = variacion < 0 ? '−' : '+'; // menos tipográfico
  return `${signo}${(Math.abs(variacion) * 100).toFixed(2).replace('.', ',')} %`;
}

function diaES(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

function escaparHtml(texto: string): string {
  const mapa: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  };
  return texto.replace(/[&<>"]/g, (c) => mapa[c] ?? c);
}

function correoHtml(nombre: string | null, evento: EventoDetectado): string {
  const saludo = nombre ? `Hola, ${escaparHtml(nombre)}` : 'Hola';
  const pct = porcentajeConSigno(evento.variacion);
  const color = evento.variacion < 0 ? '#b3261e' : '#1b5e20';
  const frase = escaparHtml(mensajeInterno(evento));
  const descargo = escaparHtml(DESCARGO_LEGAL);
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f4f4f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;max-width:480px;width:100%;">
        <tr><td style="padding:28px 32px 4px;">
          <p style="margin:0 0 14px;font-size:15px;">${saludo},</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.5;">
            Ha habido un movimiento de mercado que tu plan tiene en cuenta. Te lo contamos para que estés al día.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:16px 32px 20px;">
          <div style="font-size:44px;font-weight:700;line-height:1;color:${color};letter-spacing:-1px;">${pct}</div>
          <div style="margin-top:6px;font-size:13px;color:#5b5b70;">renta variable &middot; del ${diaES(
            evento.desde,
          )} al ${diaES(evento.hasta)}</div>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="margin:0;font-size:15px;line-height:1.5;background:#f7f7fb;border-radius:8px;padding:14px 16px;">${frase}</p>
          <p style="margin:20px 0 0;font-size:15px;line-height:1.5;">
            Tu asesor ya lo ha visto y se pondrá en contacto contigo si hay algo que revisar. No necesitas hacer nada.
          </p>
        </td></tr>
        <tr><td style="padding:18px 32px 26px;border-top:1px solid #ececf2;">
          <p style="margin:0;font-size:12px;color:#8a8a9a;line-height:1.5;">${descargo}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function enviarCorreo(
  cfg: ConfigCorreo,
  destino: string,
  nombre: string | null,
  evento: EventoDetectado,
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: cfg.emailFrom,
      to: destino,
      subject: `Seguimiento de tu plan · renta variable ${porcentajeConSigno(evento.variacion)}`,
      html: correoHtml(nombre, evento),
      text: [
        mensajeInterno(evento),
        '',
        'Tu asesor ya lo ha visto y se pondrá en contacto contigo si hay algo que revisar.',
        '',
        DESCARGO_LEGAL,
      ].join('\n'),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend devolvió ${res.status}: ${await res.text()}`);
  }
}

// ── Utilidad de fechas ──────────────────────────────────────────────────────
function haceDias(dias: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

// ── Orquestación ────────────────────────────────────────────────────────────
export async function ejecutarRevision(opts: OpcionesRevision): Promise<ResumenRevision> {
  const { supabase, enviarCorreoCliente } = opts;
  const cfgCorreo: ConfigCorreo = { resendApiKey: opts.resendApiKey, emailFrom: opts.emailFrom };

  // 1. Descargar cierres y guardarlos (idempotente por UNIQUE (clase, fecha)).
  const cierres = await descargarCierresSP500();
  const filas = cierres.map((c) => ({
    clase: CLASE_SP500,
    fecha: c.fecha,
    nivel: c.nivel,
    fuente: FUENTE,
  }));
  const { data: insertadas, error: eUpsert } = await supabase
    .from('observaciones_mercado')
    .upsert(filas, { onConflict: 'clase,fecha', ignoreDuplicates: true })
    .select('fecha')
    .returns<Array<{ fecha: string }>>();
  if (eUpsert) throw eUpsert;

  // 2. Leer reglas activas, serie reciente y clientes con su plan.
  const [reglas, serie, clientes] = await Promise.all([
    leerReglasActivas(supabase),
    leerSerie(supabase, haceDias(40)),
    leerClientesConPlan(supabase),
  ]);
  const planes = clientes.map((c) => c.plan);
  const contactoPorId = new Map(clientes.map((c) => [c.plan.id, c]));

  // 3. Decidir (lógica importada, no duplicada).
  const eventos = detectarEventos(serie, reglas);

  // 4 + 5. Registrar eventos y alertas; avisar solo por lo recién insertado.
  const resumenEventos: ResumenEvento[] = [];
  let eventosNuevos = 0;
  let alertasNuevasTotal = 0;
  let correosEnviadosTotal = 0;
  let correosFallidosTotal = 0;
  let avisosOmitidosTotal = 0; // alertas nuevas de clientes con avisar_cliente, con el correo apagado

  for (const evento of eventos) {
    // 4a. Evento — UNIQUE (regla_id, hasta).
    const { data: evInsert, error: eEvento } = await supabase
      .from('eventos_mercado')
      .upsert(
        {
          regla_id: evento.regla_id,
          clase: evento.clase,
          variacion: evento.variacion,
          desde: evento.desde,
          hasta: evento.hasta,
        },
        { onConflict: 'regla_id,hasta', ignoreDuplicates: true },
      )
      .select('id')
      .returns<Array<{ id: string }>>();
    if (eEvento) throw eEvento;

    let eventoId: string;
    let eventoNuevo: boolean;
    if (evInsert && evInsert.length === 1) {
      eventoId = evInsert[0].id;
      eventoNuevo = true;
      eventosNuevos++;
    } else {
      const { data: previo, error: eBusca } = await supabase
        .from('eventos_mercado')
        .select('id')
        .eq('regla_id', evento.regla_id)
        .eq('hasta', evento.hasta)
        .limit(1)
        .returns<Array<{ id: string }>>();
      if (eBusca) throw eBusca;
      if (!previo || previo.length === 0) {
        throw new Error(
          `Evento no encontrado tras conflicto (regla ${evento.regla_id}, hasta ${evento.hasta}).`,
        );
      }
      eventoId = previo[0].id;
      eventoNuevo = false;
    }

    // 4b. Una alerta por cliente afectado — UNIQUE (evento_id, cliente_id).
    const afectados = clientesAfectados(evento, planes);
    const mensaje = mensajeInterno(evento);
    let alertasNuevas = 0;
    let alertasExistentes = 0;
    let correosEnviados = 0;
    let correosFallidos = 0;
    let avisosOmitidos = 0;

    for (const afectado of afectados) {
      const { data: alInsert, error: eAlerta } = await supabase
        .from('alertas')
        .upsert(
          {
            evento_id: eventoId,
            cliente_id: afectado.id,
            analisis_id: afectado.analisis?.id ?? null,
            estado: 'nueva',
            mensaje,
          },
          { onConflict: 'evento_id,cliente_id', ignoreDuplicates: true },
        )
        .select('id')
        .returns<Array<{ id: string }>>();
      if (eAlerta) throw eAlerta;

      const recienInsertada = !!alInsert && alInsert.length === 1;
      if (!recienInsertada) {
        alertasExistentes++;
        continue;
      }
      alertasNuevas++;
      alertasNuevasTotal++;

      // 5. Correo SOLO por alerta recién insertada y solo si el cliente lo pidió.
      if (!afectado.avisar_cliente) continue;

      if (!enviarCorreoCliente) {
        // Correo al cliente apagado: la alerta queda registrada, pero no se envía nada ni se
        // marca avisado_cliente_en. Se cuenta para que el resumen lo deje ver.
        avisosOmitidos++;
        avisosOmitidosTotal++;
        continue;
      }

      const contacto = contactoPorId.get(afectado.id);
      if (!contacto) continue;
      try {
        await enviarCorreo(cfgCorreo, contacto.email, contacto.nombre, evento);
        await supabase
          .from('alertas')
          .update({ avisado_cliente_en: new Date().toISOString() })
          .eq('id', alInsert[0].id);
        correosEnviados++;
        correosEnviadosTotal++;
      } catch (err) {
        correosFallidos++;
        correosFallidosTotal++;
        console.error(
          `Fallo al enviar el aviso al cliente ${afectado.id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    resumenEventos.push({
      regla_id: evento.regla_id,
      clase: evento.clase,
      variacion: evento.variacion,
      desde: evento.desde,
      hasta: evento.hasta,
      evento_id: eventoId,
      evento_nuevo: eventoNuevo,
      clientes_afectados: afectados.length,
      alertas_nuevas: alertasNuevas,
      alertas_existentes: alertasExistentes,
      correos_enviados: correosEnviados,
      correos_fallidos: correosFallidos,
      avisos_cliente_omitidos: avisosOmitidos,
    });
  }

  // 6. Resumen.
  return {
    ejecutado_en: new Date().toISOString(),
    fuente: FUENTE,
    observaciones: {
      descargadas: cierres.length,
      insertadas: insertadas?.length ?? 0,
    },
    reglas_activas: reglas.length,
    clientes_evaluados: planes.length,
    correo_cliente_activo: enviarCorreoCliente,
    eventos: resumenEventos,
    totales: {
      eventos_nuevos: eventosNuevos,
      alertas_nuevas: alertasNuevasTotal,
      correos_enviados: correosEnviadosTotal,
      correos_fallidos: correosFallidosTotal,
      avisos_cliente_omitidos: avisosOmitidosTotal,
    },
  };
}
