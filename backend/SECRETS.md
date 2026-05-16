# 🔐 Secretos del backend

Las **Edge Functions** de Supabase NO leen archivos `.env` locales. Sus variables se configuran como _Secrets_ en el dashboard de Supabase y se inyectan en runtime vía `Deno.env.get(...)`.

## Dónde se configuran

Supabase Dashboard → tu proyecto → **Project Settings → Edge Functions → Secrets** (o `supabase secrets set` con la CLI).

## Variables requeridas

| Nombre                     | Quién la usa                     | De dónde sale                              |
|----------------------------|----------------------------------|--------------------------------------------|
| `SUPABASE_URL`             | todas las edge functions         | Auto-inyectado por Supabase (no setear)    |
| `SUPABASE_SERVICE_ROLE_KEY`| todas las edge functions         | Settings → API → `service_role` key        |
| `R2_ACCESS_KEY_ID`         | `r2-presign`                     | Cloudflare → R2 → Manage R2 API Tokens     |
| `R2_SECRET_ACCESS_KEY`     | `r2-presign`                     | Cloudflare → R2 → Manage R2 API Tokens     |
| `R2_BUCKET`                | `r2-presign`                     | Nombre del bucket R2 (ej. `mibissbucket`)  |
| `R2_ENDPOINT`              | `r2-presign`                     | `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_BASE_URL`       | `r2-presign`                     | Custom domain enlazado al bucket (`https://media.mibiss.com.co`) |
| `RESEND_API_KEY` (o SMTP)  | `notify-email`                   | Resend / SendGrid / SMTP                   |
| `EMAIL_FROM`               | `notify-email`                   | Dirección remitente verificada             |

> **OTP por email** lo maneja Supabase Auth nativo con el SMTP custom (Resend) configurado en _Authentication → SMTP Settings_. No requiere edge function dedicada — `signInWithOtp({ type: 'email' })` desde el frontend basta.

---

## 📦 Cloudflare R2 · Setup paso a paso

### 1. Bucket

1. Cloudflare Dashboard → R2 → Create bucket. Nombre: `mibissbucket`. Location hint: opcional.
2. El bucket queda privado por defecto. Para que `https://media.mibiss.com.co` sirva los archivos públicamente, conecta un **Public domain** en R2 → Settings → Public Access → Connect Domain.

### 2. Custom domain

1. Cloudflare Dashboard → R2 → mibissbucket → Settings → Custom Domains → Connect Domain.
2. `media.mibiss.com.co` → Cloudflare crea el CNAME automáticamente (dominio gestionado por Cloudflare).
3. Espera el propagado (≈ 2 min). El bucket ahora sirve en `https://media.mibiss.com.co/<key>`.

### 3. CORS (acción humana, no se hace con SQL)

Cloudflare Dashboard → R2 → mibissbucket → Settings → CORS Policy → pega este JSON:

```json
[
  {
    "AllowedOrigins": [
      "https://mibiss.com.co",
      "https://www.mibiss.com.co",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Sin esto, el navegador rechaza el PUT directo desde la SPA y `FlowReportar` paso 4 no podrá subir.

### 4. API Token con scope al bucket

1. R2 → Manage R2 API Tokens → Create API Token.
2. Permissions: **Object Read & Write**.
3. Bucket scope: **mibissbucket** (solo ese).
4. TTL: sin caducidad (o 1 año para rotación periódica).
5. Crear → te muestra UNA SOLA VEZ:
   - `Access Key ID` → `R2_ACCESS_KEY_ID`
   - `Secret Access Key` → `R2_SECRET_ACCESS_KEY`
6. El endpoint S3 lo muestra abajo: `https://<accountid>.r2.cloudflarestorage.com` → `R2_ENDPOINT`.

### 5. Cargar secretos en Supabase

#### Via CLI (recomendado)
```bash
supabase login
supabase link --project-ref uicpkqwmjjrywojhwctq

supabase secrets set R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set R2_BUCKET=mibissbucket
supabase secrets set R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
supabase secrets set R2_PUBLIC_BASE_URL=https://media.mibiss.com.co
```

#### Via Dashboard
Supabase → Project Settings → Edge Functions → Secrets → Add new → pega cada par `nombre=valor`.

### 6. Deploy de la edge function

```bash
supabase functions deploy r2-presign
```

### 7. Probar end-to-end

Desde el frontend (con sesión activa y `verificado_email=true`), abre FlowReportar → paso 4 → seleccionar foto → debería subir a `https://media.mibiss.com.co/casos-fotos/<uid>/...` (Sprint D).

---

## ⚠️ Reglas

- **`service_role` NUNCA va al frontend.** Solo edge functions y scripts de servidor.
- **`R2_SECRET_ACCESS_KEY` jamás en el frontend.** El frontend pide `r2-presign`, este firma con la API key, devuelve URL temporal (10 min). El cliente sube directo.
- Una API Token con scope a un solo bucket es buena defensa: aunque se filtre, no afecta otros buckets de la cuenta.
- Rotación: regenera el token cada 90 días o si sospechas filtración.
