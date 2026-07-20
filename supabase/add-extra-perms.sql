-- ====================================================================
-- Permisos: Pablo Machado pasa a ADMIN (ve todas las secciones)
-- Correr en Supabase → SQL Editor → paste → Run
-- Es idempotente: se puede correr varias veces sin problema.
-- ====================================================================

-- Columna de permisos extra (por si se necesita a futuro para otro usuario)
alter table public.team add column if not exists extra_perms jsonb default '[]'::jsonb;

-- Pablo Machado: acceso total (igual que Mautner y de Haedo)
update public.team
set perms       = 'admin',
    units       = '["consultora","maximus"]'::jsonb,
    extra_perms = '[]'::jsonb
where id = 'u-pm';

-- Verificación (debería devolver 3 filas: Mautner, de Haedo, Machado)
-- select id, name, perms from public.team where perms = 'admin' order by id;
