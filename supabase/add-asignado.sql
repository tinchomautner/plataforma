-- ====================================================================
-- Agregar columna asignado_a para Plan comercial
-- Correr en Supabase Dashboard → SQL Editor → paste → Run
-- ====================================================================

alter table public.maximus_clients
  add column if not exists asignado_a text references public.team(id);
