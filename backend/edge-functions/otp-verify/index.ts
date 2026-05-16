// =============================================================================
// otp-verify · POST { telefono, codigo, ciudadano_id }
// 1) Verifica el código con Twilio Verify.
// 2) Marca verificaciones_otp.status = verificado.
// 3) Marca ciudadanos.verificado_sms = true.
// 4) Crea (o vincula) auth.users con magic-link self-issue (passwordless).
// Devuelve { ok, session, ciudadano_id }.
// =============================================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_VERIFY_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')!;
const CHECK_URL = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`;

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const { telefono, codigo, ciudadano_id } = await req.json();
  if (!telefono || !codigo || !ciudadano_id) {
    return jsonResponse({ error: 'parametros_faltan' }, 400);
  }
  const e164 = String(telefono).startsWith('+') ? telefono : '+57' + telefono;

  const supa = getServiceClient();

  // Comprobar último OTP no expirado
  const { data: lastOtp } = await supa.from('verificaciones_otp')
    .select('id, intentos, status, expira_en')
    .eq('telefono', e164)
    .order('creado_en', { ascending: false })
    .limit(1).maybeSingle();

  if (!lastOtp) return jsonResponse({ error: 'sin_otp_activo' }, 400);
  if (lastOtp.status === 'verificado') return jsonResponse({ error: 'ya_verificado' }, 400);
  if (new Date(lastOtp.expira_en).getTime() < Date.now()) {
    await supa.from('verificaciones_otp').update({ status: 'expirado' }).eq('id', lastOtp.id);
    return jsonResponse({ error: 'expirado' }, 400);
  }
  if (lastOtp.intentos >= 3) return jsonResponse({ error: 'demasiados_intentos' }, 429);

  // Llamar a Twilio Verify
  const params = new URLSearchParams({ To: e164, Code: String(codigo) });
  const tw = await fetch(CHECK_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const twJson = await tw.json();

  await supa.from('verificaciones_otp')
    .update({ intentos: lastOtp.intentos + 1, ciudadano_id })
    .eq('id', lastOtp.id);

  if (twJson.status !== 'approved') {
    return jsonResponse({ error: 'codigo_invalido' }, 400);
  }

  // Marca OTP verificado
  await supa.from('verificaciones_otp').update({ status: 'verificado' }).eq('id', lastOtp.id);

  // Trae ciudadano
  const { data: cdn, error: cErr } = await supa.from('ciudadanos')
    .select('id, email, nombres, apellidos, auth_user_id')
    .eq('id', ciudadano_id).maybeSingle();
  if (cErr || !cdn) return jsonResponse({ error: 'ciudadano_no_existe' }, 404);

  // Crear o reutilizar usuario auth
  let authUserId = cdn.auth_user_id;
  if (!authUserId) {
    const { data: created, error: aErr } = await supa.auth.admin.createUser({
      email: cdn.email,
      email_confirm: true,
      phone: e164,
      user_metadata: { nombre: `${cdn.nombres} ${cdn.apellidos}`, tipo: 'ciudadano' },
    });
    if (aErr || !created.user) {
      console.error('createUser error', aErr);
      return jsonResponse({ error: 'auth_create_failed' }, 500);
    }
    authUserId = created.user.id;
    await supa.from('ciudadanos')
      .update({ auth_user_id: authUserId, verificado_sms: true })
      .eq('id', ciudadano_id);
  } else {
    await supa.from('ciudadanos').update({ verificado_sms: true }).eq('id', ciudadano_id);
  }

  // Magic-link de un solo uso para login inmediato
  const { data: link } = await supa.auth.admin.generateLink({
    type: 'magiclink',
    email: cdn.email,
  });

  return jsonResponse({
    ok: true,
    ciudadano_id,
    auth_user_id: authUserId,
    magic_link: link?.properties?.action_link ?? null,
  });
});
