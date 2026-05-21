-- ============================================================================
-- 27-cleanup-demo-prelaunch.sql · BISS · Limpieza demo previa al lanzamiento público
--
-- Borra los 10 casos demo (08-demo-seed.sql + 11-demo-casos.sql) más el caso
-- "PROBLEMA DE POSTES EN MAL ESTADO" de Las Margaritas (test inicial). También
-- limpia testimonios, padrinos, multimedia y notas internas asociadas. Por
-- último desactiva los capítulos demo y limpia su geocerca / portada placeholder
-- para que Kevin los reactive manualmente cuando suba la primera bitácora real.
--
-- Idempotente: las cláusulas WHERE matchean por slug/descripción específicos.
-- Re-ejecutable.
-- ============================================================================

BEGIN;

-- ───────────── 0. Borrar solicitudes que referencian casos demo ─────────────
-- FK solicitudes_caso.caso_generado_id → casos(id) ON DELETE SET NULL viola
-- el chk_solicitud_aprobada cuando estado='aprobada'. Por eso borramos primero.
DELETE FROM public.solicitudes_caso
WHERE caso_generado_id IN (
  SELECT c.id
  FROM public.casos c
  JOIN public.capitulos cap ON cap.id = c.capitulo_id
  JOIN public.barrios b ON b.id = cap.barrio_id
  WHERE (b.slug, c.slug) IN (
    ('costa-de-oro',    'postes-calle-80-sin-alumbrado'),
    ('los-almendros',   'aguas-residuales-cra-5'),
    ('centro',          'crater-calle-30'),
    ('centro',          'comedor-comunitario-3a-edad'),
    ('manuela-beltran', 'subestacion-corta-luz-cada-noche'),
    ('bello-horizonte', 'brigada-salud-parque-central'),
    ('centro',          'postes-sin-alumbrado-30'),
    ('los-almendros',   'tuberia-rota-calle-80'),
    ('los-almendros',   'comedor-comunitario-insumos'),
    ('el-hipodromo',    'subestacion-corta-luz'),
    ('las-margaritas',  'problema-de-postes-en-mal-estado')
  )
);

-- También borrar solicitudes huérfanas o el test inicial por título.
DELETE FROM public.solicitudes_caso
WHERE titulo ILIKE '%PROBLEMA DE POSTES EN MAL ESTADO%';

-- ───────────── 1. Eliminar dependientes de los casos demo ─────────────
WITH demo_casos AS (
  SELECT c.id
  FROM public.casos c
  JOIN public.capitulos cap ON cap.id = c.capitulo_id
  JOIN public.barrios b ON b.id = cap.barrio_id
  WHERE (b.slug, c.slug) IN (
    -- 08-demo-seed.sql
    ('costa-de-oro',    'postes-calle-80-sin-alumbrado'),
    ('los-almendros',   'aguas-residuales-cra-5'),
    ('centro',          'crater-calle-30'),
    ('centro',          'comedor-comunitario-3a-edad'),
    ('manuela-beltran', 'subestacion-corta-luz-cada-noche'),
    ('bello-horizonte', 'brigada-salud-parque-central'),
    -- 11-demo-casos.sql
    ('centro',          'postes-sin-alumbrado-30'),
    ('los-almendros',   'tuberia-rota-calle-80'),
    ('los-almendros',   'comedor-comunitario-insumos'),
    ('el-hipodromo',    'subestacion-corta-luz'),
    -- caso de prueba inicial
    ('las-margaritas',  'problema-de-postes-en-mal-estado')
  )
)
DELETE FROM public.testimonios
WHERE caso_id IN (SELECT id FROM demo_casos);

WITH demo_casos AS (
  SELECT c.id
  FROM public.casos c
  JOIN public.capitulos cap ON cap.id = c.capitulo_id
  JOIN public.barrios b ON b.id = cap.barrio_id
  WHERE (b.slug, c.slug) IN (
    ('costa-de-oro',    'postes-calle-80-sin-alumbrado'),
    ('los-almendros',   'aguas-residuales-cra-5'),
    ('centro',          'crater-calle-30'),
    ('centro',          'comedor-comunitario-3a-edad'),
    ('manuela-beltran', 'subestacion-corta-luz-cada-noche'),
    ('bello-horizonte', 'brigada-salud-parque-central'),
    ('centro',          'postes-sin-alumbrado-30'),
    ('los-almendros',   'tuberia-rota-calle-80'),
    ('los-almendros',   'comedor-comunitario-insumos'),
    ('el-hipodromo',    'subestacion-corta-luz'),
    ('las-margaritas',  'problema-de-postes-en-mal-estado')
  )
)
DELETE FROM public.padrinos_caso
WHERE caso_id IN (SELECT id FROM demo_casos);

WITH demo_casos AS (
  SELECT c.id
  FROM public.casos c
  JOIN public.capitulos cap ON cap.id = c.capitulo_id
  JOIN public.barrios b ON b.id = cap.barrio_id
  WHERE (b.slug, c.slug) IN (
    ('costa-de-oro',    'postes-calle-80-sin-alumbrado'),
    ('los-almendros',   'aguas-residuales-cra-5'),
    ('centro',          'crater-calle-30'),
    ('centro',          'comedor-comunitario-3a-edad'),
    ('manuela-beltran', 'subestacion-corta-luz-cada-noche'),
    ('bello-horizonte', 'brigada-salud-parque-central'),
    ('centro',          'postes-sin-alumbrado-30'),
    ('los-almendros',   'tuberia-rota-calle-80'),
    ('los-almendros',   'comedor-comunitario-insumos'),
    ('el-hipodromo',    'subestacion-corta-luz'),
    ('las-margaritas',  'problema-de-postes-en-mal-estado')
  )
)
DELETE FROM public.multimedia_casos
WHERE caso_id IN (SELECT id FROM demo_casos);

WITH demo_casos AS (
  SELECT c.id
  FROM public.casos c
  JOIN public.capitulos cap ON cap.id = c.capitulo_id
  JOIN public.barrios b ON b.id = cap.barrio_id
  WHERE (b.slug, c.slug) IN (
    ('costa-de-oro',    'postes-calle-80-sin-alumbrado'),
    ('los-almendros',   'aguas-residuales-cra-5'),
    ('centro',          'crater-calle-30'),
    ('centro',          'comedor-comunitario-3a-edad'),
    ('manuela-beltran', 'subestacion-corta-luz-cada-noche'),
    ('bello-horizonte', 'brigada-salud-parque-central'),
    ('centro',          'postes-sin-alumbrado-30'),
    ('los-almendros',   'tuberia-rota-calle-80'),
    ('los-almendros',   'comedor-comunitario-insumos'),
    ('el-hipodromo',    'subestacion-corta-luz'),
    ('las-margaritas',  'problema-de-postes-en-mal-estado')
  )
)
DELETE FROM public.caso_notas_internas
WHERE caso_id IN (SELECT id FROM demo_casos);

-- ───────────── 2. Eliminar los casos demo ─────────────
DELETE FROM public.casos c
USING public.capitulos cap, public.barrios b
WHERE cap.id = c.capitulo_id
  AND b.id = cap.barrio_id
  AND (b.slug, c.slug) IN (
    ('costa-de-oro',    'postes-calle-80-sin-alumbrado'),
    ('los-almendros',   'aguas-residuales-cra-5'),
    ('centro',          'crater-calle-30'),
    ('centro',          'comedor-comunitario-3a-edad'),
    ('manuela-beltran', 'subestacion-corta-luz-cada-noche'),
    ('bello-horizonte', 'brigada-salud-parque-central'),
    ('centro',          'postes-sin-alumbrado-30'),
    ('los-almendros',   'tuberia-rota-calle-80'),
    ('los-almendros',   'comedor-comunitario-insumos'),
    ('el-hipodromo',    'subestacion-corta-luz'),
    ('las-margaritas',  'problema-de-postes-en-mal-estado')
  );

-- ───────────── 3. Desactivar capítulos demo + limpiar campos placeholder ─────────────
-- chk_capitulos_activo_completo solo se aplica si activo=true, así que al
-- desactivarlos podemos limpiar geocerca/portada sin romper la constraint.
UPDATE public.capitulos
   SET activo             = false,
       activado_en        = NULL,
       geocerca           = NULL,
       imagen_portada_url = NULL,
       descripcion        = NULL,
       actualizado_en     = now()
 WHERE barrio_id IN (
         4,    -- costa-de-oro
         60,   -- los-almendros
         94,   -- centro
         104,  -- el-hipodromo
         157,  -- manuela-beltran
         179   -- bello-horizonte
       )
   AND (
        imagen_portada_url ILIKE '%picsum.photos%'
     OR descripcion ILIKE '%demo%'
     OR descripcion ILIKE '%Bitácora demo%'
   );

COMMIT;

-- ───────────── 4. Refrescar materialized view de stats globales ─────────────
SELECT public.refresh_stats_globales();

-- ───────────── Verificación ─────────────
SELECT 'casos_restantes'        AS metric, COUNT(*) AS valor FROM public.casos
UNION ALL
SELECT 'capitulos_activos',     COUNT(*) FROM public.capitulos WHERE activo = true
UNION ALL
SELECT 'capitulos_inactivos',   COUNT(*) FROM public.capitulos WHERE activo = false
UNION ALL
SELECT 'testimonios_restantes', COUNT(*) FROM public.testimonios
UNION ALL
SELECT 'padrinos_restantes',    COUNT(*) FROM public.padrinos
UNION ALL
SELECT 'multimedia_restantes',  COUNT(*) FROM public.multimedia_casos
UNION ALL
SELECT 'solicitudes_restantes', COUNT(*) FROM public.solicitudes_caso;
