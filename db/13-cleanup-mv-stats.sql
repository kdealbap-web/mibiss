-- ============================================================================
-- db/13-cleanup-mv-stats.sql · BISS
-- Recrea mv_stats_globales corrigiendo dos bugs heredados:
--   1. Filtro estado='gestion' (literal viejo del enum, renombrado a 'progreso'
--      en 10-migration-estado-caso.sql) → devolvía 0 siempre.
--   2. Conteo ciudadanos verificado_sms → ahora usa verificado_email
--      (después de 12-migration-email-auth.sql).
-- Idempotente: DROP IF EXISTS + REFRESH al final.
-- ============================================================================

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS public.mv_stats_globales;

CREATE MATERIALIZED VIEW public.mv_stats_globales AS
SELECT
  (SELECT COUNT(*) FROM public.barrios)                                                                  AS barrios_total,
  (SELECT COUNT(*) FROM public.capitulos WHERE activo = true)                                            AS capitulos_activos,
  (SELECT COUNT(*) FROM public.casos WHERE estado = 'critico')                                           AS casos_criticos,
  (SELECT COUNT(*) FROM public.casos WHERE estado = 'progreso')                                          AS casos_progreso,
  (SELECT COUNT(*) FROM public.casos WHERE estado = 'resuelto')                                          AS casos_resueltos,
  (SELECT COUNT(*) FROM public.casos WHERE estado IN ('critico','progreso','resuelto'))                  AS casos_publicos,
  (SELECT COUNT(*) FROM public.solicitudes_caso WHERE estado = 'pendiente')                              AS solicitudes_pendientes,
  (SELECT COUNT(*) FROM public.ciudadanos WHERE eliminado_en IS NULL AND verificado_email = true)        AS ciudadanos_verificados,
  now() AS actualizado_en;

-- Recrear la función refresh (sigue igual, pero por idempotencia).
CREATE OR REPLACE FUNCTION public.refresh_stats_globales()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_stats_globales;
END $$;

-- Primer refresh para que el frontend lea valores reales.
REFRESH MATERIALIZED VIEW public.mv_stats_globales;

COMMIT;

-- Verificación
SELECT * FROM public.mv_stats_globales;
