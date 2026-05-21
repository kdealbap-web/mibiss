CREATE OR REPLACE FUNCTION public.aprobar_solicitud(p_solicitud_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sol public.solicitudes_caso%ROWTYPE;
  v_capitulo_id uuid;
  v_caso_id uuid;
  v_url text;
  v_orden smallint := 0;
  v_caso_slug text;
  v_lat numeric;
  v_lng numeric;
BEGIN
  IF NOT public.is_editor_o_admin() THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  SELECT * INTO v_sol FROM public.solicitudes_caso WHERE id = p_solicitud_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no existe.'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud no está pendiente.'; END IF;

  SELECT coord_lat, coord_lng INTO v_lat, v_lng
    FROM public.barrios WHERE id = v_sol.barrio_id;

  SELECT id INTO v_capitulo_id FROM public.capitulos WHERE barrio_id = v_sol.barrio_id;
  IF v_capitulo_id IS NULL THEN
    INSERT INTO public.capitulos (barrio_id, activo) VALUES (v_sol.barrio_id, false)
    RETURNING id INTO v_capitulo_id;
  END IF;

  IF v_lat IS NOT NULL AND v_lng IS NOT NULL THEN
    UPDATE public.capitulos
       SET geocerca = COALESCE(geocerca, jsonb_build_object('type', 'Polygon', 'coordinates', jsonb_build_array(jsonb_build_array(jsonb_build_array(v_lng - 0.003, v_lat - 0.003), jsonb_build_array(v_lng + 0.003, v_lat - 0.003), jsonb_build_array(v_lng + 0.003, v_lat + 0.003), jsonb_build_array(v_lng - 0.003, v_lat + 0.003), jsonb_build_array(v_lng - 0.003, v_lat - 0.003))))),
           imagen_portada_url = COALESCE(imagen_portada_url, 'https://mibiss.com.co/biss-logo.png'),
           activo = true,
           activado_en = COALESCE(activado_en, now()),
           actualizado_en = now()
     WHERE id = v_capitulo_id;
  END IF;

  INSERT INTO public.casos (
    capitulo_id, categoria_id, titulo, slug, descripcion, estado,
    lat, lng, solicitud_origen_id, creado_por, publicado_en
  ) VALUES (
    v_capitulo_id, v_sol.categoria_id, v_sol.titulo, NULL, v_sol.descripcion, 'critico',
    v_sol.lat, v_sol.lng, v_sol.id, auth.uid(), now()
  ) RETURNING id, slug INTO v_caso_id, v_caso_slug;

  IF v_sol.fotos_urls IS NOT NULL AND array_length(v_sol.fotos_urls, 1) > 0 THEN
    FOREACH v_url IN ARRAY v_sol.fotos_urls LOOP
      INSERT INTO public.multimedia_casos (caso_id, tipo, url, orden, subido_por)
      VALUES (
        v_caso_id,
        CASE WHEN v_url ~* '\.(mp4|webm|mov|m4v|ogg)(\?|$)' THEN 'video'::public.tipo_media
             WHEN v_url ~* '\.pdf(\?|$)' THEN 'pdf'::public.tipo_media
             ELSE 'foto'::public.tipo_media END,
        v_url, v_orden, NULL
      );
      v_orden := v_orden + 1;
    END LOOP;
  END IF;

  UPDATE public.solicitudes_caso
    SET estado = 'aprobada',
        revisado_por = auth.uid(),
        revisado_en = now(),
        caso_generado_id = v_caso_id
    WHERE id = p_solicitud_id;

  PERFORM public.enviar_notificacion(
    'solicitud_aprobada',
    v_sol.ciudadano_id,
    jsonb_build_object(
      'titulo', v_sol.titulo,
      'url', 'https://mibiss.com.co/caso/' || COALESCE(v_caso_slug, v_caso_id::text)
    )
  );

  RETURN v_caso_id;
END $$;
