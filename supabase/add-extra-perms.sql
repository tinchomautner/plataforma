-- ====================================================================
-- Permisos extra por usuario (además del perms principal)
-- Ej: Pablo Machado es 'consultora' pero también ve las secciones MaximUs.
-- Correr en Supabase → SQL Editor → paste → Run
-- ====================================================================

alter table public.team add column if not exists extra_perms jsonb default '[]'::jsonb;

-- Pablo Machado: consultora + acceso a MaximUs (sin métricas de Consultora)
update public.team set extra_perms = '["maximus"]'::jsonb, units = '["consultora","maximus"]'::jsonb where id = 'u-pm';
