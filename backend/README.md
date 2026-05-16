# 🛠️ Backend · BISS (Banco de Ideas y Soluciones de Soledad)

El "backend" propio es delgado: la mayor parte vive en Supabase (PostgreSQL + Auth + RLS).
Lo que sí va en este folder:

| Pieza | Para qué |
|-------|----------|
| `lib/` | Cliente Supabase tipado, helpers comunes, validación con Zod, errores. |
| `services/` | Capa de servicios (orquesta llamadas a la DB) consumida desde el frontend. Una clase por agregado. |
| `schemas/` | Esquemas Zod compartidos: `caso`, `ciudadano`, `solicitud`, etc. |
| `edge-functions/` | **Supabase Edge Functions** (Deno). Exponen endpoints serverless con `service_role`. |

## Edge Functions desplegadas

| Función | Ruta | Auth | Qué hace |
|---------|------|:----:|----------|
| `otp-send` | `POST /otp-send` | anon | **DEPRECATED** (Twilio). Reemplazado por Supabase Auth `signInWithOtp` con SMTP custom (Resend) directo desde el frontend. |
| `otp-verify` | `POST /otp-verify` | anon | **DEPRECATED** (Twilio). Reemplazado por `verifyOtp({ type: 'email' })`. |
| `r2-presign` | `POST /r2-presign` | authn | Devuelve URL firmada de Cloudflare R2 (S3 compat) para subida directa. |
| `og-image` | `GET /og-image?caso=...` | anon | Genera OG image (1200×630) si el caso no tiene foto. Cachea en R2. |
| `notify-email` | interno | service_role | Envía email vía Resend (bienvenida, solicitud aprobada/rechazada, cambio estado). |
| `refresh-stats` | cron | service_role | `REFRESH MATERIALIZED VIEW` cada 5 min. |

## Variables de entorno (Supabase Project Settings → Functions → Secrets)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2 (S3 compat). Endpoint con accountId, región fija "auto".
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=mibissbucket
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://media.mibiss.com.co

RESEND_API_KEY=

PUBLIC_BASE_URL=https://mibiss.com.co
```

## Despliegue local de edge functions

```bash
# Instalar Supabase CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref uicpkqwmjjrywojhwctq
supabase functions deploy r2-presign
supabase functions deploy og-image
supabase functions deploy notify-email
supabase functions deploy refresh-stats

# Programar cron de refresh (cada 5 minutos)
supabase functions schedule refresh-stats --cron "*/5 * * * *"
```
