# Deploy a GitHub Pages

Pasos para tener la plataforma en una URL pública (gratis, sin servidor).

## 1) Crear el repo en GitHub (3 min)

1. Ir a https://github.com/new (logueado como `maximusnextgeneration-code` o tu cuenta de equipo).
2. **Repository name:** `plataforma-interna`
3. **Public** (Pages gratis requiere público; los datos están en el navegador / Supabase, no en el repo).
4. **NO** marcar "Add a README", "Add .gitignore" ni licencia (ya están).
5. **Create repository**.

## 2) Empujar el código (1 comando)

GitHub te muestra una URL después de crear el repo (algo como `https://github.com/maximusnextgeneration-code/plataforma-interna.git`). Reemplazá `OWNER` abajo y corré en PowerShell, parado en `C:\Users\mmaut\plataforma-interna`:

```powershell
git remote add origin https://github.com/OWNER/plataforma-interna.git
git push -u origin main
```

(Te va a pedir login a GitHub la primera vez — usá un Personal Access Token o GitHub CLI.)

## 3) Activar GitHub Pages (1 min)

1. En el repo recién creado → **Settings** (tab arriba a la derecha) → **Pages** (sidebar izquierdo).
2. **Source:** "Deploy from a branch".
3. **Branch:** `main` · **Folder:** `/ (root)` → **Save**.
4. Esperar ~1 minuto. La URL aparece arriba: `https://OWNER.github.io/plataforma-interna/`.

## 4) Listo

Compartí esa URL con el equipo. Cada uno entra → elige su nombre → empieza a usar.

> Mientras no esté Supabase activado, cada navegador guarda sus propios datos (no se comparten). Para sincronizar entre los 10, seguir [supabase/README.md](supabase/README.md).

---

## Actualizar la app después

Cada vez que cambies algo:

```powershell
git add .
git commit -m "Descripción del cambio"
git push
```

GitHub Pages re-deploya solo en ~30s. Recargá la URL y listo.
