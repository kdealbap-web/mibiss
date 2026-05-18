// =============================================================================
// notify-email · POST { tipo, ciudadano_id, ...payload }
// Tipos: 'bienvenida' | 'solicitud_recibida' | 'solicitud_aprobada' | 'solicitud_rechazada' | 'caso_avanzo'
// Solo invocada desde service_role.
// =============================================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM = Deno.env.get('EMAIL_FROM') ?? 'BISS <hola@biss.co>';

const TPL: Record<string, (p: any) => { subject: string; html: string }> = {
  bienvenida: (p) => ({
    subject: '👋 Bienvenido a BISS — Banco de Ideas y Soluciones de Soledad',
    html: `<h1>Hola, ${p.nombres}</h1>
      <p>Tu cuenta quedó verificada. Ya puedes solicitar casos para tu barrio y comentar en la bitácora.</p>
      <p style="margin-top:24px"><a href="${p.base}" style="background:#0CB9C1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">Abrir la web</a></p>`,
  }),
  solicitud_recibida: (p) => ({
    subject: '📝 Recibimos tu solicitud',
    html: `<h1>Hola, ${p.nombres}</h1>
      <p>Recibimos tu solicitud "<b>${p.titulo}</b>" del barrio ${p.barrio}.</p>
      <p>Nuestro equipo la revisará y te notificaremos.</p>`,
  }),
  solicitud_aprobada: (p) => ({
    subject: '✅ Tu solicitud fue aprobada',
    html: `<h1>${p.nombres}, ¡buenas noticias!</h1>
      <p>Aprobamos tu solicitud "${p.titulo}". El caso ya hace parte del banco.</p>
      <p><a href="${p.url}">Ver el caso</a></p>`,
  }),
  solicitud_rechazada: (p) => ({
    subject: '❗ Tu solicitud no pudo ser aprobada',
    html: `<h1>Hola, ${p.nombres}</h1>
      <p>No pudimos aprobar tu solicitud "${p.titulo}".</p>
      <p>Motivo: ${p.motivo}</p>
      <p>Puedes presentar otra solicitud cuando quieras.</p>`,
  }),
  caso_avanzo: (p) => ({
    subject: '📰 Hay novedades en un caso que sigues',
    html: `<h1>${p.titulo}</h1>
      <p>El caso pasó a estado <b>${p.estado}</b>.</p>
      <p><a href="${p.url}">Ver línea de tiempo</a></p>`,
  }),
};

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const { tipo, ciudadano_id, payload } = await req.json();
  if (!tipo || !ciudadano_id || !TPL[tipo]) return jsonResponse({ error: 'tipo_invalido' }, 400);

  const supa = getServiceClient();
  const { data: cdn } = await supa.from('ciudadanos')
    .select('email, nombres, acepta_notificaciones, eliminado_en')
    .eq('id', ciudadano_id).maybeSingle();
  if (!cdn || cdn.eliminado_en || !cdn.acepta_notificaciones) {
    return jsonResponse({ ok: true, skipped: true });
  }

  const tpl = TPL[tipo]({ ...payload, nombres: cdn.nombres, base: Deno.env.get('SITE_URL') ?? 'https://mibiss.com.co' });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: cdn.email, subject: tpl.subject, html: tpl.html }),
  });
  if (!r.ok) {
    const txt = await r.text();
    console.error('Resend error', r.status, txt);
    return jsonResponse({ error: 'resend_error' }, 502);
  }
  return jsonResponse({ ok: true });
});
