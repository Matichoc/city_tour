# Plan — City Tour Papudo

Plataforma web/móvil (PWA) para que la **Municipalidad de Papudo** administre
su ecosistema turístico (alojamientos, gastronomía, Cámara de Comercio,
actividades, eventos) y que visitantes y residentes lo descubran.

Base de partida: <https://github.com/Matichoc/directorio_turistico>
(provincia de Petorca). Este repo **acota todo a la comuna de Papudo** y
cambia el foco: de "guía para el visitante" a **herramienta de gestión
municipal + guía pública**.

> Estado: **plan para aprobación**. No se implementa nada hasta aprobar las
> decisiones de la sección 2 (o aceptar los valores por defecto).

---

## 1. Qué reutilizamos y qué cambia

| Del repo base                                                | Qué hacemos                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| Next.js 16 + TS + Tailwind 4 + next-intl (es/en) + Serwist   | Se mantiene tal cual (español primero, inglés opcional).          |
| Supabase (Postgres + Auth + RLS) + migraciones `0001–0023`   | **No se copian las 23**: se reescribe un esquema limpio (sec. 5). |
| `lib/itinerary-engine` (TS puro, determinista, con tests)    | Se copia casi sin cambios; se adapta a un solo municipio.         |
| MapLibre + react-map-gl                                      | Se mantiene; centro del mapa fijo en Papudo.                      |
| Panel `/admin` (lugares, rutas, verificación, métricas)      | Se amplía a **panel municipal multi-rol** (sec. 6).               |
| Skill `pre-push`, `CLAUDE.md`, `AGENTS.md`, CI de GitHub     | Se copian y se adaptan (sec. 4).                                  |
| Likes/comentarios/auspiciadores con sesión anónima           | **Fuera del MVP** (reabrir después, con moderación).              |
| Datos de las 5 comunas de Petorca, vuelo 3D de provincia     | **Se descartan**. Solo Papudo.                                    |

Lo nuevo respecto del repo base:

1. **Organizaciones y negocios** como entidad propia (alojamiento, restaurante, comercio, Cámara de Comercio, operador turístico), no solo "lugares".
2. **Roles municipales** (admin municipal, editor, verificador, y más adelante representante de negocio).
3. **Eventos y cartelera** (fiestas, ferias, temporada).
4. **Bitácora de auditoría** de todo cambio editorial.
5. **Reportes para la municipalidad** (catastro, cobertura, desactualizados, uso).
6. Modelo pensado para que otro municipio pueda replicarlo después (campo `municipality_id` o instancia separada; ver decisión D1).

---

## 2. Decisiones a confirmar (con valor por defecto)

| #   | Decisión                                       | Por defecto propuesto                                                                                                         |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| D1  | ¿Multi-municipio o solo Papudo?                | **Solo Papudo**, pero con tabla `municipality` de una fila y sin `commune_id` repetido en cada tabla. Replicar = nuevo deploy. |
| D2  | ¿Los negocios editan su propia ficha?          | **No en el MVP.** Solo personal municipal. El modelo ya deja `organization_members` listo para Fase 5.                        |
| D3  | Nombre/marca y dominio                         | Provisional "Papudo en Ruta". Confirmar con la municipalidad.                                                                 |
| D4  | Alcance geográfico                             | Papudo + localidades de la comuna **confirmadas con fuente** (no inventar).                                                   |
| D5  | Cámara de Comercio                             | Es una `organization` de tipo `chamber` con socios (negocios) vinculados.                                                     |
| D6  | Proveedor de mapas                             | Estilo MapLibre por variable de entorno; elegir proveedor comercial antes de producción.                                      |
| D7  | IA                                             | **Fuera del MVP.** Interfaz de proveedor lista; traducciones IA siempre como borrador (ver sec. 8).                           |
| D8  | Idiomas                                        | `es` obligatorio, `en` opcional (tablas `*_translations`, fallback a español).                                                |

---

## 3. Arquitectura

```
Navegador (PWA, mobile-first)
   │
   ├─ /es, /en           interfaz pública (guía, mapa, rutas, eventos, itinerario)
   ├─ /admin             panel municipal (roles: admin / editor / verificador)
   └─ /api               analítica anónima, directions, salud
         │
   Next.js 16 (App Router, server actions + zod)
         │
   lib/data (lectura, RLS)   lib/server/content (escritura, roles)
   lib/itinerary-engine (puro)   lib/maps   lib/analytics   lib/ai (opcional, apagable)
         │
   Supabase: Postgres + PostGIS + Auth + Storage + RLS
```

Principios heredados: lectura pública solo de lo publicado, escritura por
rol vía RLS (no solo middleware), motor de itinerarios sin dependencias de UI,
nada inventado (todo dato con fuente y fecha de verificación), IA nunca
publica sola.

### Estructura de carpetas objetivo

```
city_tour/
├── .claude/
│   ├── skills/            ← ver sección 4
│   └── settings.json
├── .github/workflows/ci.yml
├── docs/
│   ├── PLAN.md  ARCHITECTURE.md  DATA-MODEL.md  DESIGN.md  CONTENT-POLICY.md  OPERATIONS.md
├── supabase/
│   ├── migrations/        esquema versionado
│   ├── seed/              datos reales de Papudo (con fuente) + demo marcado
│   └── tests/             pruebas SQL de RLS (pgTAP)
├── scripts/               seed, import CSV, backups, reportes
├── src/
│   ├── app/[locale]/…     público
│   ├── app/admin/…        panel
│   ├── components/ lib/ i18n/ messages/{es,en}.json types/
└── tests/{unit,integration,e2e}
```

---

## 4. Skills y agentes (organización del trabajo con Claude Code)

Archivos en `.claude/skills/<nombre>/SKILL.md`, cada uno corto y específico.
`CLAUDE.md` indica: **responder siempre en español**, leer `docs/PLAN.md`,
una fase a la vez.

| Skill                 | Para qué                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `pre-push`            | Gate: typecheck → lint → test → build → format (copiar del repo base).                                |
| `db-migration`        | Cómo crear una migración: nombre, RLS obligatoria, índices, actualizar `DATA-MODEL.md`, regenerar tipos, test de RLS. |
| `rls-review`          | Checklist: toda tabla nueva con RLS activada, política de lectura pública solo `published`, escritura por rol, sin `security definer` sin justificar. |
| `content-policy`      | Reglas de contenido: no inventar datos, fuente + fecha obligatorias, estados editoriales, cómo marcar demo. |
| `i18n-workflow`       | Agregar textos a `es.json` primero, luego `en.json`; marcar `needs_review`; prohibido texto fijo en componentes. |
| `seed-papudo`         | Cargar datos reales de Papudo desde CSV con columnas de fuente; validar duplicados/coordenadas.       |
| `admin-crud`          | Patrón de pantalla admin: lista + filtros + formulario + zod + server action + bitácora de auditoría. |
| `itinerary-engine`    | Reglas del motor: puro, determinista, tests antes de cambiar puntuación.                              |
| `a11y-mobile-review`  | WCAG AA, targets táctiles, navegación inferior, contraste (apoyarse en el skill `design:accessibility-review`). |

Agentes sugeridos (solo cuando una tarea lo justifique, no por defecto):
`Plan` para diseñar cada fase antes de codear; `Explore` para auditar el repo base;
revisión con `code-review` / `security-review` al cerrar fases 2 y 4 (RLS y roles).

MCP recomendados (`.mcp.json`): `context7` (docs actualizadas de Next/Supabase),
`playwright` (e2e), `supabase` en **solo lectura** y con proyecto de desarrollo.
Nunca claves de producción en el entorno del agente.

---

## 5. Modelo de datos (nuevo)

Convenciones: `uuid` PK, `created_at/updated_at`, `slug` único, estados como
enums, traducciones en tablas `*_translations` (PK `(entity_id, locale)`),
RLS en **todas** las tablas.

Enums: `locale(es,en)`, `publication_status(draft,published,archived)`,
`verification_status(pending,verified,outdated)`,
`translation_status(missing,draft,needs_review,reviewed)`,
`org_type(municipality,chamber,business,operator,association,public_service)`,
`app_role(admin,editor,verifier,org_manager)`.

### 5.1 Núcleo geográfico

- `municipality` (1 fila: Papudo): `name, slug, latitude, longitude, bbox, timezone('America/Santiago'), logo, contact_email`.
- `localities`: `slug, latitude?, longitude?, geog` (generada). Coordenadas **opcionales** hasta verificarlas.
- `locality_translations`.
- `categories` (+ `category_translations`): `parent_id` para subcategorías (Alojamiento → Hotel / Cabaña / Camping / Hostal).
- `tags` (+ `tag_translations`): características (apto niños, mascotas, accesible…).

### 5.2 Organizaciones, negocios y lugares

Separar **quién** (organización) de **dónde** (lugar):

- `organizations`: `type org_type, legal_name, rut?, slug, phone, email, website, instagram, facebook, publication_status, verification_status, last_verified_at`.
- `organization_translations`: `name, short_description, full_description`.
- `organization_members`: `organization_id, user_id, role` ← vacía en el MVP (D2).
- `chamber_memberships`: `chamber_id → organizations, member_id → organizations, since, status` (socios de la Cámara de Comercio).
- `places`: `organization_id?`, `locality_id?`, `category_id`, `slug, latitude, longitude, geog, address, price_level, estimated_visit_minutes, difficulty, parking, bathrooms, accessibility, child_friendly, pet_friendly, reservation_required, indoor_or_outdoor, mobile_coverage_notes, publication_status, verification_status, last_verified_at, status_changed_at`.
  Un alojamiento/restaurante = place con `organization_id`; una playa o mirador = place sin organización.
- `place_translations` (`name, short_description, full_description, recommendations, safety_notes, translation_status, translated_from_version, reviewed_by, reviewed_at`).
- `place_hours` (por día, con `valid_from/valid_until` para temporada), `place_images` (`alt_text`, `credit`, `position`), `place_tags`.
- `lodging_details` (1:1 con `places`, solo alojamientos): `lodging_type, rooms, capacity, sernatur_registered, sernatur_code?, checkin_time, checkout_time, amenities jsonb`.
- `dining_details` (1:1, restaurantes): `cuisine_types[], serves_vegetarian, takes_reservations, price_range`.

> `lodging_details`/`dining_details` evitan decenas de columnas nulas en `places` y
> permiten reportes municipales por tipo (registro Sernatur, capacidad total de camas).

### 5.3 Contenido turístico

- `routes`, `route_translations`, `route_stops`, `route_stop_translations` (igual que el repo base).
- `events`: `slug, starts_at, ends_at, place_id?, organization_id?, free_entry, publication_status` + `event_translations(name, description)`. Los vencidos se ocultan por consulta (`ends_at >= now()`), no se borran.
- `sources`: `entity_type, entity_id, title, url, organization, published_date, accessed_at, notes` (genérica; validar existencia en la capa de app o con FKs nullable + `check` de exclusividad — **decisión: usar FKs nullable** para tener integridad referencial).
- `contact_links` (tipo + valor) para redes y contactos adicionales.

### 5.4 Gobernanza y auditoría

- `profiles`: `user_id → auth.users, full_name, role app_role, active`.
- `verification_logs`: `entity_type, entity_id, verified_by, previous_status, new_status, evidence_url, notes, created_at`.
- `audit_log`: `table_name, row_id, action, changed_by, diff jsonb, created_at` (trigger genérico en tablas editoriales).
- `verification_tasks`: `entity, reason, proposed_change jsonb, proposed_by(agent|user), status(open|approved|rejected), resolved_by` ← cola para futuros verificadores automáticos (nunca publican).

### 5.5 Visitantes y analítica

- `itineraries` + `itinerary_stops` (token público, sin cuenta; sin ubicación precisa persistente).
- `analytics_events` (insert anónimo, lectura solo staff; lista cerrada de eventos validada con zod) + funciones `analytics_top` / `analytics_totals`.
- Vista `v_municipal_report_*`: catastro por categoría, % verificado, registros sin verificar > N días, eventos próximos, top lugares.

### 5.6 Políticas RLS (resumen)

| Rol           | Lectura                          | Escritura                                                      |
| ------------- | -------------------------------- | -------------------------------------------------------------- |
| anónimo       | solo `published` (+ traducciones, horarios, fotos) | `analytics_events` insert; itinerarios propios        |
| `verifier`    | todo                             | `verification_*`, cambia `verification_status`/`last_verified_at` |
| `editor`      | todo                             | contenido y traducciones; **no** publica ni archiva            |
| `admin`       | todo                             | todo, incluye publicar, usuarios y catálogos                   |
| `org_manager` | (Fase 5) su organización         | (Fase 5) solo filas de su organización, como borrador          |

Helpers: `public.current_role()`, `public.has_role(...)`; las políticas usan
estos, no listas de UUID.

### 5.7 Pasos para crear la base (orden de migraciones)

1. `0001_extensions` — `postgis`, `pg_trgm`, `unaccent`, `pgcrypto`.
2. `0002_enums_and_helpers` — enums, `touch_updated_at()`, `touch_status_changed_at()`.
3. `0003_municipality_geo` — `municipality`, `localities` (+traducciones), índice GiST.
4. `0004_catalog` — `categories`, `tags` y traducciones.
5. `0005_identity` — `profiles`, `current_role()`, `has_role()`; trigger de alta de perfil.
6. `0006_organizations` — `organizations`, traducciones, `chamber_memberships`, `organization_members`.
7. `0007_places` — `places`, traducciones, horas, imágenes, tags, `lodging_details`, `dining_details`; índices trigram y GiST.
8. `0008_routes` — rutas, paradas y traducciones.
9. `0009_events` — eventos y traducciones.
10. `0010_verification` — `sources`, `verification_logs`, `verification_tasks`.
11. `0011_audit` — `audit_log` + trigger genérico en tablas editoriales.
12. `0012_visitors` — `itineraries`, `itinerary_stops`, `analytics_events`, funciones de resumen.
13. `0013_rls` — habilitar RLS y políticas de 5.6 (con pruebas pgTAP).
14. `0014_storage` — buckets `papudo-place-images` (público, 5 MB, jpeg/png/webp) y `audio` (futuro).
15. `0015_reports` — vistas de reporte municipal.

Después de cada migración: `supabase db reset` local → tests SQL de RLS →
actualizar `docs/DATA-MODEL.md` → regenerar tipos (`supabase gen types typescript`).

---

## 6. Panel municipal

| Módulo               | Quién                        | Qué hace                                                              |
| -------------------- | ---------------------------- | --------------------------------------------------------------------- |
| Tablero              | todos                        | Pendientes de verificar, vencidos, borradores, próximos eventos.      |
| Organizaciones       | editor, admin                | Alojamientos, restaurantes, comercios, Cámara (socios), operadores.   |
| Lugares              | editor, admin                | CRUD con horarios, fotos, accesibilidad, fuentes.                     |
| Rutas                | editor, admin                | CRUD y ordenar paradas.                                               |
| Eventos              | editor, admin                | Cartelera; vencimiento automático.                                    |
| Verificación         | verificador, admin           | Cola de pendientes/vencidos, cambio de estado con evidencia.          |
| Traducciones         | editor, admin                | Estados `solo español / pendiente / borrador / requiere revisión / revisada`. |
| Catálogos            | admin                        | Localidades, categorías, tags.                                        |
| Usuarios y roles     | admin                        | Alta/baja de personal municipal.                                      |
| Reportes             | admin                        | Catastro, cobertura, desactualizados, uso; exportar CSV.              |
| Importador CSV       | editor, admin                | Plantilla con fuente y fecha por fila; vista previa antes de aplicar. |

Estados editoriales: `draft → pendiente de verificación → verificado → publicado → desactualizado`
(publicación y verificación son ejes separados, como en el repo base).

---

## 7. Mapa de trabajo por fases

Una fase a la vez; cada una termina con `pre-push` en verde y README al día.

### Fase 0 — Base del repo (1–2 días)
- [ ] Traer del repo base: config (TS, ESLint, Prettier, Vitest, Playwright), CI, `CLAUDE.md`, `AGENTS.md`, skills.
- [ ] Crear app Next.js 16 vacía + next-intl + Tailwind; `/` → `/es`.
- [ ] `.env.example`, `.gitignore` (sin claves), `docs/ARCHITECTURE.md`.
- [ ] Crear los skills de la sección 4.
- [ ] Proyecto Supabase de desarrollo + CLI local.
- **Hecho cuando:** `pnpm dev` abre `/es` y el CI pasa.

### Fase 1 — Base de datos y seguridad (3–4 días)
- [ ] Migraciones 0001–0015 (sec. 5.7).
- [ ] Pruebas pgTAP de RLS (anónimo no ve borradores; editor no publica; etc.).
- [ ] Seed: municipio Papudo, categorías, tags, usuario admin de desarrollo.
- [ ] Tipos generados + `docs/DATA-MODEL.md`.
- **Hecho cuando:** `supabase db reset` + tests SQL pasan.

### Fase 2 — Panel municipal (1–1,5 semanas)
- [ ] Login, perfiles y roles; middleware + RLS.
- [ ] CRUD: organizaciones, lugares (con detalle alojamiento/gastronomía), localidades/categorías.
- [ ] Subida de fotos con validación (tipo/tamaño) y `alt_text` obligatorio.
- [ ] Fuentes, verificación y bitácora de auditoría.
- [ ] Traducciones y sus estados.
- [ ] Importador CSV.
- **Hecho cuando:** personal municipal crea y publica una ficha completa sin tocar SQL.

### Fase 3 — Carga de contenido real de Papudo (continua, en paralelo a F2)
- [ ] Plantilla CSV + guía de levantamiento con la municipalidad y la Cámara de Comercio.
- [ ] 25–30 lugares/negocios reales con fuente y fecha; los dudosos quedan `pending`.
- [ ] Fotografías con crédito.
- **Hecho cuando:** ≥25 fichas publicadas y ≥1 ruta completa.

### Fase 4 — Sitio público (1,5–2 semanas)
- [ ] Portada, explorador (mapa/lista, filtros, búsqueda), ficha de lugar y de organización.
- [ ] Alojamientos y gastronomía con filtros específicos.
- [ ] Rutas y mapa con paradas; eventos / "qué hacer este fin de semana".
- [ ] Estados de carga/error/vacío; SEO, hreflang, sitemap, OG.
- **Hecho cuando:** criterios de aceptación de la sección 9 (visitante).

### Fase 5 — Itinerario, PWA y offline (1 semana)
- [ ] Adaptar `itinerary-engine` (un municipio, reglas de horarios/temporada).
- [ ] Itinerario compartible por token.
- [ ] Manifest, service worker, ruta guardada offline (idioma activo + respaldo español).
- **Hecho cuando:** se genera, edita, comparte y guarda offline un itinerario en Android.

### Fase 6 — Reportes, analítica y piloto (1 semana)
- [ ] Eventos anónimos y panel de métricas; reportes municipales (CSV).
- [ ] Accesibilidad AA, rendimiento, monitoreo de errores, backups documentados (`docs/OPERATIONS.md`).
- [ ] Piloto con municipalidad y Cámara; QR en 3 puntos.

### Fase 7 — Posterior (no se construye ahora)
Portal por negocio (`org_manager`), verificador automático en modo solo lectura
(propone en `verification_tasks`, nunca publica), audio-guía, chatbot,
reservas/pagos, otros municipios.

---

## 8. Reglas de contenido, IA y costos

Tomadas del radar semanal:

1. **Horarios, distancias, selección de lugares y orden del recorrido = código y base de datos.** Cero LLM.
2. La IA (si se activa) solo **traduce, resume y redacta** desde datos verificados; sus resultados se guardan como `draft`/`needs_review`.
3. Interfaz interna de proveedor/modelo + registro de costo y latencia por tarea; **presupuesto diario/mensual y apagado global** sin romper la guía.
4. Máximo una corrección automática antes de revisión humana.
5. Identidades separadas: `content_reader` (lectura), `verification_agent` (solo escribe en `verification_tasks`), editores humanos, publicador. **Nunca una sola clave de servicio compartida.**
6. Ningún agente de desarrollo recibe claves de producción.
7. Evaluar con ~20–50 casos propios antes de elegir modelo por tarea.

Contenido: no inventar establecimientos, horarios, precios ni historia; datos demo
marcados como ficticios; sin scraping indiscriminado ni copiar textos con derechos.

---

## 9. Criterios de aceptación del MVP

**Visitante:** abre la app en el teléfono sin cuenta; explora en mapa y lista; filtra por categoría/características; ve ficha completa con fecha de verificación; consulta ≥3 rutas y eventos; arma y comparte un itinerario; guarda una ruta offline; abre navegación; cambia ES/EN sin perder la página.

**Municipalidad:** inicia sesión por rol; crea/edita organizaciones y lugares; sube fotos; registra fuentes; verifica; publica/archiva; ve desactualizados; revisa traducciones; descarga reportes; todo cambio queda en la bitácora.

---

## 10. Riesgos principales

| Riesgo                                              | Mitigación                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| Datos desactualizados                               | Estado `desactualizado` automático por antigüedad + tablero.           |
| Poca capacidad municipal para mantener contenido    | Flujo simple, importador CSV, roles; medir minutos por verificación.   |
| Fuga de borradores / permisos mal puestos           | RLS por rol + pruebas pgTAP + `rls-review` en cada migración.          |
| Costo de mapas/fotos (Google Places)                | Proveedor desacoplado; fotos propias; límites de cuota.                |
| Alcance que crece (reservas, pagos, chatbot)        | Sección 7 / Fase 7 como lista cerrada "fuera del MVP".                 |
| Accesibilidad mal descrita                          | Campos estructurados + verificación humana en terreno.                 |
| Dependencia de una sola persona                     | Documentar operación y backups en `docs/OPERATIONS.md`.                |

---

## 11. Flujo de ramas y pruebas

| Rama                 | Para qué                                                       | Reglas |
| -------------------- | -------------------------------------------------------------- | ------ |
| `main`               | Producción. Solo recibe merges desde `develop`.                | Protegida; CI verde; despliegue a producción |
| `develop`            | Integración y pruebas (staging).                               | Protegida; CI verde; despliegue de previsualización |
| `claude/...`, `feat/...` | Trabajo diario, una por tarea/fase.                        | PR hacia `develop`; `pre-push` en verde |

Flujo: rama de trabajo → PR a `develop` (CI + pruebas + revisión) → pruebas en
staging (proyecto Supabase de desarrollo) → PR `develop` → `main` al cerrar una
fase. Dos proyectos Supabase separados (dev y prod); migraciones se aplican
primero en dev. Pendiente: activar protección de ramas en GitHub (Settings →
Branches).

## 12. Experiencia actual del sitio municipal (auditoría pendiente)

El sitio de la Municipalidad de Papudo **no se pudo abrir desde este entorno**
(el DNS/proxy bloquea el dominio) y no se recibió la URL exacta. Para auditarlo:
pegar la URL o capturas de pantalla. Criterios que se evaluarán:

1. Claridad: ¿se entiende en 5 s qué hacer, ver y dónde dormir/comer?
2. Móvil: ¿se usa con una mano, carga rápido con señal débil?
3. Información turística separada de trámites y noticias.
4. Fechas de actualización, horarios y contactos visibles.
5. Mapa, filtros y búsqueda.
6. Accesibilidad (contraste, tamaño de letra, textos alternativos).
7. Idiomas.
8. Compartir y navegación por GPS.

Resultado esperado: `docs/AUDITORIA-UX.md` con hallazgos y una maqueta simple
"antes / después" para mostrar a la municipalidad.

## 13. Financiamiento y herramientas

Ver [`docs/FINANCIAMIENTO.md`](./FINANCIAMIENTO.md): dimensionamiento (500.000
turistas, meta 10 %), herramientas reales, presupuesto, fuentes de
financiamiento y escenarios de ingreso.

## 14. Próximo paso

Aprobar (o ajustar) la sección 2 y arrancar **Fase 0**. Primer comando de trabajo:

> "Ejecuta la Fase 0 de `docs/PLAN.md`: traer config y skills del repo base, crear el esqueleto Next.js 16 con next-intl, y correr `pre-push`."
