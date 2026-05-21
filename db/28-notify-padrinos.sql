-- ============================================================================
-- 28-notify-padrinos.sql · BISS · Email automático al inscribirse un padrino
--
-- Crea:
--   - helper public.enviar_notificacion_directa(tipo, to_email, to_nombre, payload)
--   - config_app 'admin_alerta_email' (email donde llegan las alertas internas).
--   - trigger AFTER INSERT en padrinos que dispara 2 emails:
--       1) Confirmación al padrino (a su contacto_privado_email).
--       2) Alerta al admin (al email de config_app).
--
-- La edge function notify-email se desplegó con soporte para el modo directo
-- ({tipo, to_email, to_nombre, payload}). pg_net se reutiliza igual que en
-- db/21-notify-cableado.sql (fire-and-forget, no bloquea la transacción).
-- ============================================================================

BEGIN;

-- ─── Helper directo ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enviar_notificacion_directa(
  p_tipo     text,
  p_to_email text,
  p_to_nombre text,
  p_payload  jsonb DEFAULT '{}'::jsonb
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_url    text := 'https://uicpkqwmjjrywojhwctq.supabase.co/functions/v1/notify-email';
  v_body   jsonb;
  v_req_id bigint;
BEGIN
  IF p_to_email IS NULL OR p_to_email = '' THEN
    RETURN NULL;
  END IF;

  v_body := jsonb_build_object(
    'tipo',      p_tipo,
    'to_email',  p_to_email,
    'to_nombre', COALESCE(p_to_nombre, ''),
    'payload',   COALESCE(p_payload, '{}'::jsonb)
  );

  SELECT extensions.net.http_post(
    url := v_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := v_body,
    timeout_milliseconds := 5000
  ) INTO v_req_id;

  RETURN v_req_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enviar_notificacion_directa fallo: %', SQLERRM;
  RETURN NULL;
END $$;

-- ─── Config: admin email ─────────────────────────────────────────────────────
-- Inserta el default solo si no existe (no sobreescribe si ya lo configuraron).
INSERT INTO public.config_app (key, value)
VALUES (
  'admin_alerta_email',
  to_jsonb('kevin.dealba@supergirosatlantico.co'::text)
)
ON CONFLICT (key) DO NOTHING;

-- ─── Trigger: padrino inscripción ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_notify_padrino_inscripcion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_email text;
  v_caso_titulo text;
BEGIN
  -- Caso opcional (M:N): si la inscripción referencia algún caso, lo agarramos.
  SELECT c.titulo INTO v_caso_titulo
  FROM public.padrinos_caso pc
  JOIN public.casos c ON c.id = pc.caso_id
  WHERE pc.padrino_id = NEW.id
  ORDER BY pc.creado_en DESC NULLS LAST
  LIMIT 1;

  -- 1) Confirmación al padrino
  IF NEW.contacto_privado_email IS NOT NULL THEN
    PERFORM public.enviar_notificacion_directa(
      'padrino_inscripcion',
      NEW.contacto_privado_email::text,
      NEW.nombre,
      jsonb_build_object(
        'tier',         NEW.tier,
        'caso_titulo',  v_caso_titulo,
        'tipo_apoyo',   NEW.tipo_apoyo
      )
    );
  END IF;

  -- 2) Alerta al admin
  SELECT (value #>> '{}')::text INTO v_admin_email
  FROM public.config_app WHERE key = 'admin_alerta_email';

  IF v_admin_email IS NOT NULL AND v_admin_email <> '' THEN
    PERFORM public.enviar_notificacion_directa(
      'padrino_admin',
      v_admin_email,
      'Equipo BISS',
      jsonb_build_object(
        'nombres',      NEW.nombre,
        'tier',         NEW.tier,
        'tipo_apoyo',   NEW.tipo_apoyo,
        'email',        NEW.contacto_privado_email,
        'telefono',     NEW.contacto_privado_tel,
        'descripcion',  NEW.descripcion,
        'caso_titulo',  v_caso_titulo
      )
    );
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_padrino_inscripcion ON public.padrinos;
CREATE TRIGGER trg_notify_padrino_inscripcion
AFTER INSERT ON public.padrinos
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_padrino_inscripcion();

COMMIT;

-- ───────────── Verificación ─────────────
SELECT key, value FROM public.config_app WHERE key = 'admin_alerta_email';
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.padrinos'::regclass AND tgname = 'trg_notify_padrino_inscripcion';
