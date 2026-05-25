-- =====================================================================
-- Plataforma Interna LATAM ConsultUs + MaximUs
-- Schema Supabase (Postgres)
-- =====================================================================
-- Correr esto en: Supabase Dashboard → SQL Editor → New Query → paste → Run
-- Después correr seed.sql para cargar el equipo + 72 clientes.
-- =====================================================================

-- Equipo
create table if not exists public.team (
  id              text primary key,
  username        text unique not null,
  password        text not null,            -- placeholder mientras no usamos Supabase Auth
  perms           text not null default 'consultora', -- 'admin' | 'consultora' | 'maximus'
  name            text not null,
  initials        text not null,
  role            text not null,
  units           jsonb not null default '[]'::jsonb,
  color           text not null,
  non_assignable  boolean not null default false
);

-- Consultora — pedidos
create table if not exists public.consultora_cards (
  id            text primary key,
  cliente       text not null,
  descripcion   text default '',
  analista_id   text references public.team(id),
  a_cargo       text default '',
  prioridad     text not null default 'media',
  deadline      timestamptz,
  estado        text not null default 'backlog',
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  comentarios   text default ''
);
create index if not exists idx_consultora_estado on public.consultora_cards(estado);
create index if not exists idx_consultora_analista on public.consultora_cards(analista_id);

-- MaximUs — clientes (uso, sin facturación)
create table if not exists public.maximus_clients (
  id            text primary key,
  cliente       text not null,
  contacto      text,
  a_cargo       text,
  pais          text,
  servicio      text,
  empresa_nuestra text,
  anio_cliente  int,
  trabajos_medida text,
  portafolios_modelo text,
  uso_maximus_texto text,
  nivel_uso_resumen int,
  pct_maximus   numeric,
  accion        text,
  pedidos_total int default 0,
  pedidos_90d   int default 0,
  pedidos_180d  int default 0,
  ultimo_pedido date,
  dias_sin_pedido int,
  max_users_count int default 0,
  max_logins_total int default 0,
  max_logins_ytd int default 0,
  max_prom_logins_6m numeric,
  max_propuestas int default 0,
  max_portafolios_analizados int default 0,
  max_comparativos int default 0,
  max_estrategias int default 0,
  max_ultimo_login date,
  dias_sin_login int,
  score         int,
  ped_pct       int,
  max_pct       int,
  canal_dominante text,
  semaforo      text,
  asignado_a    text references public.team(id)
);
create index if not exists idx_max_clients_semaforo on public.maximus_clients(semaforo);
create index if not exists idx_max_clients_pais on public.maximus_clients(pais);

-- MaximUs — pipeline prospects
create table if not exists public.maximus_prospects (
  id                 text primary key,
  empresa            text not null,
  contacto           text,
  producto           text,
  notas              text default '',
  prox_seguimiento   timestamptz,
  estado             text not null default 'por_contactar',
  cliente_compartido text
);

-- MaximUs — tareas equipo (asignación múltiple en jsonb)
create table if not exists public.maximus_tasks (
  id           text primary key,
  titulo       text not null,
  descripcion  text default '',
  asignados    jsonb not null default '[]'::jsonb,
  prioridad    text not null default 'media',
  deadline     timestamptz,
  estado       text not null default 'pending'
);

-- MaximUs — comentarios sobre tareas
create table if not exists public.maximus_task_comments (
  id        text primary key,
  task_id   text not null references public.maximus_tasks(id) on delete cascade,
  autor_id  text references public.team(id),
  ts        timestamptz not null default now(),
  texto     text not null
);
create index if not exists idx_task_comments_task on public.maximus_task_comments(task_id);

-- =====================================================================
-- RLS — equipo de 10, todos ven y editan todo (uso interno)
-- =====================================================================
alter table public.team                  enable row level security;
alter table public.consultora_cards      enable row level security;
alter table public.maximus_clients       enable row level security;
alter table public.maximus_prospects     enable row level security;
alter table public.maximus_tasks         enable row level security;
alter table public.maximus_task_comments enable row level security;

-- Policy: cualquiera con el anon key puede leer/escribir (es uso interno,
-- después podemos meter auth real con magic link de Supabase Auth).
do $$
declare t text;
begin
  for t in select unnest(array['team','consultora_cards','maximus_clients','maximus_prospects','maximus_tasks','maximus_task_comments'])
  loop
    execute format('drop policy if exists "open_select" on public.%I', t);
    execute format('drop policy if exists "open_insert" on public.%I', t);
    execute format('drop policy if exists "open_update" on public.%I', t);
    execute format('drop policy if exists "open_delete" on public.%I', t);
    execute format('create policy "open_select" on public.%I for select using (true)', t);
    execute format('create policy "open_insert" on public.%I for insert with check (true)', t);
    execute format('create policy "open_update" on public.%I for update using (true) with check (true)', t);
    execute format('create policy "open_delete" on public.%I for delete using (true)', t);
  end loop;
end $$;

-- =====================================================================
-- Realtime — publicar cambios para subscriptions
-- =====================================================================
alter publication supabase_realtime add table public.team;
alter publication supabase_realtime add table public.consultora_cards;
alter publication supabase_realtime add table public.maximus_clients;
alter publication supabase_realtime add table public.maximus_prospects;
alter publication supabase_realtime add table public.maximus_tasks;
alter publication supabase_realtime add table public.maximus_task_comments;
