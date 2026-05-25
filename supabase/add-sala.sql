-- ====================================================================
-- Tabla de reservas de sala de reuniones MaximUs
-- Correr en Supabase Dashboard → SQL Editor → paste → Run
-- ====================================================================

create table if not exists public.reservas_sala (
  id              text primary key,
  inicio          timestamptz not null,
  fin             timestamptz not null,
  titulo          text not null,
  notas           text default '',
  reservado_por   text references public.team(id),
  reservado_at    timestamptz not null default now()
);

create index if not exists idx_reservas_inicio on public.reservas_sala(inicio);
create index if not exists idx_reservas_por    on public.reservas_sala(reservado_por);

-- RLS
alter table public.reservas_sala enable row level security;

drop policy if exists "open_select" on public.reservas_sala;
drop policy if exists "open_insert" on public.reservas_sala;
drop policy if exists "open_update" on public.reservas_sala;
drop policy if exists "open_delete" on public.reservas_sala;
create policy "open_select" on public.reservas_sala for select using (true);
create policy "open_insert" on public.reservas_sala for insert with check (true);
create policy "open_update" on public.reservas_sala for update using (true) with check (true);
create policy "open_delete" on public.reservas_sala for delete using (true);

-- Realtime
do $$
begin
  begin alter publication supabase_realtime add table public.reservas_sala; exception when duplicate_object then null; end;
end $$;
