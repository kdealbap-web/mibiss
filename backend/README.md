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
| `otp-send` | `POST /otp-send` | anon | Crea Twilio Verify, registra `verificaciones_otp`, aplica rate limit. |
| `otp-verify` | `POST /otp-verify` | anon | Verifica el código, marca al ciudadano como `verificado_sms=true` y crea `auth.users`. |
| `b2-presign` | `POST /b2-presign` | authn | Devuelve URL firmada de Backblaze B2 (S3 compat) para subida directa. |
| `og-image` | `GET /og-image?caso=...` | anon | Genera OG image (1200×630) si el caso no tiene foto. Cachea en bucket `og-generated`. |
| `notify-email` | interno | service_role | Envía email vía Resend (bienvenida, solicitud aprobada/rechazada, cambio estado). |
| `refresh-stats` | cron | service_role | `REFRESH MATERIALIZED VIEW` cada 5 min. |

## Variables de entorno (Supabase Project Settings → Functions → Secrets)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=

B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET=labitacoradesoledad
B2_S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_PUBLIC_BASE_URL=https://f005.backblazeb2.com/file/labitacoradesoledad
# OJO: el bucket B2 se mantiene con su nombre legacy `labitacoradesoledad`
# porque ya está creado y enlazado a la Application Key del proyecto.
# El código y las URLs públicas internas (PUBLIC_BASE_URL) ya migraron a BISS.

RESEND_API_KEY=

PUBLIC_BASE_URL=https://biss.co
```

## Despliegue local de edge functions

```bash
# Instalar Supabase CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref [REF]
supabase functions deploy otp-send
supabase functions deploy otp-verify
supabase functions deploy b2-presign
supabase functions deploy og-image
supabase functions deploy notify-email
supabase functions deploy refresh-stats

# Programar cron de refresh (cada 5 minutos)
supabase functions schedule refresh-stats --cron "*/5 * * * *"
```
