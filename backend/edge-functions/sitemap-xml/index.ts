// =============================================================================
// sitemap-xml · GET
// Sitemap.xml dinámico con casos.slug + barrios.slug + capitulos activos.
// Sin auth — endpoint público leído por crawlers.
// =============================================================================
import { getServiceClient } from '../_shared/supabase.ts';

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://mibiss.com.co';

interface RawCaso {
  slug: string | null;
  publicado_en: string | null;
  actualizado_en: string;
}

interface RawBarrioSlug {
  barrio_slug: string;
  activado_en: string;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod.slice(0, 10)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supa = getServiceClient();
  const [casosRes, capsRes] = await Promise.all([
    supa
      .from('v_casos_publicos')
      .select('slug, publicado_en, actualizado_en')
      .not('slug', 'is', null)
      .order('actualizado_en', { ascending: false })
      .limit(5000),
    supa
      .from('v_capitulos_publicos')
      .select('barrio_slug, activado_en')
      .order('activado_en', { ascending: false })
      .limit(500),
  ]);

  const now = new Date().toISOString();
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntry(SITE_URL + '/', now, 'daily', '1.0'),
    urlEntry(SITE_URL + '/home', now, 'daily', '0.9'),
    urlEntry(SITE_URL + '/login', now, 'monthly', '0.3'),
  ];

  ((capsRes.data ?? []) as RawBarrioSlug[]).forEach((c) => {
    lines.push(
      urlEntry(`${SITE_URL}/capitulo/${c.barrio_slug}`, c.activado_en, 'weekly', '0.7'),
    );
  });

  ((casosRes.data ?? []) as RawCaso[]).forEach((c) => {
    if (!c.slug) return;
    lines.push(
      urlEntry(
        `${SITE_URL}/caso/${c.slug}`,
        c.actualizado_en ?? c.publicado_en ?? now,
        'weekly',
        '0.6',
      ),
    );
  });

  lines.push('</urlset>');

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'access-control-allow-origin': '*',
    },
  });
});
