// =============================================================================
// og-image · GET /og-image?caso=<casoId>
// Genera SVG → PNG 1200x630 si el caso no tiene foto. Cachea en bucket og-generated.
// Si el caso ya tiene foto, redirige a esa.
// =============================================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const PUBLIC_BASE = Deno.env.get('PUBLIC_BASE_URL') ?? 'https://biss.co';

const ESTADO_BG: Record<string, string> = {
  critico:  '#E4042C',
  progreso: '#FDC746',
  resuelto: '#3DAF6C',
};

function svgFor(opts: { titulo: string; barrio: string; estado: string; categoria: string }) {
  const bg = ESTADO_BG[opts.estado] ?? '#06777C';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#06777C"/>
        <stop offset="1" stop-color="${bg}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="60" y="60" width="1080" height="510" rx="20" fill="#FFFFFF" opacity="0.06"/>
    <text x="100" y="140" font-family="'VAG Rounded Next', system-ui, sans-serif" font-size="32" fill="#FFFFFF" opacity="0.9">BISS · Banco de Ideas y Soluciones de Soledad</text>
    <text x="100" y="220" font-family="'VAG Rounded Next', system-ui, sans-serif" font-size="28" fill="#FFFFFF" opacity="0.7">Capítulo · ${escapeXml(opts.barrio)}</text>
    <foreignObject x="100" y="260" width="1000" height="240">
      <div xmlns="http://www.w3.org/1999/xhtml"
           style="font-family: 'VAG Rounded Next', system-ui, sans-serif; color:white; font-size:64px; line-height:1.15; font-weight:800">
        ${escapeXml(opts.titulo)}
      </div>
    </foreignObject>
    <rect x="100" y="510" rx="14" width="${30 + opts.estado.length * 22}" height="46" fill="#FFFFFF" opacity="0.18"/>
    <text x="118" y="542" font-family="'JetBrains Mono', monospace" font-size="22" fill="#FFFFFF">${escapeXml(opts.estado.toUpperCase())}</text>
    <text x="100" y="600" font-family="'VAG Rounded Next', system-ui, sans-serif" font-size="22" fill="#FFFFFF" opacity="0.7">biss.co · Solo cosas buenas</text>
  </svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' } as any)[c]);
}

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const url = new URL(req.url);
  const casoId = url.searchParams.get('caso');
  if (!casoId) return jsonResponse({ error: 'caso_requerido' }, 400);

  const supa = getServiceClient();
  const { data: caso } = await supa.from('v_casos_publicos')
    .select('id, titulo, barrio_nombre, estado, categoria_nombre, portada_url')
    .eq('id', casoId).maybeSingle();
  if (!caso) return jsonResponse({ error: 'no_encontrado' }, 404);

  // Si ya hay foto, redirige
  if (caso.portada_url) {
    return Response.redirect(caso.portada_url, 302);
  }

  const svg = svgFor({
    titulo: caso.titulo, barrio: caso.barrio_nombre,
    estado: caso.estado, categoria: caso.categoria_nombre,
  });

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
});
