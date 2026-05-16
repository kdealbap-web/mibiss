# Cloudflare Pages — Environment Variables

Configurar en: Cloudflare Dashboard → Workers & Pages → **biss** → Settings → Environment variables.

## Production + Preview (mismo set)

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://uicpkqwmjjrywojhwctq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (anon/publishable key del proyecto Supabase) |
| `VITE_SUPABASE_FUNCTIONS_URL` | `https://uicpkqwmjjrywojhwctq.functions.supabase.co` |
| `VITE_MEDIA_BASE_URL` | `https://media.mibiss.com.co` |
| `VITE_PUBLIC_BASE_URL` | `https://mibiss.com.co` |
| `VITE_APP_NAME` | `BISS` |
| `VITE_APP_TAGLINE` | `Solo cosas buenas` |

> **Importante:** todas las vars que pisa Vite deben tener prefijo `VITE_`. Si falta el prefijo, no llegan al bundle.

## Build settings

| Campo | Valor |
|---|---|
| Framework preset | None (custom) |
| Build command | `cd frontend && npm install && npm run build` |
| Build output directory | `frontend/dist` |
| Root directory | (vacío) |
| Node version | 20 |

> El proyecto vive en monorepo (`frontend/` + `backend/` + `db/`). Pages tiene que entrar al subdirectorio `frontend/` para correr `npm install`/`build`, y publicar `frontend/dist`. No mover archivos a la raíz.

## Custom domain

Conectar `mibiss.com.co` y `www.mibiss.com.co` después del primer deploy exitoso:

1. Pages → biss → Custom domains → Set up a custom domain.
2. Pega `mibiss.com.co`. Cloudflare detecta que el dominio ya está en tu cuenta y crea el CNAME apex automáticamente.
3. Repite con `www.mibiss.com.co` y crea un Page Rule "Redirect www → apex" si quieres canonical sin www.
