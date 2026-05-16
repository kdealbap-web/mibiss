# 🗄️ Base de Datos · BISS (Banco de Ideas y Soluciones de Soledad)

Scripts SQL listos para ejecutar en **Supabase** (PostgreSQL 15+). Diseñados en 3FN.

## Orden de ejecución

```
1. 00-extensions.sql                ← extensiones (pgcrypto, citext, pg_trgm, unaccent)
2. 01-schema.sql                    ← enums, tablas, FKs, índices, constraints
3. 03-functions.sql                 ← funciones SQL/PLpgSQL + triggers
4. 02-rls-policies.sql              ← Row-Level Security
5. 04-views.sql                     ← vistas y materialized views
6. 05-seed.sql                      ← zonas (5), barrios (204), categorías (8), settings
7. 06-storage.sql                   ← buckets de Supabase Storage + políticas
8. (opcional) 08-demo-seed.sql      ← 5 capítulos + 6 casos demo
9. (opcional) 09-testimonios.sql    ← módulo de testimonios
10.(si DB ya existía) 10-migration-estado-caso.sql
                                    ← migra enum legacy 'borrador'/'gestion'
                                      a 'pendiente'/'progreso'. Solo si tu DB
                                      tenía el esquema anterior.
11.coordenadas_soledad.sql (raíz)   ← actualiza coord_lat/coord_lng de 91 barrios
```

> Nota: el orden 03 → 02 es deliberado; las políticas RLS dependen de `is_admin()`, `is_editor_o_admin()`, `editor_cubre_barrio()` que viven en `03-functions.sql`.

## Cómo ejecutar (Supabase Studio)

1. Crea un nuevo proyecto en supabase.com.
2. Ve a **SQL Editor → New query**.
3. Pega cada archivo en el orden de arriba y ejecuta uno por uno.
4. Verifica:
   ```sql
   SELECT count(*) FROM public.barrios;          -- 204
   SELECT count(*) FROM public.zonas;            -- 5
   SELECT count(*) FROM public.categorias;       -- 8
   SELECT * FROM public.mv_stats_globales;       -- fila única
   ```

## Cómo ejecutar (psql con la cadena de Supabase)

```bash
psql "postgres://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f db/00-extensions.sql \
  -f db/01-schema.sql \
  -f db/03-functions.sql \
  -f db/02-rls-policies.sql \
  -f db/04-views.sql \
  -f db/05-seed.sql \
  -f db/06-storage.sql
```

## Modelo en una mirada

- **Lookup estable (smallint):** `zonas` (5), `barrios` (204), `categorias` (8).
- **Capítulo (uuid):** 1:1 con barrio, se activa con geocerca + portada.
- **Caso (uuid):** vive en un capítulo, tiene categoría, estado, lat/lng, multimedia, línea de tiempo y padrinos.
- **Ciudadano (uuid):** registro completo con OTP SMS, soft-delete con anonimización.
- **Solicitud (uuid):** ciudadano pide nuevo caso → editor aprueba → genera caso `pendiente`.
- **Comentarios (uuid):** ciudadano sobre capítulo o caso, ventana de edición 15 min.
- **Padrinos (uuid + N:N):** apoyo externo a casos.

## Reglas de integridad clave

| Regla | Implementada en |
|-------|-----------------|
| Capítulo activo ⇒ tiene geocerca y portada | CHECK constraint `chk_capitulos_activo_completo` |
| Caso resuelto ⇒ resuelto_en NOT NULL | CHECK constraint `chk_casos_resuelto` |
| Línea de tiempo inmutable (excepto superadmin) | Triggers `tg_act_no_update`/`tg_act_no_delete` |
| Máx 3 solicitudes pendientes / ciudadano | Trigger `tg_solicitudes_pre` |
| Comentarios editables solo 15 min | Trigger `tg_comentarios_edit` |
| Tamaño máx multimedia (5/30/10 MB) | CHECK constraint `chk_media_size` |
| Slugs únicos por capítulo | UNIQUE (capitulo_id, slug) + trigger `tg_casos_slug` |

## Roles esperados

| Rol Supabase Auth | Quién es | Perfil en `usuarios_cms` |
|-------------------|----------|--------------------------|
| `anon` | visitante anónimo | n/a |
| `authenticated` (con citizen flag) | ciudadano | n/a |
| `authenticated` (con CMS row) | editor | rol `editor` |
| `authenticated` (con CMS row) | admin | rol `admin` |
| `authenticated` (con CMS row) | superadmin | rol `superadmin` |
| `service_role` | Edge Functions / backend | bypass RLS |

## Cambios futuros previstos

- Migrar `geocerca` jsonb → PostGIS `geography(Polygon, 4326)` cuando se requiera GIS real.
- Agregar tabla `notificaciones_outbox` si se complica el envío transaccional.
- Particionar `audit_log` por mes después de los primeros 6 meses en producción.
