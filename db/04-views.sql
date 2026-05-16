-- ============================================================================
-- 04-views.sql · BISS (Banco de Ideas y Soluciones de Soledad)
-- Vistas y materialized views para consumo público y métricas.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Capítulos públicos (con conteos de casos)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_capitulos_publicos AS
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
  COUNT(c.id) FILTER (WHERE c.estado = 'progreso')             AS casos_progreso,
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
LEFT JOIN public.casos c ON c.capitulo_id = cap.id AND c.estado IN ('critico','progreso','resuelto')
WHERE cap.activo = true
GROUP BY cap.id, b.id, z.id;

-- ----------------------------------------------------------------------------
-- 2. Casos públicos enriquecidos (con barrio, categoría, primer thumbnail)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_casos_publicos AS
SELECT
  c.id,
  c.titulo,
  c.slug,
  c.descripcion,
  c.estado,
  c.lat,
  c.lng,
  c.publicado_en,
  c.resuelto_en,
  c.actualizado_en,
  cap.id        AS capitulo_id,
  cap.barrio_id,
  b.nombre      AS barrio_nombre,
  b.slug        AS barrio_slug,
  z.codigo      AS zona_codigo,
  z.color_hex   AS zona_color,
  cat.codigo    AS categoria_codigo,
  cat.nombre    AS categoria_nombre,
  cat.icono     AS categoria_icono,
  cat.color_hex AS categoria_color,
  (
    SELECT m.url FROM public.multimedia_casos m
    WHERE m.caso_id = c.id AND m.tipo = 'foto'
    ORDER BY m.orden ASC LIMIT 1
  ) AS portada_url
FROM public.casos c
JOIN public.capitulos  cap ON cap.id = c.capitulo_id
JOIN public.barrios    b   ON b.id = cap.barrio_id
JOIN public.zonas      z   ON z.id = b.zona_id
JOIN public.categorias cat ON cat.id = c.categoria_id
WHERE c.estado IN ('critico','progreso','resuelto')
  AND cap.activo = true;

-- ----------------------------------------------------------------------------
-- 3. Solicitudes pendientes (cola del CMS)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_solicitudes_pendientes AS
SELECT
  s.id, s.titulo, s.descripcion, s.lat, s.lng,
  s.creado_en, s.estado,
  ci.id            AS ciudadano_id,
  ci.nombres || ' ' || ci.apellidos AS ciudadano,
  ci.telefono_celular,
  b.id             AS barrio_id,
  b.nombre         AS barrio,
  cat.codigo       AS categoria_codigo,
  cat.nombre       AS categoria
FROM public.solicitudes_caso s
JOIN public.ciudadanos ci ON ci.id = s.ciudadano_id
JOIN public.barrios    b  ON b.id  = s.barrio_id
JOIN public.categorias cat ON cat.id = s.categoria_id
WHERE s.estado = 'pendiente';

-- ----------------------------------------------------------------------------
-- 4. Materialized View: stats globales para Home
-- ----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS public.mv_stats_globales;
CREATE MATERIALIZED VIEW public.mv_stats_globales AS
SELECT
  (SELECT COUNT(*) FROM public.barrios)                                                                       AS barrios_total,
  (SELECT COUNT(*) FROM public.capitulos WHERE activo = true)                                                 AS capitulos_activos,
  (SELECT COUNT(*) FROM public.casos WHERE estado = 'critico')                                                AS casos_criticos,
  (SELECT COUNT(*) FROM public.casos WHERE estado = 'gestion')                                                AS casos_progreso,
  (SELECT COUNT(*) FROM public.casos WHERE estado = 'resuelto')                                               AS casos_resueltos,
  (SELECT COUNT(*) FROM public.casos WHERE estado IN ('critico','progreso','resuelto'))                        AS casos_publicos,
  (SELECT COUNT(*) FROM public.solicitudes_caso WHERE estado = 'pendiente')                                   AS solicitudes_pendientes,
  (SELECT COUNT(*) FROM public.ciudadanos WHERE eliminado_en IS NULL AND verificado_sms = true)               AS ciudadanos_verificados,
  now() AS actualizado_en;

-- Función helper para refrescar (llamada desde Edge Function cron).
-- Sin CONCURRENTLY: la MV tiene 1 sola fila, el lock es trivial.
-- CONCURRENTLY exigiría un índice único sobre COLUMNAS reales (no expresión
-- constante como (1)), lo cual no aplica a una MV de fila única.
CREATE OR REPLACE FUNCTION public.refresh_stats_globales()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_stats_globales;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Conteos por zona (para mapa público)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_stats_por_zona AS
SELECT
  z.id, z.codigo, z.nombre, z.color_hex,
  COUNT(DISTINCT b.id) AS barrios_total,
  COUNT(DISTINCT cap.id) FILTER (WHERE cap.activo = true) AS capitulos_activos,
  COUNT(c.id)                                                AS casos_total,
  COUNT(c.id) FILTER (WHERE c.estado = 'critico')            AS casos_criticos,
  COUNT(c.id) FILTER (WHERE c.estado = 'progreso')            AS casos_progreso,
  COUNT(c.id) FILTER (WHERE c.estado = 'resuelto')           AS casos_resueltos
FROM public.zonas z
LEFT JOIN public.barrios b ON b.zona_id = z.id
LEFT JOIN public.capitulos cap ON cap.barrio_id = b.id
LEFT JOIN public.casos c ON c.capitulo_id = cap.id AND c.estado IN ('critico','progreso','resuelto')
GROUP BY z.id;

-- ----------------------------------------------------------------------------
-- 6. Conteos por categoría (para grid editorial en Home)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_stats_por_categoria AS
SELECT
  cat.id, cat.codigo, cat.nombre, cat.icono, cat.color_hex, cat.orden,
  COUNT(c.id) FILTER (WHERE c.estado IN ('critico','progreso','resuelto')) AS casos
FROM public.categorias cat
LEFT JOIN public.casos c ON c.categoria_id = cat.id
GROUP BY cat.id
ORDER BY cat.orden;

COMMIT;
