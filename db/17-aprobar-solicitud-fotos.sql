-- ============================================================================
-- 17-aprobar-solicitud-fotos.sql · BISS Sprint E · Bloque 2
--
-- 1. Actualiza RPC `aprobar_solicitud(p_solicitud_id)` para que después de
--    crear el caso, copie `solicitudes_caso.fotos_urls` a `multimedia_casos`
--    con `subido_por = NULL` (el ciudadano original no está en usuarios_cms).
-- 2. Re-CREATE de `v_solicitudes_pendientes` para incluir la columna
--    `fotos_urls` que se necesita en el panel admin.
-- ============================================================================

BEGIN;

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
BEGIN
  IF NOT public.is_editor_o_admin() THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  SELECT * INTO v_sol FROM public.solicitudes_caso WHERE id = p_solicitud_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no existe.'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud no está pendiente.'; END IF;

  SELECT id INTO v_capitulo_id FROM public.capitulos WHERE barrio_id = v_sol.barrio_id;
  IF v_capitulo_id IS NULL THEN
    INSERT INTO public.capitulos (barrio_id, activo) VALUES (v_sol.barrio_id, false)
    RETURNING id INTO v_capitulo_id;
  END IF;

  INSERT INTO public.casos (
    capitulo_id, categoria_id, titulo, slug, descripcion, estado,
    lat, lng, solicitud_origen_id, creado_por
  ) VALUES (
    v_capitulo_id, v_sol.categoria_id, v_sol.titulo, NULL, v_sol.descripcion, 'pendiente',
    v_sol.lat, v_sol.lng, v_sol.id, auth.uid()
  ) RETURNING id INTO v_caso_id;

  -- Copia fotos de R2 a multimedia_casos. subido_por queda NULL porque el
  -- ciudadano original no es usuarios_cms.
  IF v_sol.fotos_urls IS NOT NULL AND array_length(v_sol.fotos_urls, 1) > 0 THEN
    FOREACH v_url IN ARRAY v_sol.fotos_urls LOOP
      INSERT INTO public.multimedia_casos (caso_id, tipo, url, orden, subido_por)
      VALUES (v_caso_id, 'foto', v_url, v_orden, NULL);
      v_orden := v_orden + 1;
    END LOOP;
  END IF;

  UPDATE public.solicitudes_caso
    SET estado = 'aprobada',
        revisado_por = auth.uid(),
        revisado_en = now(),
        caso_generado_id = v_caso_id
    WHERE id = p_solicitud_id;

  RETURN v_caso_id;
END $$;

-- Vista v_solicitudes_pendientes incluye fotos_urls para preview admin.
DROP VIEW IF EXISTS public.v_solicitudes_pendientes CASCADE;

CREATE VIEW public.v_solicitudes_pendientes AS
SELECT
  s.id, s.titulo, s.descripcion, s.lat, s.lng,
  s.creado_en, s.estado,
  s.fotos_urls,
  ci.id            AS ciudadano_id,
  ci.nombres || ' ' || ci.apellidos AS ciudadano,
  ci.telefono_celular,
  ci.email         AS ciudadano_email,
  b.id             AS barrio_id,
  b.nombre         AS barrio,
  cat.codigo       AS categoria_codigo,
  cat.nombre       AS categoria
FROM public.solicitudes_caso s
JOIN public.ciudadanos ci ON ci.id = s.ciudadano_id
JOIN public.barrios    b  ON b.id  = s.barrio_id
JOIN public.categorias cat ON cat.id = s.categoria_id
WHERE s.estado = 'pendiente';

GRANT SELECT ON public.v_solicitudes_pendientes TO authenticated;

COMMIT;
