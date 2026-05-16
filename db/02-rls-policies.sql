-- ============================================================================
-- 02-rls-policies.sql · BISS (Banco de Ideas y Soluciones de Soledad)
-- Row-Level Security. Ejecutar después de 01-schema.sql y 03-functions.sql.
-- Estrategia: lectura pública por defecto en lo "publicable", escritura cerrada.
-- ============================================================================

BEGIN;

-- ============================================================================
-- Habilitar RLS en todas las tablas relevantes
-- ============================================================================
ALTER TABLE public.zonas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barrios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_cms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editores_barrios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitulos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciudadanos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verificaciones_otp   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimedia_casos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actualizaciones_caso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_caso     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitud_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padrinos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padrinos_caso        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings             ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Lookup tables: lectura pública, escritura admin
-- ============================================================================
DROP POLICY IF EXISTS p_zonas_select ON public.zonas;
CREATE POLICY p_zonas_select ON public.zonas FOR SELECT USING (true);
DROP POLICY IF EXISTS p_zonas_write ON public.zonas;
CREATE POLICY p_zonas_write ON public.zonas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_barrios_select ON public.barrios;
CREATE POLICY p_barrios_select ON public.barrios FOR SELECT USING (true);
DROP POLICY IF EXISTS p_barrios_write ON public.barrios;
CREATE POLICY p_barrios_write ON public.barrios FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_categorias_select ON public.categorias;
CREATE POLICY p_categorias_select ON public.categorias FOR SELECT USING (true);
DROP POLICY IF EXISTS p_categorias_write ON public.categorias;
CREATE POLICY p_categorias_write ON public.categorias FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- Capítulos
-- ============================================================================
DROP POLICY IF EXISTS p_capitulos_select_pub ON public.capitulos;
CREATE POLICY p_capitulos_select_pub ON public.capitulos FOR SELECT
  USING (activo = true OR public.is_editor_o_admin());

DROP POLICY IF EXISTS p_capitulos_write ON public.capitulos;
CREATE POLICY p_capitulos_write ON public.capitulos FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- Casos
-- ============================================================================
DROP POLICY IF EXISTS p_casos_select_pub ON public.casos;
CREATE POLICY p_casos_select_pub ON public.casos FOR SELECT
  USING (
    estado IN ('critico','progreso','resuelto')
    OR public.is_editor_o_admin()
  );

DROP POLICY IF EXISTS p_casos_insert ON public.casos;
CREATE POLICY p_casos_insert ON public.casos FOR INSERT
  WITH CHECK (
    public.editor_cubre_barrio(
      (SELECT cap.barrio_id FROM public.capitulos cap WHERE cap.id = capitulo_id)
    )
  );

DROP POLICY IF EXISTS p_casos_update ON public.casos;
CREATE POLICY p_casos_update ON public.casos FOR UPDATE
  USING (
    public.editor_cubre_barrio(
      (SELECT cap.barrio_id FROM public.capitulos cap WHERE cap.id = capitulo_id)
    )
  );

DROP POLICY IF EXISTS p_casos_delete ON public.casos;
CREATE POLICY p_casos_delete ON public.casos FOR DELETE USING (public.is_admin());

-- ============================================================================
-- Multimedia y Línea de tiempo (visibles si su caso es visible)
-- ============================================================================
DROP POLICY IF EXISTS p_media_select ON public.multimedia_casos;
CREATE POLICY p_media_select ON public.multimedia_casos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.casos c WHERE c.id = caso_id
                 AND (c.estado IN ('critico','progreso','resuelto') OR public.is_editor_o_admin())));

DROP POLICY IF EXISTS p_media_write ON public.multimedia_casos;
CREATE POLICY p_media_write ON public.multimedia_casos FOR ALL
  USING (public.is_editor_o_admin()) WITH CHECK (public.is_editor_o_admin());

DROP POLICY IF EXISTS p_actualizaciones_select ON public.actualizaciones_caso;
CREATE POLICY p_actualizaciones_select ON public.actualizaciones_caso FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.casos c WHERE c.id = caso_id
                 AND (c.estado IN ('critico','progreso','resuelto') OR public.is_editor_o_admin())));

DROP POLICY IF EXISTS p_actualizaciones_insert ON public.actualizaciones_caso;
CREATE POLICY p_actualizaciones_insert ON public.actualizaciones_caso FOR INSERT
  WITH CHECK (public.is_editor_o_admin());

-- (UPDATE/DELETE bloqueados por trigger 'tg_actualizaciones_inmutables')

-- ============================================================================
-- Ciudadanos (privacidad estricta)
-- ============================================================================
DROP POLICY IF EXISTS p_ciudadanos_select_self ON public.ciudadanos;
CREATE POLICY p_ciudadanos_select_self ON public.ciudadanos FOR SELECT
  USING (auth_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS p_ciudadanos_insert_self ON public.ciudadanos;
CREATE POLICY p_ciudadanos_insert_self ON public.ciudadanos FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS p_ciudadanos_update_self ON public.ciudadanos;
CREATE POLICY p_ciudadanos_update_self ON public.ciudadanos FOR UPDATE
  USING (auth_user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- Verificaciones OTP — solo backend (service_role) escribe; ciudadano lee las suyas
-- ============================================================================
DROP POLICY IF EXISTS p_otp_select_self ON public.verificaciones_otp;
CREATE POLICY p_otp_select_self ON public.verificaciones_otp FOR SELECT
  USING (
    ciudadano_id IS NULL OR
    ciudadano_id IN (SELECT id FROM public.ciudadanos WHERE auth_user_id = auth.uid())
    OR public.is_admin()
  );

-- (INSERT/UPDATE realizados por edge functions con service_role; sin política → sin acceso anon/authn)

-- ============================================================================
-- Solicitudes de caso
-- ============================================================================
DROP POLICY IF EXISTS p_solicitudes_select ON public.solicitudes_caso;
CREATE POLICY p_solicitudes_select ON public.solicitudes_caso FOR SELECT
  USING (
    ciudadano_id IN (SELECT id FROM public.ciudadanos WHERE auth_user_id = auth.uid())
    OR public.is_editor_o_admin()
  );

DROP POLICY IF EXISTS p_solicitudes_insert_self ON public.solicitudes_caso;
CREATE POLICY p_solicitudes_insert_self ON public.solicitudes_caso FOR INSERT
  WITH CHECK (
    ciudadano_id IN (SELECT id FROM public.ciudadanos
                     WHERE auth_user_id = auth.uid() AND verificado_sms = true)
  );

DROP POLICY IF EXISTS p_solicitudes_update ON public.solicitudes_caso;
CREATE POLICY p_solicitudes_update ON public.solicitudes_caso FOR UPDATE
  USING (public.is_editor_o_admin());

DROP POLICY IF EXISTS p_solmedia_select ON public.solicitud_multimedia;
CREATE POLICY p_solmedia_select ON public.solicitud_multimedia FOR SELECT
  USING (
    solicitud_id IN (
      SELECT s.id FROM public.solicitudes_caso s
      JOIN public.ciudadanos c ON c.id = s.ciudadano_id
      WHERE c.auth_user_id = auth.uid()
    )
    OR public.is_editor_o_admin()
  );

DROP POLICY IF EXISTS p_solmedia_insert ON public.solicitud_multimedia;
CREATE POLICY p_solmedia_insert ON public.solicitud_multimedia FOR INSERT
  WITH CHECK (
    solicitud_id IN (
      SELECT s.id FROM public.solicitudes_caso s
      JOIN public.ciudadanos c ON c.id = s.ciudadano_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Comentarios
-- ============================================================================
DROP POLICY IF EXISTS p_comentarios_select_pub ON public.comentarios;
CREATE POLICY p_comentarios_select_pub ON public.comentarios FOR SELECT
  USING (oculto = false OR public.is_editor_o_admin()
         OR ciudadano_id IN (SELECT id FROM public.ciudadanos WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS p_comentarios_insert ON public.comentarios;
CREATE POLICY p_comentarios_insert ON public.comentarios FOR INSERT
  WITH CHECK (
    ciudadano_id IN (SELECT id FROM public.ciudadanos
                     WHERE auth_user_id = auth.uid() AND verificado_sms = true)
  );

DROP POLICY IF EXISTS p_comentarios_update_self ON public.comentarios;
CREATE POLICY p_comentarios_update_self ON public.comentarios FOR UPDATE
  USING (
    public.is_admin()
    OR ciudadano_id IN (SELECT id FROM public.ciudadanos WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS p_comentarios_delete_admin ON public.comentarios;
CREATE POLICY p_comentarios_delete_admin ON public.comentarios FOR DELETE USING (public.is_admin());

-- ============================================================================
-- Padrinos
-- ============================================================================
DROP POLICY IF EXISTS p_padrinos_select ON public.padrinos;
CREATE POLICY p_padrinos_select ON public.padrinos FOR SELECT
  USING (publicado = true OR public.is_editor_o_admin());

DROP POLICY IF EXISTS p_padrinos_write ON public.padrinos;
CREATE POLICY p_padrinos_write ON public.padrinos FOR ALL
  USING (public.is_editor_o_admin()) WITH CHECK (public.is_editor_o_admin());

DROP POLICY IF EXISTS p_padrinos_caso_select ON public.padrinos_caso;
CREATE POLICY p_padrinos_caso_select ON public.padrinos_caso FOR SELECT USING (true);
DROP POLICY IF EXISTS p_padrinos_caso_write ON public.padrinos_caso;
CREATE POLICY p_padrinos_caso_write ON public.padrinos_caso FOR ALL
  USING (public.is_editor_o_admin()) WITH CHECK (public.is_editor_o_admin());

-- ============================================================================
-- CMS users / editores_barrios / audit / settings — admin only
-- ============================================================================
DROP POLICY IF EXISTS p_usuarios_cms_select ON public.usuarios_cms;
CREATE POLICY p_usuarios_cms_select ON public.usuarios_cms FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS p_usuarios_cms_write ON public.usuarios_cms;
CREATE POLICY p_usuarios_cms_write ON public.usuarios_cms FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_editores_barrios_select ON public.editores_barrios;
CREATE POLICY p_editores_barrios_select ON public.editores_barrios FOR SELECT
  USING (usuario_cms_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS p_editores_barrios_write ON public.editores_barrios;
CREATE POLICY p_editores_barrios_write ON public.editores_barrios FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_audit_select ON public.audit_log;
CREATE POLICY p_audit_select ON public.audit_log FOR SELECT USING (public.is_admin());
-- INSERT solo via service_role (sin política).

DROP POLICY IF EXISTS p_settings_select ON public.settings;
CREATE POLICY p_settings_select ON public.settings FOR SELECT
  USING (
    key IN ('branding.persona_publica','feature_flags','mapa','contacto')
    OR public.is_admin()
  );
DROP POLICY IF EXISTS p_settings_write ON public.settings;
CREATE POLICY p_settings_write ON public.settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
