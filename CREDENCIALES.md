# Credenciales del equipo

Para uso interno. Compartilas por canal seguro (Slack DM / 1Password / WhatsApp). Cada uno puede cambiar la suya después.

| Usuario          | Permisos    | Username   | Password       |
|------------------|-------------|------------|----------------|
| Martín Mautner   | **Admin**   | `mautner`  | `Martin2026`   |
| Santiago de Haedo| **Admin**   | `dehaedo`  | `Santiago2026` |
| Matías Acevedo   | Consultora  | `mati`     | `Mati2026`     |
| Pablo Machado    | Consultora  | `pablo`    | `Pablo2026`    |
| Deborah Amatti   | Consultora  | `debo`     | `Debo2026`     |
| Emeterio Morales | Consultora  | `emeterio` | `Emeterio2026` |
| Martín Nogués    | Consultora  | `nogues`   | `Nogues2026`   |
| Verónica Rey     | Consultora  | `vero`     | `Vero2026`     |
| Federico Hazan   | MaximUs     | `hazan`    | `Federico2026` |
| Max Araujo       | MaximUs     | `araujo`   | `Max2026`      |

## Permisos por sección

| Sección                    | Admin | Consultora | MaximUs |
|----------------------------|:-----:|:----------:|:-------:|
| Pedidos (Kanban Consultora)|   ✓   |     ✓      |    —    |
| Calendario de deadlines    |   ✓   |     ✓      |    —    |
| **Métricas Consultora**    |   ✓   |     —      |    —    |
| Uso clientes MaximUs       |   ✓   |     —      |    ✓    |
| Pipeline ventas (Prospects)|   ✓   |     —      |    ✓    |
| Tareas equipo MaximUs      |   ✓   |     —      |    ✓    |

**Admin = Martín Mautner + Santiago de Haedo** (control total).
**MaximUs = Federico Hazan + Max Araujo** (solo cosas de MaximUs).
**Consultora = los otros 6 analistas** (solo Consultora, sin métricas).

## Seguridad

Estas passwords son barrera básica para uso interno, no auth real. Para auth seria (magic link por email, sin passwords compartidos):

1. Activar **Supabase Auth** en el dashboard de Supabase.
2. Invitar a cada email del equipo.
3. Cambiar el `Login` para usar `supabase.auth.signInWithOtp({ email })`.

Lo dejamos para el siguiente sprint.
