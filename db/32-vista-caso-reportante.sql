-- ============================================================================
-- 32-vista-caso-reportante.sql · BISS
--
-- Añade a v_casos_publicos:
--   - reportado_por_nombre: nombre completo del ciudadano que reportó.
--   - reportado_en: timestamp original del reporte (solicitudes_caso.creado_en).
--
-- Mostraremos esto en la página pública del caso y en /admin/caso/:folio.
-- Es información NO sensible: solo nombre y fecha. Email y teléfono quedan
-- privados (la columna ciudadanos.email no se expone aquí).
-- ============================================================================

BEGIN;

-- CREATE OR REPLACE VIEW no permite añadir columnas en medio del orden
-- existente — solo al final. Mantenemos el orden histórico y appendamos
-- reportado_por_nombre y reportado_en al final.
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
  cap.id AS capitulo_id,
  cap.barrio_id,
  b.nombre AS barrio_nombre,
  b.slug AS barrio_slug,
  z.codigo AS zona_codigo,
  z.color_hex AS zona_color,
  cat.codigo AS categoria_codigo,
  cat.nombre AS categoria_nombre,
  cat.icono AS categoria_icono,
  cat.color_hex AS categoria_color,
  ( SELECT m.url
      FROM public.multimedia_casos m
     WHERE m.caso_id = c.id AND m.tipo = 'foto'::public.tipo_media
     ORDER BY m.orden
     LIMIT 1
  ) AS portada_url,
  -- Columnas nuevas al final (no modificar orden de las existentes).
  c.creado_en,
  TRIM(CONCAT_WS(' ', ci.nombres, ci.apellidos)) AS reportado_por_nombre,
  s.creado_en AS reportado_en
FROM public.casos c
JOIN public.capitulos cap ON cap.id = c.capitulo_id
JOIN public.barrios b ON b.id = cap.barrio_id
JOIN public.zonas z ON z.id = b.zona_id
JOIN public.categorias cat ON cat.id = c.categoria_id
LEFT JOIN public.solicitudes_caso s ON s.id = c.solicitud_origen_id
LEFT JOIN public.ciudadanos ci ON ci.id = s.ciudadano_id
WHERE c.estado IN ('critico'::public.estado_caso, 'progreso'::public.estado_caso, 'resuelto'::public.estado_caso)
  AND cap.activo = true;

COMMIT;

-- Verificación
SELECT slug, estado, reportado_por_nombre, reportado_en FROM public.v_casos_publicos LIMIT 5;
