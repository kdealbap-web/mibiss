-- ============================================================================
-- 31-refresh-stats-auto.sql · BISS · Refresh automático de mv_stats_globales
--
-- Bug: el RPC cambiar_estado_caso (y otros cambios que afectan KPIs) no
-- refrescaba la materialized view. El frontend muestra valores stale —
-- ej: caso pasó a 'resuelto' pero el badge sigue diciendo "1 crítico".
--
-- Fix: trigger AFTER UPDATE / INSERT / DELETE en las tablas que alimentan
-- la vista, que dispara refresh_stats_globales() (fire-and-forget vía
-- pg_net si quisiéramos async, pero el refresh es barato → lo hacemos
-- sync). Si la concurrencia se vuelve problema, mover a pg_cron.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.tg_refresh_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.refresh_stats_globales();
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'refresh_stats fallo: %', SQLERRM;
  RETURN NULL;
END $$;

-- Casos: cualquier INSERT/UPDATE/DELETE puede mover KPIs.
DROP TRIGGER IF EXISTS trg_refresh_stats_casos ON public.casos;
CREATE TRIGGER trg_refresh_stats_casos
AFTER INSERT OR UPDATE OR DELETE ON public.casos
FOR EACH STATEMENT EXECUTE FUNCTION public.tg_refresh_stats();

-- Solicitudes: counter de pendientes en la MV.
DROP TRIGGER IF EXISTS trg_refresh_stats_solicitudes ON public.solicitudes_caso;
CREATE TRIGGER trg_refresh_stats_solicitudes
AFTER INSERT OR UPDATE OR DELETE ON public.solicitudes_caso
FOR EACH STATEMENT EXECUTE FUNCTION public.tg_refresh_stats();

-- Capítulos: counter de activos.
DROP TRIGGER IF EXISTS trg_refresh_stats_capitulos ON public.capitulos;
CREATE TRIGGER trg_refresh_stats_capitulos
AFTER INSERT OR UPDATE OR DELETE ON public.capitulos
FOR EACH STATEMENT EXECUTE FUNCTION public.tg_refresh_stats();

-- Ciudadanos: counter de verificados (no cambia tan seguido, vale la pena).
DROP TRIGGER IF EXISTS trg_refresh_stats_ciudadanos ON public.ciudadanos;
CREATE TRIGGER trg_refresh_stats_ciudadanos
AFTER INSERT OR UPDATE OR DELETE ON public.ciudadanos
FOR EACH STATEMENT EXECUTE FUNCTION public.tg_refresh_stats();

COMMIT;

-- Refresh inmediato para reparar el estado stale actual.
SELECT public.refresh_stats_globales();
SELECT * FROM public.mv_stats_globales;
