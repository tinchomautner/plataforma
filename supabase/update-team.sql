-- ====================================================================
-- Actualización de roles + flag non_assignable + alta Felipe/Paulina
-- Correr en Supabase Dashboard → SQL Editor → paste → Run
-- ====================================================================

-- Agregar columna non_assignable (si no existe)
alter table public.team add column if not exists non_assignable boolean not null default false;

-- Roles actualizados (mismo id, distinto role) + flags
update public.team set role = 'Director general',                    name = 'Santiago de Haedo',   units = '["consultora","maximus"]'::jsonb, non_assignable = true where id = 'u-sh';
update public.team set role = 'Directora ejecutiva',                 name = 'Verónica Rey',        units = '["consultora","maximus"]'::jsonb, non_assignable = true where id = 'u-vr';
update public.team set role = 'Director de producto',                name = 'Martín Mautner',                                                  non_assignable = true where id = 'u-mm';
update public.team set role = 'Directora de estrategia',             name = 'Deborah Amatti',                                                  non_assignable = false where id = 'u-da';
update public.team set role = 'Director analista de crédito',        name = 'Pablo Machado',                                                   non_assignable = false where id = 'u-pm';
update public.team set role = 'Director analista de portafolios',    name = 'Emeterio Morales',                                                non_assignable = false where id = 'u-em';
update public.team set role = 'Director analista de renta variable', name = 'Martín Nogués',                                                   non_assignable = false where id = 'u-mn';
update public.team set role = 'Analista de portafolios',             name = 'Matías Acevedo',                                                  non_assignable = false where id = 'u-ma';
update public.team set role = 'Analista de datos',                   name = 'Federico Hazan',                                                  non_assignable = false where id = 'u-fh';
update public.team set role = 'Analista',                            name = 'Máximo Araújo',                                                   non_assignable = false where id = 'u-ax';

-- Alta de los dos nuevos (con non_assignable true por defecto)
insert into public.team (id, username, password, perms, name, initials, role, units, color, non_assignable) values
  ('u-fd', 'donagaray', 'Felipe2026',  'consultora', 'Felipe Donagaray', 'FD', 'Responsable en comunicación y marketing', '["consultora","maximus"]'::jsonb, '#0EA5E9', true),
  ('u-pl', 'paulina',   'Paulina2026', 'consultora', 'Paulina Lorenzo',  'PL', 'Responsable en comunicación y marketing', '["consultora","maximus"]'::jsonb, '#F472B6', true)
on conflict (id) do update set
  name=excluded.name, role=excluded.role, units=excluded.units, color=excluded.color, non_assignable=excluded.non_assignable;
