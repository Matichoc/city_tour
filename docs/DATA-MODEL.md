# Modelo de datos — Papudo en tu mano

Fuente de verdad: `supabase/migrations/*.sql`. Este documento es un resumen;
ante cualquier diferencia, mandan las migraciones. Se prueban con
`pnpm test:db` (ver "Pruebas").

Un repo = una comuna. Por eso no hay `commune_id` en cada tabla: existe una
sola fila en `municipality`.

## Decisiones

- **Sin PostGIS.** Una sola comuna: `latitude`/`longitude` simples con `check` de rango; las distancias las calcula el motor de itinerarios.
- **Nada se inventa.** Los booleanos (`parking`, `bathrooms`, `child_friendly`...) son `nullable`: `null` = no se sabe. Las coordenadas son opcionales.
- **Español obligatorio, inglés opcional.** Traducciones en tablas `*_translations` con PK `(entidad, locale)`. La fila `es` no lleva `translation_status`; la `en` sí (`draft` / `needs_review` / `reviewed`). Falta de fila en inglés = "solo español".
- **Publicación y verificación son ejes separados.** `publication_status` (`draft`/`published`/`archived`) y `verification_status` (`pending`/`verified`/`outdated`).
- **FKs reales** en `sources`, `verification_logs` y `verification_tasks` (una columna por tipo de entidad + `check` de que exactamente una venga con valor), en vez de un `entity_id` suelto.

## Tablas

| Grupo         | Tablas |
| ------------- | ------ |
| Geografía     | `municipality` (1 fila), `municipality_translations`, `localities`, `locality_translations` |
| Catálogo      | `categories` (con `parent_id`), `category_translations`, `tags`, `tag_translations` |
| Identidad     | `profiles` (rol del personal), `organization_members` (Fase 7, vacía) |
| Organizaciones| `organizations`, `organization_translations`, `chamber_memberships` (socios de la Cámara) |
| Lugares       | `places`, `place_translations`, `place_hours`, `place_images`, `place_tags`, `lodging_details`, `dining_details` |
| Rutas         | `routes`, `route_translations`, `route_stops` (posición única, diferida), `route_stop_translations` |
| Eventos       | `events`, `event_translations` |
| Verificación  | `sources`, `verification_logs`, `verification_tasks` |
| Auditoría     | `audit_log` |
| Visitantes    | `itineraries`, `itinerary_stops`, `analytics_events` |
| Reportes      | vistas `v_report_catalog`, `v_report_stale`, `v_report_translations` |

## Roles y permisos (RLS activa en todas las tablas)

| Rol           | Lee                                   | Escribe |
| ------------- | ------------------------------------- | ------- |
| anónimo       | solo lo publicado (y sus hijos)       | solo `analytics_events` (insert, eventos de una lista cerrada) |
| `verifier`    | todo                                  | nada directo; usa `verify_entity()` |
| `editor`      | todo                                  | contenido y traducciones, **solo como borrador** |
| `admin`       | todo                                  | todo (publica, archiva, gestiona catálogos y personal) |
| `org_manager` | —                                     | Fase 7 |

Un usuario sin perfil, o con perfil `active = false`, solo ve lo publicado.

## Reglas editoriales en la base de datos

- Solo un `admin` publica o archiva; un editor no puede (`guard_editorial_fields`).
- La verificación se cambia **solo** con `verify_entity(entidad, id, estado, notas, evidencia)`: exige `admin` o `verifier`, fija `last_verified_at` y escribe `verification_logs`.
- No se publica sin traducción en español (`require_spanish_to_publish`).
- Si cambia el texto en español, las traducciones inglesas pasan a `needs_review` (`flag_translations_for_review`).
- Toda modificación editorial queda en `audit_log` con el diff (solo lectura para el personal).
- Servicio/seed (sin sesión de usuario) no está sujeto a los guardas.

## Visitantes

Sin cuentas. Los itinerarios se crean desde el servidor (service role) y se leen
con `get_itinerary_by_token(token)` (token de ~244 bits, vence a los 90 días,
omite lugares no publicados). La tabla `itineraries` no es accesible por API.
No se guarda la ubicación precisa del visitante.

## Storage

Bucket `place-images`: público para leer, 5 MB máx., `jpeg/png/webp`; solo `admin`/`editor` suben o borran.

## Pruebas

`pnpm test:db` aplica las 15 migraciones y el seed (dos veces, para comprobar
que es repetible) sobre un Postgres desechable y corre `tests/db/rls.test.sql`
(permisos por rol, reglas editoriales, auditoría, itinerarios por token,
analítica). `tests/db/supabase_shim.sql` simula `auth`/`storage` y los roles de
Supabase; **no** se usa en Supabase real.

## Cambios respecto del plan original

- Sin PostGIS (ver arriba).
- Se omitió `translated_from_version`: el estado `needs_review` automático cubre ese caso.
- `place_images` guarda `storage_path` (no URL completa).
