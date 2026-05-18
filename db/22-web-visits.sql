-- ============================================================================
-- 22-web-visits.sql · BISS Sprint I · I1
--
-- Tracking interno de visitas web. Privacy-friendly: NO guarda IP,
-- NO guarda cookie/sesión, NO guarda PII. Solo path, referrer y
-- user-agent truncado.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.web_visits (
  id          bigserial PRIMARY KEY,
  ts          timestamptz NOT NULL DEFAULT now(),
  path        text NOT NULL,
  referrer    text,
  ua_short    text
);
CREATE INDEX IF NOT EXISTS idx_visits_ts        ON public.web_visits(ts DESC);
CREATE INDEX IF NOT EXISTS idx_visits_path_ts   ON public.web_visits(path, ts DESC);

COMMENT ON TABLE public.web_visits IS
  'Tracking interno de visitas. Sin IP/cookies. Privacy-friendly. Retención sugerida: 90 días.';

ALTER TABLE public.web_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_visits_insert_anon ON public.web_visits;
CREATE POLICY p_visits_insert_anon ON public.web_visits
  FOR INSERT TO anon
  WITH CHECK (
    path IS NOT NULL
    AND length(path) <= 500
    AND (referrer IS NULL OR length(referrer) <= 1000)
    AND (ua_short IS NULL OR length(ua_short) <= 200)
  );

DROP POLICY IF EXISTS p_visits_insert_auth ON public.web_visits;
CREATE POLICY p_visits_insert_auth ON public.web_visits
  FOR INSERT TO authenticated
  WITH CHECK (
    path IS NOT NULL
    AND length(path) <= 500
  );

DROP POLICY IF EXISTS p_visits_select_cms ON public.web_visits;
CREATE POLICY p_visits_select_cms ON public.web_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_cms u
      WHERE u.id = auth.uid() AND u.activo = true
    )
  );

-- KPIs agregados (vista barata · evalúa al leer).
CREATE OR REPLACE VIEW public.v_visits_kpis AS
SELECT
  count(*) FILTER (WHERE ts >= now() - interval '24 hours')                       AS visitas_hoy,
  count(*) FILTER (WHERE ts >= now() - interval '7 days')                         AS visitas_semana,
  count(*) FILTER (WHERE ts >= now() - interval '30 days')                        AS visitas_mes,
  count(*)                                                                        AS visitas_total,
  count(DISTINCT path)                                                            AS paths_distintos
FROM public.web_visits;

GRANT SELECT ON public.v_visits_kpis TO authenticated;

-- Top paths últimos 30 días.
CREATE OR REPLACE VIEW public.v_visits_top_paths AS
SELECT
  path,
  count(*) AS visitas,
  max(ts)  AS ultima_visita
FROM public.web_visits
WHERE ts >= now() - interval '30 days'
GROUP BY path
ORDER BY visitas DESC
LIMIT 25;

GRANT SELECT ON public.v_visits_top_paths TO authenticated;

-- Serie semanal de las últimas 12 semanas (para gráfica de líneas).
CREATE OR REPLACE VIEW public.v_visits_semanal AS
SELECT
  date_trunc('week', ts)::date AS semana_inicio,
  count(*)                      AS visitas
FROM public.web_visits
WHERE ts >= now() - interval '12 weeks'
GROUP BY 1
ORDER BY 1;

GRANT SELECT ON public.v_visits_semanal TO authenticated;

COMMIT;
