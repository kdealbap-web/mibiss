-- ============================================================================
-- 11-demo-casos.sql · BISS · Casos demo para validación visual
-- Crea ~5 casos en distintos estados y categorías para que el frontend tenga
-- datos visibles durante desarrollo.
-- Idempotente: usa ON CONFLICT en slug.
-- NO ejecutar en producción real (los datos son ficticios).
-- ============================================================================

-- Capítulos demo (si no existen)
DO $$
DECLARE
  v_barrio_centro smallint;
  v_barrio_2 smallint;
  v_barrio_3 smallint;
BEGIN
  SELECT id INTO v_barrio_centro FROM public.barrios WHERE slug = 'centro' LIMIT 1;
  SELECT id INTO v_barrio_2 FROM public.barrios WHERE slug = 'soledad-2000' LIMIT 1;
  SELECT id INTO v_barrio_3 FROM public.barrios WHERE slug = 'hipodromo' LIMIT 1;

  -- Activar capítulos demo
  INSERT INTO public.capitulos (barrio_id, descripcion, activo, activado_en)
  VALUES
    (v_barrio_centro, 'Bitácora demo del Centro', true, now()),
    (v_barrio_2, 'Bitácora demo Soledad 2000', true, now()),
    (v_barrio_3, 'Bitácora demo Hipódromo', true, now())
  ON CONFLICT (barrio_id) DO UPDATE SET activo = true, activado_en = now();
END $$;

-- Casos demo (uno por estado)
WITH cap AS (
  SELECT cap.id, b.slug, b.coord_lat, b.coord_lng
  FROM public.capitulos cap
  JOIN public.barrios b ON b.id = cap.barrio_id
  WHERE cap.activo = true
)
INSERT INTO public.casos (
  capitulo_id, categoria_id, titulo, slug, descripcion, estado,
  lat, lng, publicado_en, resuelto_en, creado_en, actualizado_en
)
SELECT
  cap.id, vals.cat_id, vals.titulo, vals.slug, vals.descripcion, vals.estado::estado_caso,
  COALESCE(cap.coord_lat, 10.917) + vals.lat_offset,
  COALESCE(cap.coord_lng, -74.762) + vals.lng_offset,
  vals.publicado, vals.resuelto, vals.creado, vals.actualizado
FROM cap
JOIN (VALUES
  -- (cap_slug, cat_id, titulo, slug, descripcion, estado, lat_offset, lng_offset, publicado, resuelto, creado, actualizado)
  ('centro', 1::smallint, 'Postes sin alumbrado en la 30',
    'postes-sin-alumbrado-30',
    'Cinco postes consecutivos sin luz desde hace dos semanas. Inseguridad para vecinos y comerciantes.',
    'critico', 0.001, 0.001,
    now() - interval '7 days', NULL::timestamptz,
    now() - interval '8 days', now() - interval '7 days'),

  ('centro', 3::smallint, 'Cráter en la calle 30 entre 13 y 14',
    'crater-calle-30',
    'Hueco profundo de cerca de un metro afecta el tránsito vehicular y peatonal. Reportado a Secretaría de Infraestructura.',
    'progreso', -0.002, 0.001,
    now() - interval '15 days', NULL::timestamptz,
    now() - interval '16 days', now() - interval '5 days'),

  ('soledad-2000', 2::smallint, 'Tubería rota en la calle 80',
    'tuberia-rota-calle-80',
    'Fuga de agua potable desde hace una semana. Triple A enviado, pendiente reparación.',
    'critico', 0.001, -0.002,
    now() - interval '5 days', NULL::timestamptz,
    now() - interval '6 days', now() - interval '5 days'),

  ('soledad-2000', 4::smallint, 'Comedor comunitario sin insumos',
    'comedor-comunitario-insumos',
    'El comedor de la JAC lleva una semana sin recibir el mercado mensual. Atiende a 42 adultos mayores.',
    'progreso', -0.001, 0.002,
    now() - interval '10 days', NULL::timestamptz,
    now() - interval '11 days', now() - interval '8 days'),

  ('hipodromo', 1::smallint, 'Subestación inestable corta luz cada noche',
    'subestacion-corta-luz',
    'Vecinos reportan cortes diarios entre las 7 y 11 pm que dañan electrodomésticos. Air-e en proceso de cambio.',
    'resuelto', 0.002, 0.001,
    now() - interval '30 days', now() - interval '3 days',
    now() - interval '31 days', now() - interval '3 days')
) AS vals(cap_slug, cat_id, titulo, slug, descripcion, estado, lat_offset, lng_offset, publicado, resuelto, creado, actualizado)
  ON cap.slug = vals.cap_slug
ON CONFLICT (capitulo_id, slug) DO NOTHING;

-- Verificación
SELECT
  c.titulo, c.estado, c.lat, c.lng,
  b.nombre AS barrio,
  cat.codigo AS categoria
FROM public.casos c
JOIN public.capitulos cap ON cap.id = c.capitulo_id
JOIN public.barrios b ON b.id = cap.barrio_id
JOIN public.categorias cat ON cat.id = c.categoria_id
ORDER BY c.creado_en DESC;
