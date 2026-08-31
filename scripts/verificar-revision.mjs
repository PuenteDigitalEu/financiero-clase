#!/usr/bin/env node
/**
 * Verifica, contra un Postgres real (PGlite, WASM — no un mock), el contrato de escritura de la
 * revisión diaria de mercado (M-09, `scripts/revision.ts`): que las tres inserciones idempotentes
 * que hace el script —observación, evento, alerta— se comportan como deben contra el esquema real
 * de `supabase/migrations/0002_alertas_de_mercado.sql`.
 *
 * Qué SÍ prueba:
 *   - los 3 `unique` de idempotencia (`observaciones_mercado(clase,fecha)`,
 *     `eventos_mercado(regla_id,hasta)`, `alertas(evento_id,cliente_id)`) hacen que reinsertar la
 *     misma fila con `on conflict do nothing` no cree duplicados;
 *   - las claves foráneas y los enums rechazan lo que deben rechazar.
 *
 * Qué NO prueba: que `revision.ts` genere exactamente este SQL (eso es un script sin tests
 * propios — ver la ficha), ni la lógica de `detectarEventos`/`clientesAfectados` (la cubre
 * `src/lib/alertas/evaluar.test.ts`), ni la descarga real de Yahoo Finance. Las sentencias de aquí
 * abajo se mantienen a mano en paralelo a `scripts/revision.ts`: si el script cambia una columna o
 * un `onConflict`, este archivo hay que actualizarlo también.
 *
 * No corre en CI (descarga el WASM de PGlite y tarda unos segundos) — se ejecuta a mano antes de
 * cerrar la feature, igual que `verificar-persistencia.mjs`.
 *
 * Uso:  node scripts/verificar-revision.mjs
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACIONES = [
  join(RAIZ, 'supabase', 'migrations', '001_esquema_inicial.sql'),
  join(RAIZ, 'supabase', 'migrations', '0002_alertas_de_mercado.sql'),
];

let fallos = 0;
const ok = (d) => console.log(`  OK  ${d}`);
const fallo = (d, detalle) => {
  fallos++;
  console.log(`  FALLO  ${d}`);
  if (detalle) console.log(`         ${detalle}`);
};

async function esperarError(descripcion, accion) {
  try {
    await accion();
    fallo(descripcion, 'se esperaba que la escritura fallara, y no falló');
  } catch {
    ok(descripcion);
  }
}

/** Reproduce la inserción idempotente de revision.ts: insert ... on conflict (<cols>) do nothing. */
async function insertarIdempotente(db, tabla, fila, conflicto) {
  const cols = Object.keys(fila);
  const params = cols.map((_, i) => `$${i + 1}`);
  const res = await db.query(
    `insert into ${tabla} (${cols.join(', ')}) values (${params.join(', ')})
     on conflict (${conflicto}) do nothing
     returning id`,
    Object.values(fila),
  );
  return res.rows.length; // 1 si insertó, 0 si el conflicto lo ignoró
}

async function contar(db, tabla, whereSql, params) {
  const res = await db.query(`select count(*)::int as n from ${tabla} where ${whereSql}`, params);
  return res.rows[0].n;
}

async function main() {
  const db = new PGlite();

  // Supabase provee auth.users/auth.uid()/los tres roles de forma nativa; PGlite no.
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid());
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create role authenticated;
    create role anon;
    create role service_role;
  `);

  for (const ruta of MIGRACIONES) {
    await db.exec(readFileSync(ruta, 'utf-8'));
  }
  console.log('Migraciones 001 + 0002 aplicadas sin errores.\n');

  // ── Contexto mínimo: un cliente con análisis vigente de perfil moderado ─────────────────────
  const { rows: [cli] } = await db.query(
    `insert into clientes (nombre, email, avisar_cliente) values ('Cliente Test', 'ct@example.com', true)
     returning id`,
  );
  const { rows: [conv] } = await db.query(
    `insert into conversaciones (cliente_id, consentimiento_en) values ($1, now()) returning id`,
    [cli.id],
  );
  const { rows: [fic] } = await db.query(
    `insert into fichas (conversacion_id, fecha_entrevista, riesgo_perfil_derivado, riesgo_perfil_derivado_estado)
     values ($1, '2026-08-31', 'moderado', 'confirmado') returning id`,
    [conv.id],
  );
  const { rows: [inf] } = await db.query(
    `insert into informes (ficha_id, modo, contenido, pendientes_reunion, version_motor, version_reglas)
     values ($1, 'completo', '{}', '[]', '0.1.0', '2026-08-06') returning id`,
    [fic.id],
  );
  const { rows: [regla] } = await db.query(
    `select id from reglas_alerta where perfil = 'moderado' limit 1`,
  );
  ok('contexto: cliente + conversación + ficha (perfil moderado) + informe (modo completo)');
  ok(`siembra: la regla de perfil moderado existe (id ${regla.id.slice(0, 8)}…)`);

  // ── 1. observaciones_mercado: unique (clase, fecha) ────────────────────────────────────────
  console.log('\nIdempotencia de observaciones_mercado (clase, fecha):');
  const obs = { clase: 'renta_variable', fecha: '2026-08-26', nivel: 100, fuente: 'test' };
  const ins1 = await insertarIdempotente(db, 'observaciones_mercado', obs, 'clase,fecha');
  const ins2 = await insertarIdempotente(db, 'observaciones_mercado', obs, 'clase,fecha');
  const nObs = await contar(db, 'observaciones_mercado', 'clase = $1 and fecha = $2', [
    obs.clase,
    obs.fecha,
  ]);
  if (ins1 === 1 && ins2 === 0 && nObs === 1) {
    ok('reinsertar la misma (clase, fecha) con on conflict do nothing no duplica (1 → 0, total 1)');
  } else {
    fallo('la reinserción de observación debería ser 1 → 0 y dejar 1 fila', `ins1=${ins1} ins2=${ins2} total=${nObs}`);
  }

  // ── 2. eventos_mercado: unique (regla_id, hasta) ──────────────────────────────────────────
  console.log('\nIdempotencia de eventos_mercado (regla_id, hasta):');
  const evento = {
    regla_id: regla.id,
    clase: 'renta_variable',
    variacion: -0.05,
    desde: '2026-08-21',
    hasta: '2026-08-26',
  };
  const ev1 = await insertarIdempotente(db, 'eventos_mercado', evento, 'regla_id,hasta');
  const ev2 = await insertarIdempotente(db, 'eventos_mercado', evento, 'regla_id,hasta');
  const nEv = await contar(db, 'eventos_mercado', 'regla_id = $1 and hasta = $2', [
    evento.regla_id,
    evento.hasta,
  ]);
  if (ev1 === 1 && ev2 === 0 && nEv === 1) {
    ok('reinsertar el mismo (regla_id, hasta) no crea un segundo evento (1 → 0, total 1)');
  } else {
    fallo('la reinserción de evento debería ser 1 → 0 y dejar 1 fila', `ev1=${ev1} ev2=${ev2} total=${nEv}`);
  }
  const { rows: [ev] } = await db.query(
    `select id from eventos_mercado where regla_id = $1 and hasta = $2`,
    [evento.regla_id, evento.hasta],
  );

  // ── 3. alertas: unique (evento_id, cliente_id) ────────────────────────────────────────────
  console.log('\nIdempotencia de alertas (evento_id, cliente_id):');
  const alerta = {
    evento_id: ev.id,
    cliente_id: cli.id,
    analisis_id: inf.id,
    estado: 'nueva',
    mensaje: 'La renta variable ha caído un 5,00 % entre el 21/08/2026 y el 26/08/2026.',
  };
  const al1 = await insertarIdempotente(db, 'alertas', alerta, 'evento_id,cliente_id');
  const al2 = await insertarIdempotente(db, 'alertas', alerta, 'evento_id,cliente_id');
  const nAl = await contar(db, 'alertas', 'evento_id = $1 and cliente_id = $2', [ev.id, cli.id]);
  if (al1 === 1 && al2 === 0 && nAl === 1) {
    ok('reejecutar el reparto no crea una segunda alerta para el mismo cliente (1 → 0, total 1)');
  } else {
    fallo('la reinserción de alerta debería ser 1 → 0 y dejar 1 fila', `al1=${al1} al2=${al2} total=${nAl}`);
  }

  // ── Restricciones: tienen que rechazar lo que deben ───────────────────────────────────────
  console.log('\nRestricciones (tienen que fallar):');
  await esperarError('observación con clase fuera del enum rechazada', () =>
    db.query(`insert into observaciones_mercado (clase, fecha, nivel, fuente)
              values ('cripto', '2026-08-27', 1, 'test')`),
  );
  await esperarError('segunda (clase, fecha) por INSERT normal rechazada por el unique', () =>
    db.query(`insert into observaciones_mercado (clase, fecha, nivel, fuente)
              values ('renta_variable', '2026-08-26', 999, 'test')`),
  );
  await esperarError('evento con regla_id inexistente rechazado por la clave foránea', () =>
    db.query(`insert into eventos_mercado (regla_id, clase, variacion, desde, hasta)
              values ('00000000-0000-0000-0000-000000000000', 'renta_variable', -0.1, '2026-08-01', '2026-08-06')`),
  );
  await esperarError('alerta con cliente_id inexistente rechazada por la clave foránea', () =>
    db.query(`insert into alertas (evento_id, cliente_id) values ($1, '00000000-0000-0000-0000-000000000000')`, [ev.id]),
  );
  await esperarError('regla con perfil fuera de la lista rechazada por el check', () =>
    db.query(`insert into reglas_alerta (nombre, clase, direccion, umbral, ventana_dias, perfil)
              values ('mala', 'renta_variable', 'caida', 0.03, 5, 'agresivo')`),
  );

  console.log(`\n${fallos === 0 ? 'Todo en orden.' : `${fallos} fallo(s).`}\n`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('Error inesperado ejecutando la verificación:', error);
  process.exit(1);
});
