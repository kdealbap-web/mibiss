// =============================================================================
// r2-presign · POST { bucket, filename, contentType, bytes }
// Devuelve URL firmada para subida directa PUT a Cloudflare R2 (S3 compat).
// El "bucket" del payload es realmente un PREFIJO LÓGICO dentro del bucket R2.
// =============================================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const ACCESS_KEY_ID     = Deno.env.get('R2_ACCESS_KEY_ID')!;
const SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
const BUCKET            = Deno.env.get('R2_BUCKET')!;            // ej. mibissbucket
const ENDPOINT          = Deno.env.get('R2_ENDPOINT')!;          // https://<accountid>.r2.cloudflarestorage.com
const REGION            = 'auto';                                // R2 siempre usa "auto"
const PUBLIC_BASE       = Deno.env.get('R2_PUBLIC_URL')!;   // https://media.mibiss.com.co

// SigV4 mínimo para PUT presigned URL. R2 expone exactamente el mismo protocolo
// S3-SigV4 que B2/AWS S3 cambiando host y región a "auto".
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    'raw',
    key instanceof Uint8Array ? key : new Uint8Array(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
}
function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function presignPut(key: string): Promise<string> {
  const service = 's3';
  const host = new URL(ENDPOINT).host;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const expiresIn = 600;
  const credScope = `${dateStamp}/${REGION}/${service}/aws4_request`;
  const credential = `${ACCESS_KEY_ID}/${credScope}`;

  const url = new URL(`${ENDPOINT}/${BUCKET}/${key}`);
  url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
  url.searchParams.set('X-Amz-Credential', credential);
  url.searchParams.set('X-Amz-Date', amzDate);
  url.searchParams.set('X-Amz-Expires', String(expiresIn));
  url.searchParams.set('X-Amz-SignedHeaders', 'host');

  const canonicalRequest = [
    'PUT',
    url.pathname,
    url.searchParams.toString(),
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate    = await hmac(new TextEncoder().encode('AWS4' + SECRET_ACCESS_KEY), dateStamp);
  const kRegion  = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  const sig = hex(await hmac(kSigning, stringToSign));

  url.searchParams.set('X-Amz-Signature', sig);
  return url.toString();
}

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  // Auth: solo usuarios autenticados
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return jsonResponse({ error: 'no_token' }, 401);

  const supa = getServiceClient();
  const { data: { user }, error: uErr } = await supa.auth.getUser(auth.slice(7));
  if (uErr || !user) return jsonResponse({ error: 'token_invalido' }, 401);

  const { bucket, filename, contentType, bytes } = await req.json();
  if (!bucket || !filename || !contentType || !bytes) {
    return jsonResponse({ error: 'parametros_faltan' }, 400);
  }

  // El "bucket" del payload es prefijo lógico dentro del bucket R2 físico.
  const caps: Record<string, number> = {
    'casos-fotos': 5, 'casos-videos': 30, 'casos-pdfs': 10,
    'barrios-portadas': 5, 'solicitudes-multimedia': 5, 'padrinos-logos': 2,
  };
  if (!(bucket in caps)) return jsonResponse({ error: 'bucket_invalido' }, 400);
  const max = caps[bucket] * 1024 * 1024;
  if (bytes > max) return jsonResponse({ error: 'archivo_excede_limite' }, 400);

  // Path único: prefix/uid/yyyymm/uuid-filename.ext
  const safeName = filename.toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const yyyymm = new Date().toISOString().slice(0, 7).replace('-', '');
  const key = `${bucket}/${user.id}/${yyyymm}/${crypto.randomUUID()}-${safeName}`;

  const uploadUrl = await presignPut(key);

  return jsonResponse({
    upload_url: uploadUrl,
    public_url: `${PUBLIC_BASE}/${key}`,
    expires_in: 600,
    headers: { 'Content-Type': contentType },
  });
});
