# Plataforma Interna — LATAM ConsultUs · MaximUs

Aplicación interna del equipo. Sin build step: HTML + React (CDN) + Tailwind (CDN) + `localStorage`.

## Correr local

```bash
python -m http.server 5173
# abrir http://localhost:5173
```

## Estructura

- `index.html` — shell
- `app.jsx` — toda la app (React)
- `styles.css` — overrides del tema TRL-Fondos
- `seed-clients.js` — 72 clientes seed (sin facturación)

## Secciones

- **Consultora** — Kanban de pedidos · Calendario de deadlines · Métricas por analista
- **MaximUs** — Seguimiento de clientes (score + semáforo) · Pipeline de prospects · Tareas del equipo

## Persistencia

Hoy: `localStorage` (por navegador). Próximo paso: Supabase free tier para sincronizar entre los 10 del equipo.
