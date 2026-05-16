-- ============================================================================
-- 06-storage.sql · BISS (Banco de Ideas y Soluciones de Soledad)
-- Buckets de Supabase Storage para multimedia (alternativa local a Backblaze B2).
-- En producción, B2 es el primario. Estos buckets sirven como respaldo / dev.
-- ============================================================================

-- Crea buckets vía API de Supabase (storage.buckets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('casos-fotos',    'casos-fotos',    true,   5 * 1024 * 1024, ARRAY['image/jpeg','image/png','image/webp']),
  ('casos-videos',   'casos-videos',   true,  30 * 1024 * 1024, ARRAY['video/mp4']),
  ('casos-pdfs',     'casos-pdfs',     true,  10 * 1024 * 1024, ARRAY['application/pdf']),
  ('barrios-portadas','barrios-portadas',true, 5 * 1024 * 1024, ARRAY['image/jpeg','image/png','image/webp']),
  ('padrinos-logos', 'padrinos-logos', true,   2 * 1024 * 1024, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('og-generated',   'og-generated',   true,   2 * 1024 * 1024, ARRAY['image/png','image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Políticas: lectura pública, escritura solo CMS o ciudadano-propio (solicitudes)
-- ============================================================================

-- Lectura pública en todos los buckets
DROP POLICY IF EXISTS "public_read_casos_fotos"     ON storage.objects;
CREATE POLICY "public_read_casos_fotos"     ON storage.objects FOR SELECT
  USING (bucket_id IN ('casos-fotos','casos-videos','casos-pdfs','barrios-portadas','padrinos-logos','og-generated'));

-- Escritura por CMS (admin/editor)
DROP POLICY IF EXISTS "cms_write_casos" ON storage.objects;
CREATE POLICY "cms_write_casos" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('casos-fotos','casos-videos','casos-pdfs','barrios-portadas','padrinos-logos','og-generated')
    AND public.is_editor_o_admin()
  );

DROP POLICY IF EXISTS "cms_update_casos" ON storage.objects;
CREATE POLICY "cms_update_casos" ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('casos-fotos','casos-videos','casos-pdfs','barrios-portadas','padrinos-logos','og-generated')
    AND public.is_editor_o_admin()
  );

DROP POLICY IF EXISTS "cms_delete_casos" ON storage.objects;
CREATE POLICY "cms_delete_casos" ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('casos-fotos','casos-videos','casos-pdfs','barrios-portadas','padrinos-logos','og-generated')
    AND public.is_editor_o_admin()
  );

-- (Solicitudes ciudadanas suben a un bucket separado con escritura authn)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('solicitudes-multimedia','solicitudes-multimedia',true, 5 * 1024 * 1024,
        ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_solicitudes" ON storage.objects;
CREATE POLICY "public_read_solicitudes" ON storage.objects FOR SELECT
  USING (bucket_id = 'solicitudes-multimedia');

DROP POLICY IF EXISTS "ciudadano_write_solicitudes" ON storage.objects;
CREATE POLICY "ciudadano_write_solicitudes" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'solicitudes-multimedia'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.ciudadanos
                WHERE auth_user_id = auth.uid() AND verificado_sms = true)
  );
