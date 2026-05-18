-- ============================================================================
-- 21-notify-cableado.sql · BISS Sprint H · H1
--
-- Cabla la edge function `notify-email` desde Postgres usando pg_net:
-- - Helper enviar_notificacion(tipo, ciudadano_id, payload).
-- - Trigger AFTER INSERT solicitudes_caso → tipo 'solicitud_recibida'.
-- - Trigger AFTER UPDATE solicitudes_caso (a 'rechazada') → tipo 'solicitud_rechazada'.
-- - RPC aprobar_solicitud llama 'solicitud_aprobada' después de crear caso.
-- - RPC cambiar_estado_caso llama 'caso_avanzo' después de actualizar.
--
-- pg_net habilitada en migración inline (db/21 mismo bloque).
-- notify-email está desplegada con --no-verify-jwt; no requiere Authorization.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- URL del endpoint vive como app setting para poder cambiarse sin redeploy.
-- Si no está seteada usa el default del project_ref de prod.
DO $$
BEGIN
  PERFORM set_config('app.notify_url', 'https://uicpkqwmjjrywojhwctq.supabase.co/functions/v1/notify-email', false);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.enviar_notificacion(
  p_tipo        text,
  p_ciudadano_id uuid,
  p_payload     jsonb DEFAULT '{}'::jsonb
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_url     text := 'https://uicpkqwmjjrywojhwctq.supabase.co/functions/v1/notify-email';
  v_body    jsonb;
  v_req_id  bigint;
BEGIN
  IF p_ciudadano_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_body := jsonb_build_object(
    'tipo', p_tipo,
    'ciudadano_id', p_ciudadano_id,
    'payload', COALESCE(p_payload, '{}'::jsonb)
  );

  -- fire-and-forget. pg_net mete la request en una cola async; si falla, no
  -- bloquea la transacción. Log queda en net._http_response para debug.
  SELECT extensions.net.http_post(
    url := v_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := v_body,
    timeout_milliseconds := 5000
  ) INTO v_req_id;

  RETURN v_req_id;
EXCEPTION WHEN OTHERS THEN
  -- No fallar si pg_net o el endpoint tienen problemas; logueamos y seguimos.
  RAISE WARNING 'enviar_notificacion fallo: %', SQLERRM;
  RETURN NULL;
END $$;

-- ─── Trigger: solicitud_recibida ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.tg_notify_solicitud_recibida()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_barrio text;
BEGIN
  SELECT nombre INTO v_barrio FROM public.barrios WHERE id = NEW.barrio_id;
  PERFORM public.enviar_notificacion(
    'solicitud_recibida',
    NEW.ciudadano_id,
    jsonb_build_object(
      'titulo', NEW.titulo,
      'barrio', COALESCE(v_barrio, '—')
    )
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_solicitud_recibida ON public.solicitudes_caso;
CREATE TRIGGER trg_notify_solicitud_recibida
AFTER INSERT ON public.solicitudes_caso
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_solicitud_recibida();

-- ─── Trigger: solicitud_rechazada ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.tg_notify_solicitud_rechazada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.estado = 'rechazada' AND COALESCE(OLD.estado, 'pendiente') <> 'rechazada' THEN
    PERFORM public.enviar_notificacion(
      'solicitud_rechazada',
      NEW.ciudadano_id,
      jsonb_build_object(
        'titulo', NEW.titulo,
        'motivo', COALESCE(NEW.motivo_rechazo, 'Sin motivo registrado.')
      )
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_solicitud_rechazada ON public.solicitudes_caso;
CREATE TRIGGER trg_notify_solicitud_rechazada
AFTER UPDATE OF estado ON public.solicitudes_caso
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_solicitud_rechazada();

-- ─── RPC aprobar_solicitud: notifica solicitud_aprobada ─────────────────────

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
  ) RETURNING id, slug INTO v_caso_id, v_caso_slug;

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

-- ─── RPC cambiar_estado_caso: notifica caso_avanzo ──────────────────────────
-- Solo notifica al ciudadano que reportó (si hay solicitud origen).

CREATE OR REPLACE FUNCTION public.cambiar_estado_caso(
  p_caso_id uuid, p_nuevo public.estado_caso, p_nota text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_caso public.casos%ROWTYPE;
  v_ciudadano_id uuid;
  v_estado_label text;
BEGIN
  IF NOT public.is_editor_o_admin() THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  SELECT * INTO v_caso FROM public.casos WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Caso no existe.'; END IF;

  UPDATE public.casos
    SET estado = p_nuevo,
        actualizado_en = now(),
        resuelto_en = CASE WHEN p_nuevo = 'resuelto' THEN now() ELSE resuelto_en END,
        publicado_en = CASE
          WHEN p_nuevo IN ('critico','progreso','resuelto') AND publicado_en IS NULL THEN now()
          ELSE publicado_en
        END
    WHERE id = p_caso_id;

  INSERT INTO public.actualizaciones_caso (
    caso_id, tipo, texto, estado_anterior, estado_nuevo, autor_cms_id, ocurrido_en
  ) VALUES (
    p_caso_id, 'cambio_estado',
    COALESCE(p_nota, 'Cambió a ' || p_nuevo::text || '.'),
    v_caso.estado, p_nuevo, auth.uid(), current_date
  );

  -- Notifica solo si la solicitud origen tiene ciudadano y el estado nuevo es
  -- visible al público (no notificar pendientes/archivados).
  IF p_nuevo IN ('critico','progreso','resuelto') AND v_caso.solicitud_origen_id IS NOT NULL THEN
    SELECT ciudadano_id INTO v_ciudadano_id
    FROM public.solicitudes_caso WHERE id = v_caso.solicitud_origen_id;

    v_estado_label := CASE p_nuevo
      WHEN 'critico'  THEN 'crítico'
      WHEN 'progreso' THEN 'en gestión'
      WHEN 'resuelto' THEN 'resuelto'
      ELSE p_nuevo::text
    END;

    PERFORM public.enviar_notificacion(
      'caso_avanzo',
      v_ciudadano_id,
      jsonb_build_object(
        'titulo', v_caso.titulo,
        'estado', v_estado_label,
        'url', 'https://mibiss.com.co/caso/' || COALESCE(v_caso.slug, v_caso.id::text)
      )
    );
  END IF;
END $$;

COMMIT;
