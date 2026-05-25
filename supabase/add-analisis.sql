-- ====================================================================
-- Sección "Análisis y envíos" — telefono + holdings por cliente +
-- tabla de análisis (PDFs alojados externamente, ej. mxmus.app)
-- Correr en Supabase → SQL Editor → paste → Run
-- ====================================================================

-- 1) Columnas nuevas en maximus_clients
alter table public.maximus_clients add column if not exists telefono text;
alter table public.maximus_clients add column if not exists activos  jsonb default '[]'::jsonb;

-- 2) Tabla de análisis (PDFs publicados)
create table if not exists public.analisis (
  id           text primary key,
  ticker       text not null,
  titulo       text not null,
  pdf_url      text not null,
  nota         text default '',
  uploaded_by  text references public.team(id),
  uploaded_at  timestamptz not null default now()
);
create index if not exists idx_analisis_ticker on public.analisis(ticker);
create index if not exists idx_analisis_uploaded_at on public.analisis(uploaded_at desc);

-- 3) Tabla de envíos (historial)
create table if not exists public.envios_whatsapp (
  id            text primary key,
  analisis_id   text references public.analisis(id) on delete cascade,
  cliente_id    text references public.maximus_clients(id),
  contacto      text,
  telefono      text,
  mensaje       text,
  enviado_by    text references public.team(id),
  enviado_at    timestamptz not null default now()
);
create index if not exists idx_envios_analisis on public.envios_whatsapp(analisis_id);

-- 4) RLS open (uso interno)
alter table public.analisis         enable row level security;
alter table public.envios_whatsapp  enable row level security;
do $$
declare t text;
begin
  for t in select unnest(array['analisis','envios_whatsapp']) loop
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

-- 5) Realtime
alter publication supabase_realtime add table public.analisis;
alter publication supabase_realtime add table public.envios_whatsapp;

-- 6) Test: setear teléfono de Santiago de Haedo en uno de los clientes
--    (para probar el flujo). Reemplazar el id del cliente que querés usar.
--    Como prueba inicial, agregamos telefono +598 99 511 008 a un cliente
--    cualquiera marcado como "Test". Mejor lo hago vía UI.
