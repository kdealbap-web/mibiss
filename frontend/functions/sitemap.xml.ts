// Cloudflare Pages Function · proxy GET /sitemap.xml → edge function Supabase.
// Existe porque `_redirects` con status 200 en Cloudflare Pages no soporta
// destinos en otros hosts (solo rewrites internos). Cache 1h en CDN para no
// golpear Supabase en cada crawl.

interface Env {}

export const onRequestGet: PagesFunction<Env> = async () => {
  const upstream = await fetch(
    'https://uicpkqwmjjrywojhwctq.supabase.co/functions/v1/sitemap-xml',
    { method: 'GET' },
  );

  if (!upstream.ok) {
    return new Response('Sitemap upstream error', {
      status: 502,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const xml = await upstream.text();
  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
      'access-control-allow-origin': '*',
    },
  });
};
