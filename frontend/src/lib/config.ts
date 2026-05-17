// Configuración central de BISS. Usar este módulo para cualquier referencia
// a dominios, URLs públicas o metadatos en el código (en lugar de hardcodear).

export const APP_CONFIG = {
  name: 'BISS',
  fullName: 'Banco de Ideas y Soluciones de Soledad',
  tagline: 'Solo cosas buenas',
  description:
    'Plataforma cívica para reportar y resolver problemas de Soledad, Atlántico.',
  url: import.meta.env.VITE_PUBLIC_BASE_URL || 'https://mibiss.com.co',
  mediaUrl: import.meta.env.VITE_MEDIA_BASE_URL || 'https://media.mibiss.com.co',
  supportEmail: 'contacto@mibiss.com.co',
  socialEmail: 'hola@mibiss.com.co',
  ogImage: 'https://mibiss.com.co/og-image.png',
  twitterHandle: '@mibisssoledad',
  locale: 'es-CO',
  region: 'Soledad, Atlántico, Colombia',
} as const;

/** Centroide del municipio de Soledad — fallback cuando el barrio no tiene coords. */
export const SOLEDAD_CENTER: readonly [number, number] = [10.917, -74.762];

/** Bounding box geográfico del municipio (validación de inputs lat/lng en admin). */
export const SOLEDAD_BOUNDS = {
  lat: [10.85, 10.96] as const,
  lng: [-74.81, -74.72] as const,
} as const;
