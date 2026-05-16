// =============================================================================
// otp-send · POST { telefono }
// 1) Aplica rate limit (5/día/teléfono).
// 2) Pide a Twilio Verify que envíe el código.
// 3) Registra fila en verificaciones_otp.
// =============================================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_VERIFY_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')!;
const TWILIO_BASE = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`;

const MAX_OTP_DIA = 5;

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  let body: { telefono?: string };
  try { body = await req.json(); } catch { return jsonResponse({ error: 'json_invalido' }, 400); }
  const telefono = (body.telefono ?? '').trim();
  if (!/^(\+57)?3\d{9}$/.test(telefono)) {
    return jsonResponse({ error: 'telefono_invalido' }, 400);
  }
  const e164 = telefono.startsWith('+') ? telefono : '+57' + telefono;

  const supa = getServiceClient();

  // Rate limit: contar OTP en últimas 24h
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supa.from('verificaciones_otp')
    .select('id', { count: 'exact', head: true })
    .eq('telefono', e164)
    .gte('creado_en', desde);
  if ((count ?? 0) >= MAX_OTP_DIA) {
    return jsonResponse({ error: 'rate_limit', message: 'Demasiados intentos hoy. Intenta mañana.' }, 429);
  }

  // Twilio Verify
  const params = new URLSearchParams({ To: e164, Channel: 'sms' });
  const tw = await fetch(TWILIO_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  if (!tw.ok) {
    const txt = await tw.text();
    console.error('Twilio error', tw.status, txt);
    return jsonResponse({ error: 'twilio_error' }, 502);
  }
  const twJson = await tw.json();

  await supa.from('verificaciones_otp').insert({
    telefono: e164,
    twilio_sid: twJson.sid,
    status: 'enviado',
    expira_en: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  return jsonResponse({ ok: true, expira_segundos: 600 });
});
