# Research de prospectos de Panamá — para cargar en la plataforma interna

Paquete armado el 24 de julio de 2026 para el viaje comercial a Panamá (**lunes 17, martes 18 y viernes 21 de agosto de 2026**).

Contiene el research de las 22 firmas panameñas que ya están en el pipeline de MaximUs, más el alta de un cliente nuevo. La idea es que esto se cargue en `plataforma-interna` (Supabase) sin duplicar nada.

---

## Qué hay acá

| Archivo | Qué es |
|---|---|
| `panama-prospects.sql` | **El entregable principal.** Upsert contra `public.maximus_prospects` + alta en `public.maximus_clients`. Se corre en Supabase → SQL Editor |
| `panama-research.json` | La misma data estructurada, por si conviene cargarla vía `supabase-js` o el Admin SDK en lugar de SQL |
| `panama-research.xlsx` | Planilla de dos hojas: *Firmas* y *Contactos*. Para leer, no para cargar |
| `panama-research.csv` | Igual que el xlsx, separado por `;`, UTF-8 con BOM |
| `data.json` | La fuente de verdad del research (la editan las personas, no el script) |
| `export.py` | Regenera los cuatro archivos de arriba a partir de `data.json` |
| `agenda-app/` | La herramienta HTML de agenda del viaje (opcional, ver más abajo) |

---

## Cómo aplicarlo

### Camino corto

Pegar `panama-prospects.sql` en **Supabase → SQL Editor → Run**. Es idempotente: se puede correr las veces que haga falta.

### Qué hace el SQL, exactamente

1. `alter table ... add column if not exists nota_plan text` sobre `maximus_prospects` y `maximus_clients` (ya existía en `supabase/upsert-prospects.sql`, se repite por las dudas).
2. Un `insert ... on conflict (id) do update` sobre **22 prospectos que ya existen** en la tabla. Los ids del SQL son los **ids reales de la plataforma**, sacados de `seed-prospects.js` — no son ids nuevos. Verificado uno por uno.
3. Solo pisa tres campos:
   - `contacto` → nombre + cargo, ej. `Emanuel Bosquez - Gerente de Banca Privada e Inversiones`
   - `notas` → el research completo (tipo de casa, licencia, grupo, activos, qué hacen, compatibilidad con MaximUs de 0 a 5, argumentos a favor, temas a validar, alertas y links a las fuentes)
   - `nota_plan` → el plan de acción (ángulo de entrada, objetivo de la reunión y a quién contactar con el porqué de cada nombre)
4. Da de alta **SweetWater Securities** en `maximus_clients` con id `cl_sweetwater` y contacto Daniela.
5. Deja **comentados** dos `update` de `estado`, para que los decida Martín (ver "Decisiones pendientes").

### Lo que el SQL NO hace, a propósito

- **No toca `estado`.** El estado del pipeline lo maneja el equipo comercial; pisarlo desde un script sería destructivo.
- **No toca `empresa`, `pais`, `producto`, `asignado_a`, `prox_seguimiento`, `jira_key` ni `jira_estado`.**
- **No borra nada.**

Si en la app hay que mostrar `nota_plan` en la ficha del prospect y todavía no está en la UI, ese es el único cambio de código que puede hacer falta (`app.jsx`, vista `MaximusProspects`).

---

## Decisiones pendientes para Martín

Dos hallazgos del research que cambian datos del pipeline. Están al final del SQL como `update` comentados. **No ejecutarlos sin que Martín confirme:**

1. **SeaGate Capital** (`pr_e068559756`) — la SMV ordenó su **liquidación forzosa administrativa** en enero de 2019 (Res. SMV-7-19), después de multarla con USD 1 millón por deficiencias en el manejo de cuentas de clientes. La entidad no existe. Correspondería `no_les_interesa` o directamente borrarla.
2. **Fince** (`pr_b797a5c061`) — no aparece en el registro de casas de valores de la SMV ni en ninguna fuente pública. Lo más parecido es *Finec Asset Management*. Puede ser un nombre mal cargado. Hay que preguntar internamente quién cargó la ficha antes de trabajarla.

Otros dos temas que están anotados en las fichas y conviene no perder de vista:

3. **Banistmo cambió de dueño.** Grupo Cibest (ex Bancolombia) vendió el 100% del banco a Inversiones Cuscatlán Centroamérica en junio de 2026 (~USD 1.400 millones); el comprador pasará a llamarse Grupo Financiero BSC. Y el negocio de valores **no se vendió**: se escindió y hoy opera como **Cibest Capital Panamá**. Hay que confirmar si el contacto (Ana María Merizalde) quedó en el banco o pasó a Cibest Capital.
4. **Banco Aliado y Geneva Asset Management son el mismo grupo.** El banco no hace el negocio de valores: lo canaliza por Geneva. Son dos fichas del pipeline para una sola visita.

---

## Contactos que se agregaron

Seis firmas estaban sin contacto y ahora tienen nombre y cargo; dos tenían el contacto incompleto y se completó.

| Firma | Contacto nuevo |
|---|---|
| MetroBank | Emanuel Bosquez — Gerente de Banca Privada e Inversiones |
| Singular (figura como "Singular Bank") | Sergi Lucas — CEO |
| Quantum Advisors | Guillermo Ameglio — Fundador, director y presidente |
| Banco General | Michelle Núñez Olivares — VP Ejecutiva y Gerente General de BG Valores |
| Towerbank | Yurgen Espinosa — Manager, Treasury and Investments |
| Geneva Asset Management | Joaquín De La Guardia — Secretario y socio fundador |
| Banco Aliado | Sandra Olaciregui — VP Senior de Banca Privada (reemplaza al "Mathi" sin apellido) |
| Mercantil Servicios de Inversión | Lucianio Scandolari — Gerente general (el "Alex C." cargado no se pudo identificar) |

En `nota_plan` de cada ficha van además los contactos alternativos con el motivo de cada uno.

**Ojo con un dato**: la ficha de Singular figura en la plataforma como *"Singular Bank"*, pero la firma panameña es **Singular Wealth Management Corp** (USD 600 M, independiente). Conviene corregir el nombre, salvo que se confirme que la referencia original era al Singular Bank español.

---

## La app de agenda (carpeta `agenda-app/`)

Es una herramienta HTML de un solo archivo, sin dependencias externas, con los mismos tokens de estilo de `plataforma-interna` (ink `#1A2240`, acento `#0066CC`, Inter). Tres pestañas — clientes, prospectos con contacto y prospectos sin contacto — y un calendario de los tres días del viaje: se arrastra la firma al horario y sale de la lista.

Hoy guarda en `localStorage`. Si se decide integrarla como una sección más de la plataforma (por ejemplo `#max/panama`), habría que:

- portarla a un componente de `app.jsx` siguiendo el patrón de las otras vistas,
- crear una tabla `maximus_agenda_panama` (o reusar `reservas_sala` como referencia de forma) y sumar las acciones al reducer y a `supabase/client.js`,
- reemplazar el `localStorage` por el sync de Supabase, así la agenda se comparte con el resto del equipo.

Para regenerar el HTML después de editar `data.json`: `python build_seed.py`.

---

## Regenerar los exports

```bash
python export.py
```

Con el backup de la app (el botón *Backup* baja un JSON), agrega la columna **Agendado** y genera `agenda.csv` con el cronograma:

```bash
python export.py agenda-panama.json
```

---

## Fuentes

Cada ficha lleva sus links al final del campo `notas`. Las principales son la Superintendencia del Mercado de Valores de Panamá (registro de casas de valores, resoluciones de licencia y el comunicado de liquidación de SeaGate) y los sitios oficiales de cada firma. Dato de contexto que sirve para abrir cualquier reunión: **las casas de valores panameñas administran USD 14.406 millones, 23% más que el año anterior, y el 89% de lo que operan es mercado internacional** (SMV, octubre de 2025).
