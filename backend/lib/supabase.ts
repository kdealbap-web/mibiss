// =============================================================================
// backend/lib/supabase.ts · Re-export del cliente del frontend
// Las edge functions usan su propio cliente con service_role; aquí solo el del frontend.
// =============================================================================
export { supabase } from '../../frontend/src/lib/supabase';
