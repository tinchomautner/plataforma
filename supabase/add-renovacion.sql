-- ====================================================================
-- Agregar columna fecha_renovacion (mes de renovación) a maximus_clients
-- Formato: 'YYYY-MM' (ej. '2026-12'). Texto para facilidad.
-- Correr en Supabase → SQL Editor → paste → Run
-- ====================================================================

alter table public.maximus_clients
  add column if not exists fecha_renovacion text;
