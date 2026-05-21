-- Backfill: activar capítulos de barrios con coords + publicar casos pendientes
-- que vinieron de solicitudes aprobadas (legacy desde antes de db/29a).

UPDATE public.capitulos cap
   SET geocerca = COALESCE(cap.geocerca, jsonb_build_object('type', 'Polygon', 'coordinates', jsonb_build_array(jsonb_build_array(jsonb_build_array(b.coord_lng - 0.003, b.coord_lat - 0.003), jsonb_build_array(b.coord_lng + 0.003, b.coord_lat - 0.003), jsonb_build_array(b.coord_lng + 0.003, b.coord_lat + 0.003), jsonb_build_array(b.coord_lng - 0.003, b.coord_lat + 0.003), jsonb_build_array(b.coord_lng - 0.003, b.coord_lat - 0.003))))),
       imagen_portada_url = COALESCE(cap.imagen_portada_url, 'https://mibiss.com.co/biss-logo.png'),
       activo = true,
       activado_en = COALESCE(cap.activado_en, now()),
       actualizado_en = now()
  FROM public.barrios b
 WHERE b.id = cap.barrio_id
   AND b.coord_lat IS NOT NULL
   AND b.coord_lng IS NOT NULL
   AND cap.activo = false
   AND EXISTS (SELECT 1 FROM public.casos c WHERE c.capitulo_id = cap.id AND c.estado = 'pendiente' AND c.solicitud_origen_id IS NOT NULL);

UPDATE public.casos
   SET estado = 'critico', publicado_en = COALESCE(publicado_en, now()), actualizado_en = now()
 WHERE estado = 'pendiente' AND solicitud_origen_id IS NOT NULL;

SELECT public.refresh_stats_globales();
