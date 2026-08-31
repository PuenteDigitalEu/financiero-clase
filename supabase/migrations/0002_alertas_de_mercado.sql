-- 0002_alertas_de_mercado.sql
-- Capa de vigilancia de mercado montada ENCIMA del esquema inicial (001). Solo añade: tipos,
-- columnas, tablas y policies nuevas. No altera ni una definición existente.
-- Ver docs/data-model.md para el detalle narrativo (pendiente de ampliar con estas tablas).
--
-- Nota de nomenclatura: el paso 2 hablaba de "analisis"; en el esquema vigente esa tabla es
-- `informes` (el diagnóstico determinista de lib/motor/). Las columnas nuevas van ahí, separadas
-- de las `mc_*` de Monte Carlo, que se quedan como están.

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Tipos
-- ══════════════════════════════════════════════════════════════════════════════
create type clase_activo         as enum ('liquidez', 'renta_fija', 'renta_variable', 'oro');
create type direccion_movimiento as enum ('caida', 'subida');
create type estado_alerta        as enum ('nueva', 'vista', 'descartada');
-- Mismos valores que el check inline de informes.mc_banda, pero como enum reutilizable en la capa
-- nueva. mc_banda no se toca: conviven.
create type banda_probabilidad   as enum ('alta', 'razonable', 'fragil', 'baja');

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Columnas nuevas sobre tablas existentes
-- ══════════════════════════════════════════════════════════════════════════════
alter table clientes add column avisar_cliente boolean not null default false;

alter table informes add column probabilidad numeric;
alter table informes add column banda        banda_probabilidad;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Tablas de la capa de vigilancia
-- ══════════════════════════════════════════════════════════════════════════════

-- ── observaciones_mercado ────────────────────────────────────────────────────
-- Serie temporal cruda: un nivel por clase de activo y fecha. La ingesta es idempotente gracias
-- al UNIQUE (clase, fecha) — reingestar la misma fuente no duplica la serie.
create table observaciones_mercado (
  id         uuid primary key default gen_random_uuid(),
  clase      clase_activo not null,
  fecha      date not null,
  nivel      numeric not null,
  fuente     text not null,
  creado_en  timestamptz not null default now(),
  unique (clase, fecha)
);

-- ── reglas_alerta ────────────────────────────────────────────────────────────
-- Catálogo de condiciones que se vigilan. perfil NULL = la regla aplica a todos los perfiles.
create table reglas_alerta (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  clase         clase_activo not null,
  direccion     direccion_movimiento not null,
  -- Umbral en TANTO POR UNO (0.03 = 3 %), no en porcentaje.
  umbral        numeric not null,
  ventana_dias  int not null,
  perfil        text check (perfil is null or perfil in ('conservador', 'moderado', 'dinamico')),
  activa        boolean not null default true,
  creado_en     timestamptz not null default now()
);

-- ── eventos_mercado ──────────────────────────────────────────────────────────
-- Cada vez que una regla se cumple sobre la serie se registra un evento. El UNIQUE
-- (regla_id, hasta) hace idempotente la detección: recalcular la misma ventana (mismo día de
-- cierre) no crea eventos repetidos para esa regla.
create table eventos_mercado (
  id         uuid primary key default gen_random_uuid(),
  regla_id   uuid not null references reglas_alerta (id),
  clase      clase_activo not null,
  -- Variación observada en la ventana, en tanto por uno (coherente con reglas_alerta.umbral).
  variacion  numeric not null,
  desde      date not null,
  hasta      date not null,
  creado_en  timestamptz not null default now(),
  unique (regla_id, hasta)
);

-- ── alertas ──────────────────────────────────────────────────────────────────
-- Reparto de un evento a los clientes afectados. El UNIQUE (evento_id, cliente_id) garantiza
-- una alerta como máximo por cliente y evento: el reparto puede re-ejecutarse sin duplicar avisos.
create table alertas (
  id                  uuid primary key default gen_random_uuid(),
  evento_id           uuid not null references eventos_mercado (id),
  cliente_id          uuid not null references clientes (id),
  -- Diagnóstico (informes) al que se ancla la alerta, si lo hay.
  analisis_id         uuid references informes (id),
  estado              estado_alerta not null default 'nueva',
  mensaje             text,
  avisado_cliente_en  timestamptz,
  creado_en           timestamptz not null default now(),
  unique (evento_id, cliente_id)
);
create index alertas_cliente_id_idx  on alertas (cliente_id);
create index alertas_analisis_id_idx on alertas (analisis_id);

-- ── posiciones ───────────────────────────────────────────────────────────────
-- Cartera declarada de cada cliente, para saber a quién afecta un evento de mercado.
create table posiciones (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes (id),
  clase       clase_activo not null,
  activo      text not null,
  ticker      text,
  importe     numeric not null,
  creado_en   timestamptz not null default now()
);
create index posiciones_cliente_id_idx on posiciones (cliente_id);

-- eventos_mercado.regla_id no lleva índice aparte: es la columna izquierda del UNIQUE
-- (regla_id, hasta), que ya sirve para buscar por regla. Lo mismo para alertas.evento_id
-- con UNIQUE (evento_id, cliente_id) y observaciones_mercado.clase con UNIQUE (clase, fecha).

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Row Level Security
-- ══════════════════════════════════════════════════════════════════════════════
-- Mismo criterio que 001: las escrituras entran por el backend con la clave de servicio (que no
-- pasa por RLS). Aquí solo se conceden SELECT y solo a quien está en la tabla asesores, vía la
-- función es_asesor() ya definida en 001. Nada para "anon".

alter table observaciones_mercado enable row level security;
alter table reglas_alerta         enable row level security;
alter table eventos_mercado       enable row level security;
alter table alertas               enable row level security;
alter table posiciones            enable row level security;

create policy "observaciones_mercado_select" on observaciones_mercado
  for select to authenticated using (es_asesor());
create policy "reglas_alerta_select" on reglas_alerta
  for select to authenticated using (es_asesor());
create policy "eventos_mercado_select" on eventos_mercado
  for select to authenticated using (es_asesor());
create policy "alertas_select" on alertas
  for select to authenticated using (es_asesor());
create policy "posiciones_select" on posiciones
  for select to authenticated using (es_asesor());

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Siembra: caída de renta variable a 5 días, un umbral por perfil
-- ══════════════════════════════════════════════════════════════════════════════
-- Umbral en tanto por uno: 3 % / 4 % / 6 %.
insert into reglas_alerta (nombre, clase, direccion, umbral, ventana_dias, perfil, activa) values
  ('Caída renta variable 5d — conservador', 'renta_variable', 'caida', 0.03, 5, 'conservador', true),
  ('Caída renta variable 5d — moderado',    'renta_variable', 'caida', 0.04, 5, 'moderado',    true),
  ('Caída renta variable 5d — dinamico',    'renta_variable', 'caida', 0.06, 5, 'dinamico',    true);
