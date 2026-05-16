-- ============================================================================
-- 11-demo-casos.sql · BISS · Casos demo para validación visual
-- Crea 5 casos en distintos estados y categorías para que el frontend tenga
-- datos visibles durante desarrollo.
-- Idempotente: ON CONFLICT en (capitulo_id, slug) para casos y barrio_id para capítulos.
--
-- Activa 3 capítulos (Centro, Los Almendros, El Hipódromo) con geocerca y portada
-- válidas para satisfacer chk_capitulos_activo_completo. Si 08-demo-seed.sql ya
-- corrió, el ON CONFLICT actualiza los campos sin romper nada.
--
-- NO ejecutar en producción real (los datos son ficticios).
-- ============================================================================

BEGIN;

-- ───────────── CAPÍTULOS (Centro, Los Almendros, El Hipódromo) ─────────────
-- Geocerca: polígono ~600m alrededor del centroide de cada barrio (placeholder).
-- Portada: picsum con seed estable (será reemplazada por R2 en Sprint C).
INSERT INTO public.capitulos
  (barrio_id, descripcion, imagen_portada_url, geocerca, activo, activado_en)
VALUES
  (
    94,
    'Bitácora demo del Centro de Soledad. Tráfico, espacio público y mobiliario urbano.',
    'https://picsum.photos/seed/centro-soledad/800/450',
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(-74.766, 10.911),
          jsonb_build_array(-74.760, 10.911),
          jsonb_build_array(-74.760, 10.917),
          jsonb_build_array(-74.766, 10.917),
          jsonb_build_array(-74.766, 10.911)
        )
      )
    ),
    true,
    now() - interval '12 days'
  ),
  (
    60,
    'Bitácora demo de Los Almendros. Agua, infraestructura y movilidad.',
    'https://picsum.photos/seed/los-almendros/800/450',
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(-74.790, 10.910),
          jsonb_build_array(-74.784, 10.910),
          jsonb_build_array(-74.784, 10.916),
          jsonb_build_array(-74.790, 10.916),
          jsonb_build_array(-74.790, 10.910)
        )
      )
    ),
    true,
    now() - interval '20 days'
  ),
  (
    104,
    'Bitácora demo de El Hipódromo. Antiguo barrio comercial junto al Mercado Olímpico.',
    'https://picsum.photos/seed/el-hipodromo/800/450',
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(-74.776, 10.918),
          jsonb_build_array(-74.770, 10.918),
          jsonb_build_array(-74.770, 10.924),
          jsonb_build_array(-74.776, 10.924),
          jsonb_build_array(-74.776, 10.918)
        )
      )
    ),
    true,
    now() - interval '8 days'
  )
ON CONFLICT (barrio_id) DO UPDATE SET
  descripcion        = EXCLUDED.descripcion,
  imagen_portada_url = EXCLUDED.imagen_portada_url,
  geocerca           = EXCLUDED.geocerca,
  activo             = true,
  activado_en        = COALESCE(public.capitulos.activado_en, EXCLUDED.activado_en);

-- ───────────── CASOS demo (uno por estado, distribuidos en 3 capítulos) ─────────────
-- Resuelve categoria_id por codigo para evitar mismatches de orden con el seed.
WITH cap AS (
  SELECT cap.id, b.slug, b.coord_lat, b.coord_lng
  FROM public.capitulos cap
  JOIN public.barrios b ON b.id = cap.barrio_id
  WHERE b.slug IN ('centro', 'los-almendros', 'el-hipodromo')
    AND cap.activo = true
),
cats AS (
  SELECT codigo, id FROM public.categorias
)
INSERT INTO public.casos (
  capitulo_id, categoria_id, titulo, slug, descripcion, estado,
  lat, lng, publicado_en, resuelto_en, creado_en, actualizado_en
)
SELECT
  cap.id, cats.id, vals.titulo, vals.slug, vals.descripcion, vals.estado::public.estado_caso,
  COALESCE(cap.coord_lat, 10.917) + vals.lat_offset,
  COALESCE(cap.coord_lng, -74.762) + vals.lng_offset,
  vals.publicado, vals.resuelto, vals.creado, vals.actualizado
FROM cap
JOIN (VALUES
  -- (cap_slug, cat_codigo, titulo, slug, descripcion, estado, lat_offset, lng_offset, publicado, resuelto, creado, actualizado)
  ('centro', 'luz', 'Postes sin alumbrado en la 30',
    'postes-sin-alumbrado-30',
    'Cinco postes consecutivos sin luz desde hace dos semanas. Inseguridad para vecinos y comerciantes.',
    'critico', 0.001, 0.001,
    now() - interval '7 days', NULL::timestamptz,
    now() - interval '8 days', now() - interval '7 days'),

  ('centro', 'infraestructura', 'Cráter en la calle 30 entre 13 y 14',
    'crater-calle-30',
    'Hueco profundo de cerca de un metro afecta el tránsito vehicular y peatonal. Reportado a Secretaría de Infraestructura.',
    'progreso', -0.002, 0.001,
    now() - interval '15 days', NULL::timestamptz,
    now() - interval '16 days', now() - interval '5 days'),

  ('los-almendros', 'agua', 'Tubería rota en la calle 80',
    'tuberia-rota-calle-80',
    'Fuga de agua potable desde hace una semana. Triple A enviado, pendiente reparación.',
    'critico', 0.001, -0.002,
    now() - interval '5 days', NULL::timestamptz,
    now() - interval '6 days', now() - interval '5 days'),

  ('los-almendros', 'social', 'Comedor comunitario sin insumos',
    'comedor-comunitario-insumos',
    'El comedor de la JAC lleva una semana sin recibir el mercado mensual. Atiende a 42 adultos mayores.',
    'progreso', -0.001, 0.002,
    now() - interval '10 days', NULL::timestamptz,
    now() - interval '11 days', now() - interval '8 days'),

  ('el-hipodromo', 'luz', 'Subestación inestable corta luz cada noche',
    'subestacion-corta-luz',
    'Vecinos reportan cortes diarios entre las 7 y 11 pm que dañan electrodomésticos. Air-e en proceso de cambio.',
    'resuelto', 0.002, 0.001,
    now() - interval '30 days', now() - interval '3 days',
    now() - interval '31 days', now() - interval '3 days')
) AS vals(cap_slug, cat_codigo, titulo, slug, descripcion, estado, lat_offset, lng_offset, publicado, resuelto, creado, actualizado)
  ON cap.slug = vals.cap_slug
JOIN cats ON cats.codigo = vals.cat_codigo
ON CONFLICT (capitulo_id, slug) DO NOTHING;

COMMIT;

-- ───────────── Verificación ─────────────
SELECT
  c.titulo, c.estado, c.lat, c.lng,
  b.nombre AS barrio,
  cat.codigo AS categoria
FROM public.casos c
JOIN public.capitulos cap ON cap.id = c.capitulo_id
JOIN public.barrios b ON b.id = cap.barrio_id
JOIN public.categorias cat ON cat.id = c.categoria_id
WHERE b.slug IN ('centro', 'los-almendros', 'el-hipodromo')
ORDER BY c.creado_en DESC;
