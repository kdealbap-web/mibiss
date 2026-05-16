-- ============================================================================
-- 03-functions.sql · BISS (Banco de Ideas y Soluciones de Soledad)
-- Funciones, triggers y stored procedures.
-- Ejecutar después de 01-schema.sql.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Helpers
-- ----------------------------------------------------------------------------

-- slugify: minúsculas, sin tildes, espacios → '-', solo a-z0-9-
CREATE OR REPLACE FUNCTION public.slugify(p_text text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT regexp_replace(
           regexp_replace(
             lower(public.f_unaccent(coalesce(p_text,''))),
             '[^a-z0-9]+', '-', 'g'
           ),
           '(^-+|-+$)', '', 'g'
         );
$$;

-- Helper de rol del usuario actual (lee usuarios_cms)
CREATE OR REPLACE FUNCTION public.current_rol_cms()
RETURNS public.rol_cms
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT u.rol FROM public.usuarios_cms u WHERE u.id = auth.uid() AND u.activo = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT public.current_rol_cms() IN ('admin','superadmin'); $$;

CREATE OR REPLACE FUNCTION public.is_editor_o_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT public.current_rol_cms() IN ('editor','admin','superadmin'); $$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT public.current_rol_cms() = 'superadmin'; $$;

-- Editor con scope sobre un barrio específico (o admin total)
CREATE OR REPLACE FUNCTION public.editor_cubre_barrio(p_barrio_id smallint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.editores_barrios eb
      WHERE eb.usuario_cms_id = auth.uid() AND eb.barrio_id = p_barrio_id
    );
$$;

-- ----------------------------------------------------------------------------
-- 2. Trigger genérico: actualizado_en = now()
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_set_actualizado_en()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_casos_actualizado_en      ON public.casos;
CREATE TRIGGER tg_casos_actualizado_en      BEFORE UPDATE ON public.casos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_actualizado_en();

DROP TRIGGER IF EXISTS tg_capitulos_actualizado_en  ON public.capitulos;
CREATE TRIGGER tg_capitulos_actualizado_en  BEFORE UPDATE ON public.capitulos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_actualizado_en();

-- ----------------------------------------------------------------------------
-- 3. Triggers de transición de estado de casos
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_caso_estado_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Cuando pasa de pendiente → publicado
  IF OLD.estado = 'pendiente' AND NEW.estado <> 'pendiente' AND NEW.publicado_en IS NULL THEN
    NEW.publicado_en := now();
  END IF;
  -- Cuando pasa a resuelto
  IF NEW.estado = 'resuelto' AND OLD.estado <> 'resuelto' THEN
    NEW.resuelto_en := now();
  END IF;
  -- Cuando reabren un caso resuelto
  IF OLD.estado = 'resuelto' AND NEW.estado <> 'resuelto' THEN
    NEW.resuelto_en := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_casos_estado_pre ON public.casos;
CREATE TRIGGER tg_casos_estado_pre BEFORE UPDATE ON public.casos
  FOR EACH ROW WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.tg_caso_estado_change();

-- Después del UPDATE, agregar entrada inmutable a la línea de tiempo
CREATE OR REPLACE FUNCTION public.tg_caso_estado_log()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.actualizaciones_caso (
    caso_id, tipo, texto, estado_anterior, estado_nuevo, autor_cms_id, ocurrido_en
  ) VALUES (
    NEW.id,
    'cambio_estado',
    format('Estado: %s → %s', OLD.estado, NEW.estado),
    OLD.estado,
    NEW.estado,
    coalesce(auth.uid(), NEW.creado_por),
    current_date
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_casos_estado_log ON public.casos;
CREATE TRIGGER tg_casos_estado_log AFTER UPDATE ON public.casos
  FOR EACH ROW WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.tg_caso_estado_log();

-- ----------------------------------------------------------------------------
-- 4. Inmutabilidad de actualizaciones_caso
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_actualizaciones_inmutables()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF public.is_superadmin() THEN
    RETURN coalesce(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'La línea de tiempo es inmutable. Para corregir, agrega una entrada de tipo "correccion".';
END $$;

DROP TRIGGER IF EXISTS tg_act_no_update ON public.actualizaciones_caso;
CREATE TRIGGER tg_act_no_update BEFORE UPDATE ON public.actualizaciones_caso
  FOR EACH ROW EXECUTE FUNCTION public.tg_actualizaciones_inmutables();

DROP TRIGGER IF EXISTS tg_act_no_delete ON public.actualizaciones_caso;
CREATE TRIGGER tg_act_no_delete BEFORE DELETE ON public.actualizaciones_caso
  FOR EACH ROW EXECUTE FUNCTION public.tg_actualizaciones_inmutables();

-- ----------------------------------------------------------------------------
-- 5. Solicitudes: máximo 3 pendientes por ciudadano
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_solicitudes_max3()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_pendientes int;
  v_max int;
BEGIN
  SELECT (value->>'solicitudes_pendientes_por_ciudadano')::int INTO v_max
    FROM public.settings WHERE key = 'limits';
  v_max := coalesce(v_max, 3);

  SELECT count(*) INTO v_pendientes
    FROM public.solicitudes_caso
    WHERE ciudadano_id = NEW.ciudadano_id AND estado = 'pendiente';

  IF v_pendientes >= v_max THEN
    RAISE EXCEPTION 'Ya tienes % solicitudes pendientes. Espera a que sean revisadas.', v_max;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_solicitudes_pre ON public.solicitudes_caso;
CREATE TRIGGER tg_solicitudes_pre BEFORE INSERT ON public.solicitudes_caso
  FOR EACH ROW EXECUTE FUNCTION public.tg_solicitudes_max3();

-- ----------------------------------------------------------------------------
-- 6. Comentarios: ventana de edición 15 minutos
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_comentarios_edit_window()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF public.is_admin() THEN
    NEW.editado_en := now();
    RETURN NEW;
  END IF;

  IF OLD.creado_en + interval '15 minutes' < now() THEN
    RAISE EXCEPTION 'Ya pasó la ventana de 15 minutos para editar este comentario.';
  END IF;

  IF OLD.ciudadano_id <> NEW.ciudadano_id OR OLD.id <> NEW.id THEN
    RAISE EXCEPTION 'No se permite cambiar autor o id del comentario.';
  END IF;

  NEW.editado_en := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_comentarios_edit ON public.comentarios;
CREATE TRIGGER tg_comentarios_edit BEFORE UPDATE ON public.comentarios
  FOR EACH ROW EXECUTE FUNCTION public.tg_comentarios_edit_window();

-- ----------------------------------------------------------------------------
-- 7. Slug auto en casos si no se provee
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_casos_slug_auto()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_base text;
  v_try text;
  v_n int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_base := public.slugify(NEW.titulo);
    v_try := v_base;
    LOOP
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.casos
        WHERE capitulo_id = NEW.capitulo_id AND slug = v_try AND id <> NEW.id
      );
      v_n := v_n + 1;
      v_try := v_base || '-' || v_n;
    END LOOP;
    NEW.slug := v_try;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_casos_slug ON public.casos;
CREATE TRIGGER tg_casos_slug BEFORE INSERT OR UPDATE OF titulo, slug ON public.casos
  FOR EACH ROW EXECUTE FUNCTION public.tg_casos_slug_auto();

-- ----------------------------------------------------------------------------
-- 8. Procedimiento: aprobar solicitud → genera caso pendiente
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.aprobar_solicitud(p_solicitud_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sol public.solicitudes_caso%ROWTYPE;
  v_capitulo_id uuid;
  v_caso_id uuid;
BEGIN
  IF NOT public.is_editor_o_admin() THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  SELECT * INTO v_sol FROM public.solicitudes_caso WHERE id = p_solicitud_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no existe.'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud no está pendiente.'; END IF;

  SELECT id INTO v_capitulo_id FROM public.capitulos WHERE barrio_id = v_sol.barrio_id;
  IF v_capitulo_id IS NULL THEN
    -- crear capítulo inactivo si el barrio no lo tiene
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

  UPDATE public.solicitudes_caso
    SET estado = 'aprobada',
        revisado_por = auth.uid(),
        revisado_en = now(),
        caso_generado_id = v_caso_id
    WHERE id = p_solicitud_id;

  RETURN v_caso_id;
END $$;

-- ----------------------------------------------------------------------------
-- 9. Procedimiento: cambiar estado con nota
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cambiar_estado_caso(
  p_caso_id uuid, p_nuevo public.estado_caso, p_nota text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_capitulo_id uuid;
  v_barrio_id smallint;
BEGIN
  SELECT c.capitulo_id, cap.barrio_id INTO v_capitulo_id, v_barrio_id
    FROM public.casos c JOIN public.capitulos cap ON cap.id = c.capitulo_id
    WHERE c.id = p_caso_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Caso no existe.'; END IF;
  IF NOT public.editor_cubre_barrio(v_barrio_id) THEN
    RAISE EXCEPTION 'No tienes permisos para este barrio.';
  END IF;

  UPDATE public.casos SET estado = p_nuevo WHERE id = p_caso_id;

  IF p_nota IS NOT NULL AND length(p_nota) > 0 THEN
    INSERT INTO public.actualizaciones_caso (caso_id, tipo, texto, autor_cms_id, ocurrido_en)
    VALUES (p_caso_id, 'nota', p_nota, auth.uid(), current_date);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10. Anonimizar ciudadano (Habeas Data soft-delete)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.eliminar_ciudadano_anonimizando(p_ciudadano_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() <> (SELECT auth_user_id FROM public.ciudadanos WHERE id = p_ciudadano_id)
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el propio ciudadano o un administrador pueden eliminar la cuenta.';
  END IF;

  UPDATE public.ciudadanos SET
    cedula           = 'ELIM-' || substring(encode(digest(cedula, 'sha256'), 'hex') for 12),
    nombres          = 'Ciudadano',
    apellidos        = 'de Soledad',
    direccion        = '—',
    email            = ('elim-' || id::text || '@anon.local')::citext,
    telefono_celular = '—',
    telefono_fijo    = NULL,
    eliminado_en     = now(),
    auth_user_id     = NULL
  WHERE id = p_ciudadano_id;
END $$;

-- ----------------------------------------------------------------------------
-- 11. Audit log helper
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_audit(
  p_accion text, p_entidad text, p_entidad_id text, p_diff jsonb
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, accion, entidad, entidad_id, diff)
  VALUES (auth.uid(), p_accion, p_entidad, p_entidad_id, p_diff);
END $$;

COMMIT;

-- pgcrypto's digest is in extension; ensure available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
