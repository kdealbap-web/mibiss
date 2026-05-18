// =============================================================================
// invitar-editor · POST { email, nombre, rol }
// - Valida que el caller es admin/superadmin (consulta usuarios_cms).
// - Llama auth.admin.inviteUserByEmail(email) con redirectTo a /recuperar/nueva-contrasena.
// - Inserta row en public.usuarios_cms con id=auth.user.id, nombre, rol, activo=true.
// =============================================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

interface InvitarPayload {
  email?: string;
  nombre?: string;
  rol?: 'editor' | 'admin';
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return jsonResponse({ error: 'no_token' }, 401);

  const supa = getServiceClient();
  const { data: { user }, error: uErr } = await supa.auth.getUser(auth.slice(7));
  if (uErr || !user) return jsonResponse({ error: 'token_invalido' }, 401);

  // Valida que el caller es admin o superadmin activo
  const { data: caller } = await supa
    .from('usuarios_cms')
    .select('rol, activo')
    .eq('id', user.id)
    .maybeSingle();
  if (!caller || !caller.activo || (caller.rol !== 'admin' && caller.rol !== 'superadmin')) {
    return jsonResponse({ error: 'no_autorizado' }, 403);
  }

  const payload = (await req.json().catch(() => ({}))) as InvitarPayload;
  const email = (payload.email ?? '').trim().toLowerCase();
  const nombre = (payload.nombre ?? '').trim();
  const rol = payload.rol === 'admin' ? 'admin' : 'editor';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'email_invalido' }, 400);
  }
  if (nombre.length < 2 || nombre.length > 120) {
    return jsonResponse({ error: 'nombre_invalido' }, 400);
  }

  const publicBase = Deno.env.get('SITE_URL') ?? 'https://mibiss.com.co';

  const { data: invited, error: inviteErr } = await supa.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${publicBase}/recuperar/nueva-contrasena`,
  });
  if (inviteErr) {
    if (/already.*registered|exists/i.test(inviteErr.message)) {
      return jsonResponse({ error: 'usuario_existe', detail: inviteErr.message }, 409);
    }
    return jsonResponse({ error: 'invite_fallo', detail: inviteErr.message }, 500);
  }

  const newUid = invited?.user?.id;
  if (!newUid) return jsonResponse({ error: 'sin_uid' }, 500);

  const { error: insErr } = await supa
    .from('usuarios_cms')
    .insert({ id: newUid, email, nombre, rol, activo: true });
  if (insErr) {
    // Idempotente: si la row ya existe (re-invite), no romper.
    if (!/duplicate key/i.test(insErr.message)) {
      return jsonResponse({ error: 'usuarios_cms_insert_fallo', detail: insErr.message }, 500);
    }
  }

  return jsonResponse({ ok: true, uid: newUid, email, rol });
});
