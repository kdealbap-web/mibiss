-- ============================================================================
-- 08-demo-seed.sql · BISS · Datos demo para validar diseño y persistencia.
-- Crea 5 capítulos (uno por zona) con geocercas reales y portadas,
-- y 6 casos en estados distintos (pendiente / critico / progreso / resuelto).
-- Idempotente: re-ejecutable con UPSERT.
--
-- Incluye también la vista v_stats_por_categoria (usada por el grid de
-- categorías del Home), por si aún no fue aplicada al ejecutar 04-views.sql.
-- ============================================================================

-- ───── Vista de stats por categoría (idempotente) ─────
CREATE OR REPLACE VIEW public.v_stats_por_categoria AS
SELECT
  cat.id, cat.codigo, cat.nombre, cat.icono, cat.color_hex, cat.orden,
  COUNT(c.id) FILTER (WHERE c.estado IN ('critico','progreso','resuelto')) AS casos
FROM public.categorias cat
LEFT JOIN public.casos c ON c.categoria_id = cat.id
GROUP BY cat.id
ORDER BY cat.orden;

BEGIN;

-- ───────────── CAPÍTULOS (5, uno por zona) ─────────────
-- Cada uno con geocerca polígono ~330m alrededor del centroide del barrio.
-- Las portadas usan picsum (placeholders reales por seed) hasta que B2 esté
-- conectado y se suban portadas reales desde el CMS.

INSERT INTO public.capitulos
  (barrio_id, descripcion, imagen_portada_url, geocerca, activo, activado_en)
VALUES
  -- Zone 1 · Centro Norte · Costa De Oro
  (
    4,
    'Capítulo del barrio Costa De Oro. Una zona residencial del norte de Soledad con problemas recurrentes de iluminación pública y calles deterioradas. La bitácora abre aquí su primera página para registrar la gestión.',
    'https://picsum.photos/seed/costa-de-oro/800/450',
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(-74.779, 10.943),
          jsonb_build_array(-74.773, 10.943),
          jsonb_build_array(-74.773, 10.949),
          jsonb_build_array(-74.779, 10.949),
          jsonb_build_array(-74.779, 10.943)
        )
      )
    ),
    true,
    now() - interval '12 days'
  ),
  -- Zone 2 · Occidental · Los Almendros
  (
    60,
    'Los Almendros es uno de los barrios más extensos del occidente de Soledad. Aquí confluyen necesidades de agua, infraestructura y movilidad. La bitácora documenta cada caso con fecha y firma.',
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
  -- Zone 3 · Oriental · Centro
  (
    94,
    'El Centro de Soledad es el corazón histórico del municipio. Su capítulo recoge problemas de tráfico, espacio público y mobiliario urbano que afectan el día a día del comercio local.',
    'https://picsum.photos/seed/centro-soledad/800/450',
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(-74.763, 10.914),
          jsonb_build_array(-74.757, 10.914),
          jsonb_build_array(-74.757, 10.920),
          jsonb_build_array(-74.763, 10.920),
          jsonb_build_array(-74.763, 10.914)
        )
      )
    ),
    true,
    now() - interval '30 days'
  ),
  -- Zone 4 · Sur · Manuela Beltran
  (
    157,
    'Manuela Beltrán enfrenta retos de servicios públicos y conectividad. Cada caso abierto aquí es seguimiento puntual: qué pasó, qué se gestionó y qué falta.',
    'https://picsum.photos/seed/manuela-beltran/800/450',
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(-74.758, 10.889),
          jsonb_build_array(-74.752, 10.889),
          jsonb_build_array(-74.752, 10.895),
          jsonb_build_array(-74.758, 10.895),
          jsonb_build_array(-74.758, 10.889)
        )
      )
    ),
    true,
    now() - interval '7 days'
  ),
  -- Zone 5 · Sur Occidental · Bello Horizonte
  (
    179,
    'Bello Horizonte es uno de los barrios con mayor crecimiento del suroccidente. Tiene casos abiertos en salud comunitaria, parques y vialidad. Aquí se documentan las gestiones por el bienestar de las familias.',
    'https://picsum.photos/seed/bello-horizonte/800/450',
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(-74.788, 10.877),
          jsonb_build_array(-74.782, 10.877),
          jsonb_build_array(-74.782, 10.883),
          jsonb_build_array(-74.788, 10.883),
          jsonb_build_array(-74.788, 10.877)
        )
      )
    ),
    true,
    now() - interval '5 days'
  )
ON CONFLICT (barrio_id) DO UPDATE SET
  descripcion        = EXCLUDED.descripcion,
  imagen_portada_url = EXCLUDED.imagen_portada_url,
  geocerca           = EXCLUDED.geocerca,
  activo             = EXCLUDED.activo,
  actualizado_en     = now();

-- Refrescar coords del barrio (centroide del polígono) para que el marker
-- del mapa caiga dentro de la geocerca.
UPDATE public.barrios SET coord_lat = 10.946, coord_lng = -74.776 WHERE id = 4;
UPDATE public.barrios SET coord_lat = 10.913, coord_lng = -74.787 WHERE id = 60;
UPDATE public.barrios SET coord_lat = 10.917, coord_lng = -74.760 WHERE id = 94;
UPDATE public.barrios SET coord_lat = 10.892, coord_lng = -74.755 WHERE id = 157;
UPDATE public.barrios SET coord_lat = 10.880, coord_lng = -74.785 WHERE id = 179;

-- ───────────── CASOS (6, mezcla de estados) ─────────────
-- Insertamos 6 casos: 1 pendiente (no visible a anon), 2 críticos, 2 en progreso
-- y 1 resuelto. Cubre los estados visibles del enum (archivado se valida aparte).
-- Slugs únicos por capítulo, hechos a mano para que sean estables.

WITH cap AS (
  SELECT cap.id AS capitulo_id, cap.barrio_id
  FROM public.capitulos cap
  WHERE cap.barrio_id IN (4, 60, 94, 157, 179)
)
INSERT INTO public.casos
  (capitulo_id, categoria_id, titulo, slug, descripcion, estado, lat, lng,
   publicado_en, resuelto_en, creado_en, actualizado_en)
SELECT
  c.capitulo_id, x.categoria_id, x.titulo, x.slug, x.descripcion,
  x.estado::public.estado_caso, x.lat, x.lng,
  x.publicado_en, x.resuelto_en, x.creado_en, x.actualizado_en
FROM cap c
JOIN (VALUES
  -- (barrio_id, categoria_id, titulo, slug, descripcion, estado, lat, lng, publicado_en, resuelto_en, creado_en, actualizado_en)

  -- Costa De Oro · PENDIENTE · Servicios públicos · luz
  (4::smallint, 1::smallint,
   'Postes de la calle 80 sin alumbrado',
   'postes-calle-80-sin-alumbrado',
   'Reportan vecinos del sector que cinco postes consecutivos llevan más de tres semanas sin luz. Caso en revisión interna antes de publicarse en la bitácora.',
   'pendiente'::text, 10.946::numeric, -74.776::numeric,
   NULL::timestamptz, NULL::timestamptz,
   now() - interval '2 days', now() - interval '2 days'),

  -- Los Almendros · CRÍTICO · Agua y alcantarillado
  (60::smallint, 2::smallint,
   'Aguas residuales desbordando en la cra. 5',
   'aguas-residuales-cra-5',
   'Un colapso del alcantarillado mantiene aguas servidas corriendo por la calle hace dos semanas. Familias afectadas, riesgo sanitario inmediato. Caso abierto con fotografías y testimonios.',
   'critico'::text, 10.913::numeric, -74.787::numeric,
   now() - interval '14 days', NULL::timestamptz,
   now() - interval '15 days', now() - interval '14 days'),

  -- Centro · CRÍTICO · Infraestructura
  (94::smallint, 3::smallint,
   'Cráter en la calle 30 entre 13 y 14',
   'crater-calle-30',
   'Hueco profundo de cerca de un metro afecta el tránsito vehicular y peatonal. Ya hubo dos accidentes leves de motociclistas. Reportado a Secretaría de Infraestructura.',
   'critico'::text, 10.917::numeric, -74.760::numeric,
   now() - interval '8 days', NULL::timestamptz,
   now() - interval '9 days', now() - interval '8 days'),

  -- Centro · PROGRESO · Social
  (94::smallint, 4::smallint,
   'Comedor comunitario sin insumos para la 3a edad',
   'comedor-comunitario-3a-edad',
   'El comedor de la JAC del Centro lleva una semana sin recibir el mercado mensual. Atiende a 42 adultos mayores. En gestión con el ICBF y la Secretaría de Bienestar.',
   'progreso'::text, 10.918::numeric, -74.761::numeric,
   now() - interval '5 days', NULL::timestamptz,
   now() - interval '6 days', now() - interval '5 days'),

  -- Manuela Beltran · PROGRESO · Servicios públicos · luz
  (157::smallint, 1::smallint,
   'Subestación inestable corta luz cada noche',
   'subestacion-corta-luz-cada-noche',
   'Vecinos reportan cortes diarios entre las 7 y las 11 pm que dañan electrodomésticos. Air-e en proceso de cambiar transformador. Acompañamiento del concejo.',
   'progreso'::text, 10.892::numeric, -74.755::numeric,
   now() - interval '3 days', NULL::timestamptz,
   now() - interval '4 days', now() - interval '3 days'),

  -- Bello Horizonte · RESUELTO · Salud
  (179::smallint, 5::smallint,
   'Brigada de salud en el parque central',
   'brigada-salud-parque-central',
   'Brigada de vacunación, citologías y tamizaje atendió a 312 personas en una jornada el último sábado. Caso entregado, próxima brigada agendada para octubre.',
   'resuelto'::text, 10.880::numeric, -74.785::numeric,
   now() - interval '20 days', now() - interval '4 days',
   now() - interval '25 days', now() - interval '4 days')
) AS x(barrio_id, categoria_id, titulo, slug, descripcion, estado, lat, lng,
       publicado_en, resuelto_en, creado_en, actualizado_en)
  ON c.barrio_id = x.barrio_id
ON CONFLICT (capitulo_id, slug) DO UPDATE SET
  titulo         = EXCLUDED.titulo,
  descripcion    = EXCLUDED.descripcion,
  estado         = EXCLUDED.estado,
  lat            = EXCLUDED.lat,
  lng            = EXCLUDED.lng,
  publicado_en   = EXCLUDED.publicado_en,
  resuelto_en    = EXCLUDED.resuelto_en,
  actualizado_en = now();

COMMIT;

-- Refrescar la materialized view de stats globales para que el Hero muestre
-- los nuevos contadores.
SELECT public.refresh_stats_globales();

-- Verificación rápida
SELECT 'capitulos_activos' AS metric, COUNT(*) AS valor
  FROM public.capitulos WHERE activo = true
UNION ALL
SELECT 'casos_total',     COUNT(*) FROM public.casos
UNION ALL
SELECT 'casos_publicos',  COUNT(*) FROM public.casos WHERE estado IN ('critico','progreso','resuelto')
UNION ALL
SELECT 'casos_criticos',  COUNT(*) FROM public.casos WHERE estado = 'critico'
UNION ALL
SELECT 'casos_progreso',  COUNT(*) FROM public.casos WHERE estado = 'progreso'
UNION ALL
SELECT 'casos_resueltos', COUNT(*) FROM public.casos WHERE estado = 'resuelto'
UNION ALL
SELECT 'casos_pendiente', COUNT(*) FROM public.casos WHERE estado = 'pendiente';
