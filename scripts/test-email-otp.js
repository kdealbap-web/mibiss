// ============================================================================
// BISS · Test Resend ↔ Supabase Auth
// Uso: node scripts/test-email-otp.mjs tu@email.com
// ============================================================================

// Llamada directa a /auth/v1/otp (lo que supabase-js hace internamente en signInWithOtp).
// Evita arrastrar realtime-js, que requiere WebSocket nativo (Node 22+) o ws.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer backend/.env.secrets
let envFile;
try {
  envFile = readFileSync(join(__dirname, '..', 'backend', '.env.secrets'), 'utf8');
} catch (e) {
  console.error('❌ No encuentro backend/.env.secrets');
  process.exit(1);
}

// Parser simple de .env
const env = {};
for (const line of envFile.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error('❌ Falta SUPABASE_URL o SUPABASE_ANON_KEY en .env.secrets');
  console.error('   URL:', URL ? '✅' : '❌');
  console.error('   KEY:', KEY ? '✅' : '❌');
  process.exit(1);
}

const email = process.argv[2];
if (!email || !email.includes('@')) {
  console.error('❌ Uso: node scripts/test-email-otp.mjs tu@email.com');
  process.exit(1);
}

console.log('🔧 URL:    ', URL);
console.log('🔑 Key:    ', KEY.slice(0, 25) + '...');
console.log('📧 Destino:', email);
console.log('');

console.log('📤 Enviando OTP por email...');
const res = await fetch(`${URL}/auth/v1/otp`, {
  method: 'POST',
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email,
    create_user: true,
  }),
});

const bodyText = await res.text();
let body;
try { body = JSON.parse(bodyText); } catch { body = bodyText; }

if (!res.ok) {
  const message = typeof body === 'object' ? (body.msg ?? body.error ?? body.message ?? JSON.stringify(body)) : body;
  console.error('❌ Error:', message);
  console.error('   Status:', res.status);
  console.error('');
  console.error('Diagnóstico:');
  if (String(message).includes('Email signups')) {
    console.error('  → User Signups OFF en Auth → Sign In/Providers');
  } else if (String(message).includes('rate')) {
    console.error('  → Rate limit del SMTP. Espera unos minutos.');
  } else if (String(message).includes('Email rate')) {
    console.error('  → SMTP custom NO conectado, sigues con default (rate limit 2/h)');
  } else {
    console.error('  → Verifica SMTP Settings en Project Settings → Auth');
  }
  process.exit(1);
}

console.log('✅ Petición exitosa.');
console.log('   Response:', JSON.stringify(body, null, 2));
console.log('');
console.log('📬 Revisa inbox (también spam) en 30-60 seg.');
console.log('   Remitente: noreply@mibiss.com.co');