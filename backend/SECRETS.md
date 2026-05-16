# 🔐 Secretos del backend

Las **Edge Functions** de Supabase NO leen archivos `.env` locales. Sus variables se configuran como _Secrets_ en el dashboard de Supabase y se inyectan en runtime vía `Deno.env.get(...)`.

## Dónde se configuran

Supabase Dashboard → tu proyecto → **Project Settings → Edge Functions → Secrets** (o `supabase secrets set` con la CLI).

## Variables requeridas

| Nombre                     | Quién la usa                     | De dónde sale                              |
|----------------------------|----------------------------------|--------------------------------------------|
| `SUPABASE_URL`             | todas las edge functions         | Auto-inyectado por Supabase (no setear)    |
| `SUPABASE_SERVICE_ROLE_KEY`| todas las edge functions         | Settings → API → `service_role` key        |
| `B2_KEY_ID`                | `b2-presign`                     | Backblaze → App Keys → keyID               |
| `B2_APPLICATION_KEY`       | `b2-presign`                     | Backblaze → App Keys → applicationKey      |
| `B2_BUCKET`                | `b2-presign`                     | Nombre del bucket B2 (ej. `labitacoradesoledad`) |
| `B2_S3_ENDPOINT`           | `b2-presign`                     | Endpoint S3-compat del bucket (ej. `https://s3.us-west-002.backblazeb2.com`) |
| `B2_REGION`                | `b2-presign`                     | Región B2 (ej. `us-west-002`)              |
| `B2_PUBLIC_BASE_URL`       | `b2-presign`                     | Friendly URL pública (`https://f005.backblazeb2.com/file/<bucket>`) o custom domain |
| `TWILIO_ACCOUNT_SID`       | `otp-send`, `otp-verify`         | Twilio Console                             |
| `TWILIO_AUTH_TOKEN`        | `otp-send`, `otp-verify`         | Twilio Console                             |
| `TWILIO_VERIFY_SID`        | `otp-send`, `otp-verify`         | Twilio Verify Service SID                  |
| `RESEND_API_KEY` (o SMTP)  | `notify-email`                   | Resend / SendGrid / SMTP                   |
| `EMAIL_FROM`               | `notify-email`                   | Dirección remitente verificada             |

---

## 📦 Backblaze B2 · Setup paso a paso

### 1. Crear cuenta y bucket

1. https://www.backblaze.com/sign-up/cloud-storage → cuenta gratis (10 GB storage, 1 GB/día download libre, $0.006/GB/mes después del free tier).
2. Dashboard → **My Account → Verify your account** (te piden tarjeta para activar B2; gratis hasta el límite).
3. **Buckets → Create a Bucket:**
   - Bucket Unique Name: `labitacoradesoledad`
   - Files in Bucket: **Public**
   - Default Encryption: **Enable** (SSE-B2)
   - Object Lock: **Disable**

### 2. Obtener endpoint y región

Una vez creado, en la página del bucket verás:
- **Endpoint** (S3 compatible): algo como `s3.us-west-002.backblazeb2.com`
- **Region**: `us-west-002` (o la que asignaron)
- **Friendly URL** de un archivo: `https://f<NN>.backblazeb2.com/file/<bucket>/<key>` — ese prefijo `https://f<NN>.backblazeb2.com/file/<bucket>` es tu `B2_PUBLIC_BASE_URL`.

> Si la cuenta es nueva probablemente sea `us-west-002` y el friendly subdominio `f005`. No los inventes — confirma en el dashboard.

### 3. Crear Application Key con scope al bucket

1. **App Keys → Add a New Application Key**:
   - Name: `labitacora-edge-prod`
   - Allow access to Bucket(s): selecciona **solo** `labitacoradesoledad`
   - Type of Access: **Read and Write**
   - Allow List All Bucket Names: **No**
   - File name prefix / Lifetime: dejar en blanco
2. **Create New Key** → te muestra UNA SOLA VEZ:
   - `keyID` → `B2_KEY_ID`
   - `applicationKey` → `B2_APPLICATION_KEY`
   - Copia ambos a un gestor de contraseñas YA. Si los pierdes, regeneras.

### 4. Cargar secretos en Supabase

#### Via CLI (recomendado)
```bash
supabase login
supabase link --project-ref uicpkqwmjjrywojhwctq

supabase secrets set B2_KEY_ID=00xxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set B2_APPLICATION_KEY=K005xxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set B2_BUCKET=labitacoradesoledad
supabase secrets set B2_S3_ENDPOINT=https://s3.us-west-002.backblazeb2.com
supabase secrets set B2_REGION=us-west-002
supabase secrets set B2_PUBLIC_BASE_URL=https://f005.backblazeb2.com/file/labitacoradesoledad
```

#### Via Dashboard
Supabase → Project Settings → Edge Functions → Secrets → Add new → pega cada par `nombre=valor`.

### 5. Deploy de la edge function

```bash
supabase functions deploy b2-presign
```

### 6. Probar end-to-end

Desde el frontend, login como usuario, intenta subir una foto en CMS → debería verse en `https://f005.backblazeb2.com/file/labitacoradesoledad/casos-fotos/...`.

---

## 🌐 Custom domain con CDN gratis (recomendado para producción)

Backblaze + Cloudflare tienen un acuerdo de **egress gratis** vía CDN. Configuración:

1. Apunta `media.labitacoradesoledad.co` (CNAME) a `f005.backblazeb2.com` en Cloudflare DNS.
2. En Cloudflare Page Rules: forzar HTTPS, cache TTL alto (1 mes).
3. Cambia `B2_PUBLIC_BASE_URL` a `https://media.labitacoradesoledad.co/file/labitacoradesoledad`.
4. Ahora todas las descargas pasan por el CDN de Cloudflare → B2 ve egress local del Bandwidth Alliance → cobro $0 incluso superando el free tier.

---

## ⚠️ Reglas

- **`service_role` NUNCA va al frontend.** Solo edge functions y scripts de servidor.
- **`B2_APPLICATION_KEY` jamás en el frontend.** El frontend pide `b2-presign`, este firma con la app key, devuelve URL temporal (10 min). El cliente sube directo.
- Si tienes proyectos Supabase separados dev/prod, configura los secretos en cada uno con buckets B2 también separados (`biss-dev`, `biss-prod`).
- Una App Key con scope a un solo bucket es buena defensa: aunque se filtre, no afecta otros buckets de la cuenta.
- Rotación: regenera la Application Key cada 90 días o si sospechas filtración.
