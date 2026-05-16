# PORT_NOTES — Sprint A + B

Notas de hallazgos, decisiones y observaciones durante el wiring real de Supabase.
Lectura B sobre backend: anoto, no modifico (HANDOFF §13 + R5).

---

## Hallazgos en backend / db (no toco, anoto)

### [db/04-views.sql:110] — `mv_stats_globales` filtra por `'gestion'`, valor que YA NO existe en el enum
La migración `10-migration-estado-caso.sql` renombró `gestion → progreso`, pero la MV se quedó con el filtro viejo:
```sql
(SELECT COUNT(*) FROM public.casos WHERE estado = 'gestion') AS casos_progreso
```
Debería ser `WHERE estado = 'progreso'`. Como `ALTER TYPE ... RENAME VALUE` actualiza datos pero el literal `'gestion'` ya no existe en el enum, esta query falla o devuelve 0.

**Mitigación temporal (frontend):** `useStatsGlobales` consulta la MV. Si devuelve `casos_progreso=0` cuando hay casos en gestión, lo verás. **Solo es display**, no rompe lógica. Pendiente: re-ejecutar `04-views.sql` con la corrección en una migración `11-fix-mv-stats.sql`.

### [db/01-schema.sql] — Tabla `casos` NO tiene columna `folio`
El HANDOFF §7.1 dice "folio CS-YYYY-NNNN generado en trigger", pero el trigger real es `tg_casos_slug_auto` (db/03-functions.sql:209-234) que genera el campo **`slug`**, no folio.

**Decisión:** uso `caso.slug` como display "folio" en la UI con formato `slug.toUpperCase()`. En URLs uso `caso.slug` también (el path param sigue siendo `:folio` por convención visual; internamente es slug). Si el cliente quiere folio CS-YYYY-NNNN real, agregar columna `folio text UNIQUE GENERATED ALWAYS AS ('CS-' || extract(year from creado_en) || '-' || lpad(...)) STORED` en migración futura.

### [db/01-schema.sql] — Tabla `solicitudes_caso` NO tiene `folio`
Mismo caso. Las solicitudes no tienen identificador legible. Uso `id::text` truncado para display si hace falta.

### [db/04-views.sql] — NO existe `v_solicitudes_pendientes_admin`
El bloque pide consumir esta vista. Solo existe `v_solicitudes_pendientes`. La uso (devuelve `id, titulo, descripcion, lat, lng, creado_en, estado, ciudadano_id, ciudadano, telefono_celular, barrio_id, barrio, categoria_codigo, categoria`).

### [db/01-schema.sql] — `ciudadanos.barrio_id` es smallint NOT NULL
FlowIngresar paso 3 pide "barrio" como texto. Para insertar un ciudadano necesito resolver el nombre → smallint via `barrios` (lookup por slug o nombre fuzzy). Por ahora dejo el INSERT a Sprint C cuando Twilio esté listo; FlowIngresar continúa con mock visual (sin INSERT real).

### [db/02-rls-policies.sql] — RLS de `testimonios.insert` requiere `verificado_sms=true`
```sql
ciudadano_id IN (SELECT id FROM public.ciudadanos WHERE auth_user_id = auth.uid() AND verificado_sms = true)
```
En dev sin Twilio, los flows NO podrán insertar testimonios/solicitudes salvo que use service_role o el usuario tenga `verificado_sms=true` manualmente. **Mitigación:** los flows funcionan visualmente. El submit real lo intenta y captura el error de RLS para mostrar "Necesitas verificar tu celular primero" (link a /login → FlowIngresar). En Sprint C, con Twilio, esto se desbloquea.

---

## Decisiones tomadas (R5)

### D1. Hook `useCaso(folio)` busca por `slug`, no por folio real
El path param `/caso/:folio` siempre es el `slug` del caso (lo que se ve en la URL). Internamente:
```ts
.from('v_casos_publicos').select('*').eq('slug', folio).maybeSingle()
```

### D2. Hook de capítulo: `useCapituloPorSlug(slug)` (no `useCapituloPorBarrio`)
El path es `/capitulo/:slug` donde `slug` es el `barrio.slug` (no `capitulo.id`). El hook resuelve barrio → capítulo internamente.

### D3. Avatar inicial — primeras 2 letras del nombre, mayúsculas
Reutilizo helper `initials(nombre: string)` en `frontend/src/lib/format.ts`.

### D4. Empty states siguen el copy del prototipo
- Sin casos: "Aquí no hay casos todavía. Sé el primero en contar."
- Sin testimonios: "Aquí no hay voces todavía. Si vives esto, cuéntalo."
- Sin actualizaciones: "Todavía no hay movimientos. Te avisamos cuando algo pase."
- Sin padrinos: "Aún nadie ha apadrinado este caso. ¿Quieres ser el primero?"

### D5. Mutaciones · invalidations sin optimistic updates
Cada mutation espera `success` del server antes de invalidar. Más simple. (R6 del bloque ya lo dice.)

### D6. Error capture en flows
Capturo error de Supabase. Si el mensaje contiene `row-level security`, muestro copy cercano: "Necesitas verificar tu celular antes de continuar." Si es genérico: "Algo salió raro. Vuelve a intentarlo."

### D7. CiudadanosService.crearVerificado queda en standby
La RLS de `ciudadanos.insert` requiere `auth_user_id = auth.uid()`, que solo se obtiene tras `signInWithOtp` real (Twilio). En dev sin Twilio NO podemos crear ciudadanos desde el frontend (lo bloquea RLS). FlowIngresar paso 3 queda con `TODO: Sprint C — reemplazar mock OTP` y no llama a Supabase. Cuando Twilio esté listo, el edge function `otp-verify` debería crear `auth.users` + `ciudadanos` juntos con service_role.

---

## Por revisar en Sprint C (no toco ahora)

- Bucket B2 legacy: backend/.env.secrets cambió a R2, pero `backend/edge-functions/b2-presign/` sigue como B2. Se elimina/renombra en Sprint C.
- Edge function `notify-email` sigue con `Resend` placeholder.
- `og-image` edge function: el dominio hardcoded sería `mibiss.com.co` (ya quedó actualizado en ciclo previo).
- `Metricas.tsx` admin: gráficos siguen siendo SVG hardcoded con números mock. Connection a `v_stats_globales` + creación de vistas adicionales (`v_top_paginas`, `v_origen_visitas`) son Sprint posterior — analytics depende de Plausible/Umami que aún no está integrado.
