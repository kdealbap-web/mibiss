// =============================================================================
// schemas/index.ts · Esquemas Zod compartidos frontend ↔ edge functions
// =============================================================================
import { z } from 'zod';

// ----------------------------- Ciudadano (registro) -----------------------------
export const cedulaSchema = z.string()
  .trim()
  .regex(/^\d{6,12}$/, 'Cédula debe tener entre 6 y 12 dígitos');

export const telefonoCelularSchema = z.string()
  .trim()
  .regex(/^(\+57)?3\d{9}$/, 'Celular colombiano inválido (ej: 3001234567)');

export const ciudadanoRegistroSchema = z.object({
  cedula: cedulaSchema,
  nombres: z.string().min(2).max(80),
  apellidos: z.string().min(2).max(80),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha YYYY-MM-DD'),
  barrio_id: z.number().int().positive(),
  estado_civil: z.enum(['soltero','casado','union_libre','separado','divorciado','viudo','no_indica']),
  direccion: z.string().min(3).max(180),
  email: z.string().email().toLowerCase(),
  telefono_celular: telefonoCelularSchema,
  telefono_fijo: z.string().max(20).optional().nullable(),
  miembros_hogar: z.number().int().min(1).max(30),
  estrato: z.number().int().min(1).max(6),
  escolaridad: z.enum([
    'ninguna','primaria_incompleta','primaria','secundaria_incompleta','secundaria',
    'tecnico','tecnologo','universitario_incompleto','universitario','postgrado',
  ]),
  consentimiento_habeas_data: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar el tratamiento de datos para continuar.' }),
  }),
  acepta_notificaciones: z.boolean().default(true),
});
export type CiudadanoRegistro = z.infer<typeof ciudadanoRegistroSchema>;

// ----------------------------- OTP -----------------------------
export const otpSendSchema = z.object({
  telefono: telefonoCelularSchema,
});
export const otpVerifySchema = z.object({
  telefono: telefonoCelularSchema,
  codigo: z.string().regex(/^\d{6}$/, 'Código de 6 dígitos'),
});

// ----------------------------- Solicitud de caso -----------------------------
export const solicitudCasoSchema = z.object({
  barrio_id: z.number().int().positive(),
  categoria_id: z.number().int().positive(),
  titulo: z.string().min(8).max(160),
  descripcion: z.string().min(20).max(4000),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  multimedia: z.array(z.object({
    tipo: z.literal('foto'),
    url: z.string().url(),
    orden: z.number().int().min(0).max(20),
  })).max(3).optional(),
});
export type SolicitudCasoInput = z.infer<typeof solicitudCasoSchema>;

// ----------------------------- Caso (CMS) -----------------------------
export const casoCreateSchema = z.object({
  capitulo_id: z.string().uuid(),
  categoria_id: z.number().int().positive(),
  titulo: z.string().min(8).max(160),
  descripcion: z.string().min(20),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  estado: z.enum(['borrador','critico','gestion','resuelto']).default('borrador'),
});
export const casoUpdateSchema = casoCreateSchema.partial().extend({
  id: z.string().uuid(),
});

// ----------------------------- Comentario -----------------------------
export const comentarioSchema = z.object({
  capitulo_id: z.string().uuid(),
  caso_id: z.string().uuid().optional().nullable(),
  texto: z.string().min(2).max(1500),
});

// ----------------------------- Multimedia upload (presigned) -----------------------------
export const presignSchema = z.object({
  bucket: z.enum(['casos-fotos','casos-videos','casos-pdfs','barrios-portadas','solicitudes-multimedia','padrinos-logos']),
  filename: z.string().min(1).max(180),
  contentType: z.string().min(3).max(120),
  bytes: z.number().int().positive().max(30 * 1024 * 1024),
});

// ----------------------------- Capítulo (admin) -----------------------------
export const capituloUpsertSchema = z.object({
  barrio_id: z.number().int().positive(),
  descripcion: z.string().max(2000).optional().nullable(),
  imagen_portada_url: z.string().url().optional().nullable(),
  geocerca: z.any().optional().nullable(), // GeoJSON polygon - validamos shape mínimo
  activo: z.boolean().optional(),
});

// ----------------------------- Testimonio -----------------------------
export const testimonioSchema = z.object({
  ciudadano_id: z.string().uuid(),
  firmar_como: z.string().min(2).max(60).nullable(),
  relacion: z.enum(['vecino','victima','lider','familiar','otro']),
  mensaje: z.string().min(20).max(1500),
  capitulo_id: z.string().uuid().optional(),
  caso_id: z.string().uuid().optional(),
}).refine((d) => !!d.capitulo_id || !!d.caso_id, {
  message: 'Asocia el testimonio a un barrio o a un caso.',
  path: ['capitulo_id'],
});
export type TestimonioInput = z.infer<typeof testimonioSchema>;

// ----------------------------- Padrino -----------------------------
export const padrinoSchema = z.object({
  nombre: z.string().min(2).max(140),
  tipo_apoyo: z.enum(['financiero','material','voluntario','politico','otro']),
  descripcion: z.string().max(2000).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  contacto_privado_email: z.string().email().optional().nullable(),
  contacto_privado_tel: z.string().max(20).optional().nullable(),
  publicado: z.boolean().default(true),
});
