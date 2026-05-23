# Supabase — sincronización entre los 10 del equipo

Hoy la app usa `localStorage` (cada navegador su propia copia). Para que los 10 vean lo mismo en tiempo real, activamos Supabase. **Gratis** hasta 500 MB de DB y 50k MAU — más que suficiente.

---

## 1) Crear el proyecto (5 min)

1. Ir a https://supabase.com → **Sign up** (con GitHub o email).
2. **New project** → cualquier nombre (ej. `plataforma-interna`) → password DB cualquiera (guardala) → región **South America (São Paulo)** → Free tier → Create.
3. Esperar 1-2 min a que termine de aprovisionar.

## 2) Crear las tablas (1 min)

1. En el proyecto → **SQL Editor** (ícono base de datos en el sidebar) → **New query**.
2. Abrir `supabase/schema.sql` → copiar todo → pegar en el editor → **Run**.
3. Repetir con `supabase/seed.sql`. Esto carga el equipo (10) y los 72 clientes.

## 3) Obtener las keys

1. En el proyecto → ⚙️ **Project Settings** → **API**.
2. Copiar:
   - **Project URL** (ej. `https://abcdxyz.supabase.co`)
   - **anon public** key (largo, empieza con `eyJ...`)

## 4) Activar en la app

Editar `index.html` y descomentar el bloque cerca del final:

```html
<script>
  window.SUPABASE_CFG = {
    url: 'https://abcdxyz.supabase.co',   // ← tu URL
    anonKey: 'eyJhbGciOi...'              // ← tu anon key
  };
</script>
```

Commit + push → en 30s GitHub Pages re-deploya. Recargá la página: en el sidebar inferior izquierdo va a decir **"Sincronizado con equipo"** (puntito verde). Todo cambio que haga cualquier analista se replica al resto en vivo.

---

## ¿Es seguro publicar la `anon key`?

Sí, está diseñada para ser pública (va al cliente). La protección real son las **policies de Row-Level Security** que ya están en `schema.sql`. Para uso interno del equipo arrancamos con policies abiertas (cualquiera con la URL ve todo). Cuando quieras endurecer:

- Activar **Supabase Auth** (magic link por email) y limitar policies a `auth.uid()`.
- Restringir el dominio del proyecto en **Project Settings → API → URL allow list**.

## Backups

Supabase free tier hace snapshots automáticos diarios (7 días retención). Para backup manual: **Database → Backups → Download**.

## Volver a localStorage

Si querés desactivar Supabase: en `index.html`, comentar el bloque `window.SUPABASE_CFG`. Vuelve a localStorage transparente, sin perder código.
