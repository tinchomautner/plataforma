# Reporte de matching: Excel "Activos por Usuario Mayo 2026" ↔ MaximUs

## Resumen

- **66 organizaciones** en el Excel (col "Organización")
- **72 clientes** en MaximUs (`maximus_clients`)
- **47 matches** directos o parciales → SQL listo en `load-activos.sql`

## 19 organizaciones del Excel sin cliente correspondiente

Estos son **prospects o clientes que NO están en MaximUs** todavía. Capaz hay que crearlos:

| Organización | Activos únicos |
|--------------|----------------|
| Le Capital | 74 |
| Innova | 65 |
| Insigneo | 58 |
| Niveton | 43 |
| CLG | 31 |
| Sweetwater | 30 |
| Accem | 27 |
| CFP | 26 |
| Rivadarno | 22 |
| Cono Sur | 18 |
| Criteria | 12 |
| AMCS | 4 |
| CDR | 2 |
| Aqua | 1 |
| Sebastian Ponce | 1 |
| (y 4 más) | |

## 25 clientes en MaximUs sin actividad en el Excel

Estos clientes NO aparecen en el Excel, capaz porque son **subsidiarias / variantes** del mismo nombre:

- **Atlantis** ya matcheó, pero quedaron sin activos: `Atlantis Libonatti`, `Atlantis Mendoza`, `Atlantis MaximUs`
- Otros: Rovascio, Latin Research, Latin Securities - Bonos, Moreno WM, Oreamuno, Unity, FS Advisors, PWA, Ballestas, Shelter Financial, BCT, Capital Partners, (y 13 más)

## Cómo seguir

1. **Correr `load-activos.sql` ya** → 47 clientes quedan con sus activos.
2. **Decidir caso por caso** los 19 sin match: ¿agregarlos como clientes? Si sí, te puedo armar otro SQL.
3. **Decidir las variantes**: si "Atlantis Libonatti" es lo mismo que "Atlantis" en el Excel, hay que mergear o duplicar activos.

Si me decís qué hacer con los 19+25, te lo automatizo.
