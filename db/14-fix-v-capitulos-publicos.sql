-- ============================================================================
-- 14-fix-v-capitulos-publicos.sql · BISS Sprint D · Bug crítico C1
--
-- Contexto:
--   Migración 10 renombró el valor del enum estado_caso: 'gestion' → 'progreso'.
--   `db/04-views.sql` quedó actualizado en el archivo (línea 28 usa
--   `casos_progreso`), pero la vista `v_capitulos_publicos` en la base de
--   datos de producción NUNCA se reaplicó después de la migración 10.
--   El frontend (Home.tsx, Capitulo.tsx, admin/Dashboard.tsx) pide
--   `casos_progreso`, pero PostgREST devuelve 400:
--     "column v_capitulos_publicos.casos_progreso does not exist"
--   confirmando que la vista en prod todavía expone el nombre viejo
--   `casos_gestion`. Resultado: el Home no muestra capítulos.
--
-- Fix: DROP + CREATE de la vista, copia textual de la definición canónica
-- en db/04-views.sql (líneas 11-41). NO toca mv_stats_globales,
-- v_casos_publicos, v_solicitudes_pendientes, v_stats_por_zona ni
-- v_stats_por_categoria.
-- ============================================================================

BEGIN;

DROP VIEW IF EXISTS public.v_capitulos_publicos CASCADE;

CREATE VIEW public.v_capitulos_publicos AS
SELECT
  cap.id                       AS capitulo_id,
  cap.barrio_id,
  b.nombre                     AS barrio_nombre,
  b.slug                       AS barrio_slug,
  z.codigo                     AS zona_codigo,
  z.nombre                     AS zona_nombre,
  z.color_hex                  AS zona_color,
  b.coord_lat,
  b.coord_lng,
  cap.descripcion,
  cap.imagen_portada_url,
  cap.geocerca,
  cap.activado_en,
  COUNT(c.id)                                                 AS casos_total,
  COUNT(c.id) FILTER (WHERE c.estado = 'critico')             AS casos_criticos,
  COUNT(c.id) FILTER (WHERE c.estado = 'progreso')            AS casos_progreso,
  COUNT(c.id) FILTER (WHERE c.estado = 'resuelto')            AS casos_resueltos,
  CASE
    WHEN COUNT(c.id) FILTER (WHERE c.estado = 'critico') > 0 THEN 'critico'
    WHEN COUNT(c.id) FILTER (WHERE c.estado = 'progreso') > 0 THEN 'progreso'
    WHEN COUNT(c.id) FILTER (WHERE c.estado = 'resuelto') > 0 THEN 'resuelto'
    ELSE 'sin_casos'
  END AS estado_predominante
FROM public.capitulos cap
JOIN public.barrios b ON b.id = cap.barrio_id
JOIN public.zonas   z ON z.id = b.zona_id
LEFT JOIN public.casos c
  ON c.capitulo_id = cap.id
  AND c.estado IN ('critico','progreso','resuelto')
WHERE cap.activo = true
GROUP BY cap.id, b.id, z.id;

-- Re-grant después del DROP (políticas RLS dependen del rol, no de la vista,
-- pero el SELECT explícito asegura que anon/authenticated puedan leerla).
GRANT SELECT ON public.v_capitulos_publicos TO anon, authenticated;

COMMIT;

-- ============================================================================
-- APLICACIÓN HUMANA (Kevin):
--   1. Abre Supabase Dashboard → SQL Editor.
--   2. Pega el contenido completo de este archivo.
--   3. Run.
--   4. Valida con:
--        SELECT casos_progreso FROM public.v_capitulos_publicos LIMIT 1;
--      Debe responder sin error (puede devolver 0 filas si no hay capítulos
--      activos, pero NO debe lanzar "column does not exist").
--   5. Refresca el Home en producción: deben aparecer los 6 capítulos.
-- ============================================================================
