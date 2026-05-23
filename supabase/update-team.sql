-- ====================================================================
-- Actualización de roles del equipo (según docx de firmas oficial)
-- + alta de Felipe Donagaray y Paulina Lorenzo (comunicación y marketing)
-- Correr en Supabase Dashboard → SQL Editor → paste → Run
-- ====================================================================

-- Roles actualizados (mismo id, distinto role)
update public.team set role = 'Director general',                    name = 'Santiago de Haedo',   units = '["consultora","maximus"]'::jsonb where id = 'u-sh';
update public.team set role = 'Directora ejecutiva',                 name = 'Verónica Rey',        units = '["consultora","maximus"]'::jsonb where id = 'u-vr';
update public.team set role = 'Director de producto',                name = 'Martín Mautner'                                                  where id = 'u-mm';
update public.team set role = 'Directora de estrategia',             name = 'Deborah Amatti'                                                  where id = 'u-da';
update public.team set role = 'Director analista de crédito',        name = 'Pablo Machado'                                                   where id = 'u-pm';
update public.team set role = 'Director analista de portafolios',    name = 'Emeterio Morales'                                                where id = 'u-em';
update public.team set role = 'Director analista de renta variable', name = 'Martín Nogués'                                                   where id = 'u-mn';
update public.team set role = 'Analista de portafolios',             name = 'Matías Acevedo'                                                  where id = 'u-ma';
update public.team set role = 'Analista de datos',                   name = 'Federico Hazan'                                                  where id = 'u-fh';
update public.team set role = 'Analista',                            name = 'Máximo Araújo'                                                   where id = 'u-ax';

-- Alta de los dos nuevos
insert into public.team (id, username, password, perms, name, initials, role, units, color) values
  ('u-fd', 'donagaray', 'Felipe2026',  'consultora', 'Felipe Donagaray', 'FD', 'Responsable en comunicación y marketing', '["consultora","maximus"]'::jsonb, '#0EA5E9'),
  ('u-pl', 'paulina',   'Paulina2026', 'consultora', 'Paulina Lorenzo',  'PL', 'Responsable en comunicación y marketing', '["consultora","maximus"]'::jsonb, '#F472B6')
on conflict (id) do update set name=excluded.name, role=excluded.role, units=excluded.units, color=excluded.color;
