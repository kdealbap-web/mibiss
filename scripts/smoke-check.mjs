// =============================================================================
// BISS · smoke check de producción
// Ejecuta tests HTTP + Supabase y devuelve JSON con resultados por test.
// Uso: node scripts/smoke-check.mjs
// =============================================================================
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import https from 'https';
import { URL as NodeURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Algunas redes locales (proxies SSL corporativos) rompen verificación de cert.
// Deshabilitamos solo para smoke test — anotado en reporte.
const agent = new https.Agent({ rejectUnauthorized: false });

function parseEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const env = parseEnv(join(ROOT, 'backend', '.env.secrets'));
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

function request(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve) => {
    const u = new NodeURL(url);
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers,
      agent,
      timeout: 20000,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function pgrest(table, query = '*', extra = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(query)}${extra}`;
  return request(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
}

const results = [];
function record(id, title, passed, note, detail) {
  results.push({ id, title, passed, note, detail });
  const icon = passed === true ? '✅' : passed === false ? '❌' : '⚠️ ';
  console.log(`${icon} ${id} ${title} — ${note}`);
}

// -----------------------------------------------------------------------------
// 1.1 HTTP 200 raíz
const r11 = await request('https://mibiss.com.co');
{
  const ok = r11.status === 200;
  record(
    '1.1',
    'GET https://mibiss.com.co',
    ok,
    r11.error ? `error: ${r11.error}` : `status=${r11.status} server=${r11.headers?.server} cf-ray=${r11.headers?.['cf-ray'] ?? 'no'}`,
    { status: r11.status, server: r11.headers?.server, cfRay: r11.headers?.['cf-ray'] },
  );
}

// 1.2 Meta tags
const r12 = r11.body && r11.body.length > 0 ? r11 : await request('https://mibiss.com.co');
{
  const html = r12.body ?? '';
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const ogTitle = html.match(/og:title["'][^"']*content=["']([^"']+)/);
  const ogDesc = html.match(/og:description["'][^"']*content=["']([^"']+)/);
  const ogImage = html.match(/og:image["'][^"']*content=["']([^"']+)/);
  const twitterCard = html.match(/twitter:card["'][^"']*content=["']([^"']+)/);
  const canonical = html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/);
  const ok = !!(titleMatch && /BISS/i.test(titleMatch[1]) && ogTitle && ogDesc);
  record(
    '1.2',
    'HTML contiene meta tags BISS',
    ok,
    ok
      ? `title="${titleMatch[1]}" og:title=ok og:image=${ogImage ? 'ok' : 'falta'} canonical=${canonical ? canonical[1] : 'falta'}`
      : 'faltan tags clave',
    { title: titleMatch?.[1], ogTitle: ogTitle?.[1], ogDesc: ogDesc?.[1], ogImage: ogImage?.[1], canonical: canonical?.[1], twitterCard: twitterCard?.[1] },
  );
}

// 1.3 Bundle JS
{
  const html = r12.body ?? '';
  const jsMatches = [...html.matchAll(/src=["'](\/assets\/[^"']+\.js)["']/g)].map((m) => m[1]);
  if (jsMatches.length === 0) {
    record('1.3', 'Bundle JS referenciado', false, 'no se encontraron /assets/*.js en el HTML', { jsMatches });
  } else {
    const first = jsMatches[0];
    const r = await request(`https://mibiss.com.co${first}`, { method: 'HEAD' });
    const ok = r.status === 200 && /javascript/i.test(r.headers?.['content-type'] ?? '');
    record(
      '1.3',
      'Bundle JS sirve 200 + content-type JS',
      ok,
      `${first} → status=${r.status} content-type=${r.headers?.['content-type']}`,
      { jsMatches, first, status: r.status, contentType: r.headers?.['content-type'] },
    );
  }
}

// 1.4 SPA routing (_redirects)
{
  const r = await request('https://mibiss.com.co/caso/ruta-que-no-existe-aaa-bbb');
  const ok = r.status === 200;
  record(
    '1.4',
    '_redirects → ruta inexistente sirve index.html',
    ok,
    `status=${r.status}`,
    { status: r.status, isHtml: /<html/i.test(r.body ?? '') },
  );
}

// 1.5 robots.txt
{
  const r = await request('https://mibiss.com.co/robots.txt');
  const body = r.body ?? '';
  const ok = r.status === 200 && /User-agent/i.test(body) && /Sitemap/i.test(body);
  record('1.5', 'robots.txt', ok, ok ? 'sirve y contiene Sitemap' : `status=${r.status} bodyLen=${body.length}`, {
    status: r.status,
    body,
  });
}

// 1.6 edge function r2-presign
{
  const r = await request(`${SUPABASE_URL}/functions/v1/r2-presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  // Esperado: 401 + body con error no_token. 404 = no desplegada. 500 = bug.
  const ok = r.status === 401;
  record(
    '1.6',
    'Edge function r2-presign vivo (401 sin token)',
    ok,
    `status=${r.status} body=${(r.body ?? '').slice(0, 100)}`,
    { status: r.status, body: r.body },
  );
}

// 1.7 media.mibiss.com.co
{
  const r = await request('https://media.mibiss.com.co/test-no-existe.jpg', { method: 'HEAD' });
  const ok = r.status === 404 || r.status === 403; // R2 puede devolver 404 o 403 según config
  record(
    '1.7',
    'media.mibiss.com.co subdominio activo',
    ok,
    `status=${r.status} server=${r.headers?.server} cf-ray=${r.headers?.['cf-ray']}`,
    { status: r.status, server: r.headers?.server, cfRay: r.headers?.['cf-ray'] },
  );
}

// -----------------------------------------------------------------------------
// 2.1 Casos demo existen
{
  const r = await pgrest('casos', 'slug,titulo,estado', '&limit=20');
  if (r.status !== 200) {
    record('2.1', 'Casos demo en DB', false, `status=${r.status} body=${(r.body ?? '').slice(0, 200)}`, r);
  } else {
    const rows = JSON.parse(r.body);
    record(
      '2.1',
      'Casos demo en DB',
      rows.length > 0,
      `${rows.length} casos públicos visibles`,
      { count: rows.length, rows },
    );
  }
}

// 2.1b Casos via vista pública
{
  const r = await pgrest('v_casos_publicos', 'slug,titulo,estado,barrio_slug,categoria_codigo', '&limit=20');
  if (r.status !== 200) {
    record(
      '2.1b',
      'v_casos_publicos accesible',
      false,
      `status=${r.status} body=${(r.body ?? '').slice(0, 200)}`,
      r,
    );
  } else {
    const rows = JSON.parse(r.body);
    record(
      '2.1b',
      'v_casos_publicos accesible',
      rows.length > 0,
      `${rows.length} casos visibles desde la view pública`,
      { count: rows.length, sample: rows.slice(0, 5) },
    );
  }
}

// 2.2 Schema ciudadanos · verificado_email existe
{
  const r = await pgrest('ciudadanos', 'verificado_email,verificado_sms', '&limit=1');
  // Si la columna no existe, PostgREST responde 400 con "column ciudadanos.verificado_email does not exist".
  // Si existe pero RLS bloquea, devuelve 200 con array vacío.
  if (r.status === 200) {
    record('2.2', 'columna verificado_email existe', true, `status=200 (rows=${JSON.parse(r.body).length})`, r);
  } else {
    const isMissing = /verificado_email/i.test(r.body ?? '');
    record('2.2', 'columna verificado_email existe', !isMissing, `status=${r.status} body=${(r.body ?? '').slice(0, 200)}`, r);
  }
}

// 2.4 Padrinos publicables
{
  const r = await pgrest('padrinos', 'id,nombre,publicado', '&limit=5');
  if (r.status !== 200) {
    record('2.4', 'padrinos accesible públicamente', false, `status=${r.status}`, r);
  } else {
    const rows = JSON.parse(r.body);
    record('2.4', 'padrinos accesible públicamente', true, `${rows.length} publicados visibles`, { count: rows.length, rows });
  }
}

// 2.5 Auth OTP endpoint responde (sin disparar OTP real)
{
  // Email con dominio inválido: el endpoint debería rechazar con 400/422 SIN gastar cuota Resend.
  const r = await request(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: 'validacion-smoke-test@example.com', create_user: false }),
  });
  const ok = r.status >= 200 && r.status < 500;
  record(
    '2.5',
    'Auth OTP endpoint responde sin 5xx',
    ok,
    `status=${r.status} body=${(r.body ?? '').slice(0, 150)}`,
    { status: r.status, body: r.body },
  );
}

// 2.6 Stats globales (MV)
{
  const r = await pgrest('mv_stats_globales', '*');
  if (r.status !== 200) {
    record('2.6', 'mv_stats_globales accesible', false, `status=${r.status} body=${(r.body ?? '').slice(0, 200)}`, r);
  } else {
    const rows = JSON.parse(r.body);
    record('2.6', 'mv_stats_globales accesible', rows.length > 0, `row=${JSON.stringify(rows[0] ?? {})}`, rows[0]);
  }
}

// 2.7 Capítulos públicos
{
  const r = await pgrest('v_capitulos_publicos', 'barrio_slug,casos_total,casos_criticos,casos_progreso,casos_resueltos', '&limit=10');
  if (r.status !== 200) {
    record('2.7', 'v_capitulos_publicos accesible', false, `status=${r.status}`, r);
  } else {
    const rows = JSON.parse(r.body);
    record('2.7', 'v_capitulos_publicos accesible', rows.length > 0, `${rows.length} capítulos activos`, { count: rows.length, rows });
  }
}

// -----------------------------------------------------------------------------
// 3.5 Archivos críticos
const criticos = [
  'db/11-demo-casos.sql',
  'db/12-migration-email-auth.sql',
  'db/13-cleanup-mv-stats.sql',
  'frontend/public/_redirects',
  'frontend/public/robots.txt',
  'frontend/src/lib/config.ts',
  'docs/cloudflare-pages-env.md',
  'docs/smoke-test-prod.md',
];
{
  const missing = criticos.filter((p) => !existsSync(join(ROOT, p)));
  record('3.5', 'archivos críticos Sprint C presentes', missing.length === 0, missing.length === 0 ? 'todos OK' : `faltan: ${missing.join(', ')}`, { missing });
}

// -----------------------------------------------------------------------------
// Output JSON al final
console.log('\n---JSON-RESULTS---');
console.log(JSON.stringify(results, null, 2));
