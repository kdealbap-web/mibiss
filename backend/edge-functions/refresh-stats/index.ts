// =============================================================================
// refresh-stats · cron */5 * * * *
// REFRESH MATERIALIZED VIEW mv_stats_globales (1 fila, lock trivial)
// =============================================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const supa = getServiceClient();
  const { error } = await supa.rpc('refresh_stats_globales');
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ ok: true, ts: new Date().toISOString() });
});
