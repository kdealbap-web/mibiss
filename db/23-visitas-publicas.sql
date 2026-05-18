-- ============================================================================
-- 23-visitas-publicas.sql · BISS · indicador social en Home
--
-- Vista pública minimal: solo contador de los últimos 30 días.
-- No expone paths, no expone referrers, no expone total all-time.
-- Solo el número para mostrar "X visitas este mes" en la página pública.
-- ============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.v_visitas_publicas_mes AS
SELECT
  count(*)::bigint AS visitas_mes
FROM public.web_visits
WHERE ts >= now() - interval '30 days';

-- Lectura abierta — anon puede ver el contador. Sin acceso a la tabla
-- subyacente (RLS sigue protegiendo web_visits para anon).
GRANT SELECT ON public.v_visitas_publicas_mes TO anon, authenticated;

COMMIT;
