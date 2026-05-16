# BISS · Banco de Ideas y Soluciones de Soledad

Plataforma cívica del municipio de Soledad (Atlántico, Colombia). Concejal Kevin Balvuena. Lema: *"Solo cosas buenas"*.

URL producción: <https://mibiss.com.co>

## Estructura

```
biss/
├── frontend/          Vite + React 18 + TS + React Router + Supabase + Leaflet
├── backend/           Edge Functions (Deno) + SECRETS.md + README
├── db/                Migraciones SQL numeradas
├── Design/            Prototipos HTML estáticos (fuente visual de verdad)
├── docs/              Cloudflare Pages config, smoke tests
├── scripts/           Scripts de soporte (test SMTP OTP, etc.)
└── HANDOFF.md         Contrato de implementación
```

## Desarrollo local

```bash
cd frontend
npm install
npm run dev
```

Abre <http://localhost:5173>.

Variables: `frontend/.env.development.local` (gitignored; pídela al equipo).

## Deploy a producción

### Requisitos previos

- Cuenta Cloudflare con dominio `mibiss.com.co` activo.
- Cuenta Supabase con proyecto `uicpkqwmjjrywojhwctq` (DB + Auth + Edge Functions).
- Cuenta Resend con dominio `mibiss.com.co` verificado (DKIM/SPF) y SMTP custom enchufado en Supabase Auth → Settings → SMTP.
- Bucket R2 `mibissbucket` creado, custom domain `media.mibiss.com.co` conectado, CORS configurado (ver `backend/SECRETS.md`).

### Pasos

1. Aplicar SQL migrations pendientes en Supabase Studio (orden importa):
   - `db/12-migration-email-auth.sql` — migración SMS → email.
   - `db/13-cleanup-mv-stats.sql` — fix MV `mv_stats_globales`.
2. Crear API Token R2 y subir secretos a Supabase Edge Functions (`backend/SECRETS.md`).
3. Desplegar edge function r2-presign:
   ```bash
   supabase functions deploy r2-presign --project-ref uicpkqwmjjrywojhwctq
   ```
4. Crear proyecto Cloudflare Pages conectado a GitHub `kdealbap-web/mibiss`. Build: `cd frontend && npm install && npm run build`. Output: `frontend/dist`.
5. Setear env vars en Pages (`docs/cloudflare-pages-env.md`).
6. Push a `main` → Pages auto-deploya.
7. Conectar custom domains `mibiss.com.co` + `www.mibiss.com.co`.
8. Correr el smoke test: `docs/smoke-test-prod.md`.

### Notas

- El registro de ciudadanos usa **OTP por email** (sin Twilio). El SMTP custom de Resend en Supabase Auth manda el código.
- Upload de fotos en FlowReportar paso 4 queda con preview local hasta Sprint D.

## Stack

| Capa | Tech |
|---|---|
| Build | Vite 5 + React 18 + TypeScript |
| Routing | React Router 6 |
| Data | Supabase (Postgres + Auth + Edge Functions) |
| State server | React Query |
| Auth | Supabase Auth (OTP email vía Resend SMTP custom) |
| Storage | Cloudflare R2 (S3 compat) en `media.mibiss.com.co` |
| Mapas | Leaflet 1.9.4 + tiles Carto Voyager |
| Iconos | Lucide React |
| Hosting | Cloudflare Pages |

## Contribuir

El prototipo HTML en `Design/` es la fuente visual de verdad. **No** se introduce Tailwind atómico, **no** se cambia la fuente VAG Rounded Next, **no** se reemplaza el logo PNG canónico. Tono UI: tú, nunca usted.

Para detalles: `HANDOFF.md`.
