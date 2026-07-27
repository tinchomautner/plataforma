-- ====================================================================
-- Agenda del viaje comercial a Houston (19 y 20 de agosto 2026)
-- Correr en Supabase → SQL Editor → paste → Run
-- Idempotente: se puede correr varias veces.
-- ====================================================================

create table if not exists public.houston_agenda (
  firma_id     text primary key,          -- id de la firma (cl_* / pr_*)
  dia          text,                      -- '2026-08-17' | '2026-08-18' | '2026-08-21'
  hora         text,                      -- 'HH:MM'
  duracion     int  default 60,           -- minutos
  estado       text default 'propuesto',  -- propuesto | confirmado | descartado
  nota         text default '',
  actualizado_por text references public.team(id),
  actualizado_at  timestamptz not null default now()
);

create index if not exists idx_houston_dia on public.houston_agenda(dia);

alter table public.houston_agenda enable row level security;

drop policy if exists "open_select" on public.houston_agenda;
drop policy if exists "open_insert" on public.houston_agenda;
drop policy if exists "open_update" on public.houston_agenda;
drop policy if exists "open_delete" on public.houston_agenda;
create policy "open_select" on public.houston_agenda for select using (true);
create policy "open_insert" on public.houston_agenda for insert with check (true);
create policy "open_update" on public.houston_agenda for update using (true) with check (true);
create policy "open_delete" on public.houston_agenda for delete using (true);

do $$
begin
  begin alter publication supabase_realtime add table public.houston_agenda; exception when duplicate_object then null; end;
end $$;
