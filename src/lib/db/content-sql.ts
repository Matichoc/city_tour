/**
 * Convierte el contenido del repo en SQL para cargarlo en Supabase
 * (supabase/content.sql). Se puede ejecutar varias veces: actualiza por slug,
 * reemplaza traducciones, fuentes y paradas, y nunca borra fichas.
 * Todo entra `pending` (sin verificar en terreno) y publicado.
 */
import type { SiteContent } from "@/content";
import type { Source } from "@/content/types";

type Value = string | number | boolean | null | undefined;

const lit = (v: Value): string =>
  v === null || v === undefined
    ? "null"
    : typeof v === "string"
      ? `'${v.replace(/'/g, "''")}'`
      : String(v);

const rows = (values: Value[][]): string =>
  values.map((r) => `  (${r.map(lit).join(", ")})`).join(",\n");

const slugList = (slugs: string[]) => slugs.map(lit).join(", ");

/** es sin estado; el resto queda en borrador hasta que una persona lo revise. */
const status = (locale: string) => (locale === "es" ? null : "draft");

const sourcesOf = (s: (Source | undefined)[]) =>
  s.filter((x): x is Source => Boolean(x));

export function contentToSql(content: SiteContent): string {
  const { localities, places, events, routes } = content;
  const out: string[] = [];
  const add = (s: string) => out.push(s.trim() + "\n");

  add(`
-- GENERADO desde src/content con \`pnpm db:content\`. No editar a mano.
-- Carga en Supabase el contenido que hoy muestra el sitio. Requiere las
-- migraciones hasta 0023 y supabase/seed.sql. Se puede ejecutar varias veces.
-- El repo manda sobre sus fichas, salvo las que se crearon o editaron en el
-- panel (managed_in_panel): esas no se tocan.
begin;
`);

  // ── Localidades ────────────────────────────────────────────────────────
  const locSlugs = slugList(localities.map((l) => l.slug));
  add(`
-- Localidades
insert into public.localities (slug, latitude, longitude, sort_order, source_url, source_label) values
${rows(localities.map((l, i) => [l.slug, l.latitude, l.longitude, i + 1, l.sourceUrl, l.sourceLabel]))}
on conflict (slug) do update set
  latitude = excluded.latitude, longitude = excluded.longitude, sort_order = excluded.sort_order,
  source_url = excluded.source_url, source_label = excluded.source_label;

delete from public.locality_translations
  where locality_id in (select id from public.localities where slug in (${locSlugs}));
insert into public.locality_translations (locality_id, locale, name, summary, translation_status)
select l.id, v.locale::public.locale, v.name, v.summary, v.status::public.translation_status
from (values
${rows(
  localities.flatMap((l) =>
    [
      ["es", l.es, l.summary],
      ["en", l.en, l.summaryEn],
    ].map(([loc, name, summary]) => [
      l.slug,
      loc,
      name,
      summary ?? null,
      status(loc!),
    ]),
  ),
)}
) as v(slug, locale, name, summary, status)
join public.localities l on l.slug = v.slug;
`);

  // ── Lugares ────────────────────────────────────────────────────────────
  const placeSlugs = slugList(places.map((p) => p.slug));
  add(`
-- Lugares (se crean en borrador y se publican al final, con su ficha en español)
insert into public.places (slug, sort_order, category_id, locality_id, latitude, longitude, address, is_demo, is_business, instagram, maps_url, sernatur_number, sernatur_valid_until)
select v.slug, v.sort_order, c.id, l.id, v.lat::numeric, v.lng::numeric, v.address, v.is_demo, v.is_business, v.instagram, v.maps_url, v.sernatur, v.sernatur_until::date
from (values
${rows(places.map((p, i) => [p.slug, i + 1, p.categorySlug, p.localitySlug, p.latitude, p.longitude, p.address, p.demo === true, p.business === true, p.instagram, p.mapsUrl, p.sernatur?.number, p.sernatur?.validUntil]))}
) as v(slug, sort_order, category, locality, lat, lng, address, is_demo, is_business, instagram, maps_url, sernatur, sernatur_until)
join public.categories c on c.slug = v.category
left join public.localities l on l.slug = v.locality
on conflict (slug) do update set
  sort_order = excluded.sort_order, category_id = excluded.category_id, locality_id = excluded.locality_id,
  latitude = excluded.latitude, longitude = excluded.longitude, address = excluded.address,
  is_demo = excluded.is_demo, is_business = excluded.is_business,
  instagram = excluded.instagram, maps_url = excluded.maps_url,
  sernatur_number = excluded.sernatur_number, sernatur_valid_until = excluded.sernatur_valid_until
where not public.places.managed_in_panel;

delete from public.place_translations
  where place_id in (select id from public.places where slug in (${placeSlugs}) and not managed_in_panel);
insert into public.place_translations (place_id, locale, name, short_description, full_description, translation_status)
select p.id, v.locale::public.locale, v.name, v.short, v.description, v.status::public.translation_status
from (values
${rows(
  places.flatMap((p) =>
    (["es", "en", "pt"] as const).flatMap((loc) => {
      const t = p[loc];
      return t
        ? [[p.slug, loc, t.name, t.short, t.description, status(loc)]]
        : [];
    }),
  ),
)}
) as v(slug, locale, name, short, description, status)
join public.places p on p.slug = v.slug and not p.managed_in_panel;

delete from public.sources
  where place_id in (select id from public.places where slug in (${placeSlugs}) and not managed_in_panel);
insert into public.sources (place_id, sort_order, title, url)
select p.id, v.sort_order, v.title, v.url
from (values
${rows(
  places.flatMap((p) =>
    sourcesOf([p.source, p.tvSource, ...(p.extraSources ?? [])]).map((s, i) => [
      p.slug,
      i,
      s.label,
      s.url,
    ]),
  ),
)}
) as v(slug, sort_order, title, url)
join public.places p on p.slug = v.slug and not p.managed_in_panel;
`);

  // Horarios por temporada (una fila por día) y datos que entregó el comercio.
  // El botón de acción y la fecha de actualización se cargan solo si están
  // vacíos: después se editan en el panel y el repo no los pisa.
  const hourRows = places.flatMap((p) =>
    (p.hours ?? []).flatMap((h) =>
      h.days.map((d) => [
        p.slug,
        d,
        h.opens,
        h.closes,
        h.fromMonth,
        h.toMonth,
        h.holidays === true,
      ]),
    ),
  );
  const owned = places.filter((p) => p.cta || p.infoUpdatedAt);
  // Imágenes del repo (rutas que empiezan con «/»); las que se suban al
  // bucket desde el panel no se tocan.
  const imageRows = places.flatMap((p) => [
    ...(p.logo
      ? [
          [
            p.slug,
            p.logo.src,
            "logo",
            p.logo.width,
            p.logo.height,
            `Logo de ${p.es.name}`,
            `${p.es.name} logo`,
            `Logo de ${p.es.name}`,
            p.es.name,
            0,
          ],
        ]
      : []),
    ...(p.gallery ?? []).map((g, i) => [
      p.slug,
      g.src,
      g.kind,
      g.width,
      g.height,
      g.alt.es,
      g.alt.en,
      g.alt.pt,
      g.credit,
      i + 1,
    ]),
  ]);
  add(`
delete from public.place_hours
  where place_id in (select id from public.places where slug in (${placeSlugs}) and not managed_in_panel);
${
  hourRows.length === 0
    ? ""
    : `insert into public.place_hours (place_id, day_of_week, opens_at, closes_at, from_month, to_month, holidays)
select p.id, v.day::smallint, v.opens::time, v.closes::time, v.from_month::smallint, v.to_month::smallint, v.holidays
from (values
${rows(hourRows)}
) as v(slug, day, opens, closes, from_month, to_month, holidays)
join public.places p on p.slug = v.slug and not p.managed_in_panel;`
}
delete from public.place_images
  where storage_path like '/%'
    and place_id in (select id from public.places where slug in (${placeSlugs}) and not managed_in_panel);
${
  imageRows.length === 0
    ? ""
    : `insert into public.place_images (place_id, storage_path, kind, width, height, alt_text, alt_text_en, alt_text_pt, credit, position)
select p.id, v.path, v.kind, v.width::integer, v.height::integer, v.alt, v.alt_en, v.alt_pt, v.credit, v.position::integer
from (values
${rows(imageRows)}
) as v(slug, path, kind, width, height, alt, alt_en, alt_pt, credit, position)
join public.places p on p.slug = v.slug and not p.managed_in_panel;`
}
${
  owned.length === 0
    ? ""
    : `update public.places p set
  cta_kind = coalesce(p.cta_kind, v.cta_kind), cta_value = coalesce(p.cta_value, v.cta_value),
  info_updated_at = coalesce(p.info_updated_at, v.info_updated_at::timestamptz)
from (values
${rows(owned.map((p) => [p.slug, p.cta?.kind, p.cta?.value, p.infoUpdatedAt]))}
) as v(slug, cta_kind, cta_value, info_updated_at)
where p.slug = v.slug and not p.managed_in_panel and (p.cta_kind is null or p.info_updated_at is null);`
}
`);

  // ── Eventos ────────────────────────────────────────────────────────────
  const eventSlugs = slugList(events.map((e) => e.slug));
  add(`
-- Eventos recurrentes
insert into public.events (slug, sort_order, category_id, locality_id, recurrence_month, recurrence_day, season, featured, is_demo, illustration)
select v.slug, v.sort_order, c.id, l.id, v.month::smallint, v.day::smallint, v.season, v.featured, v.is_demo, v.illustration
from (values
${rows(events.map((e, i) => [e.slug, i + 1, e.categorySlug, e.localitySlug, e.month, e.day, e.season, e.featured === true, e.demo === true, e.illustration]))}
) as v(slug, sort_order, category, locality, month, day, season, featured, is_demo, illustration)
join public.categories c on c.slug = v.category
left join public.localities l on l.slug = v.locality
on conflict (slug) do update set
  sort_order = excluded.sort_order, category_id = excluded.category_id, locality_id = excluded.locality_id,
  recurrence_month = excluded.recurrence_month, recurrence_day = excluded.recurrence_day,
  season = excluded.season, featured = excluded.featured, is_demo = excluded.is_demo,
  illustration = excluded.illustration;

delete from public.event_translations
  where event_id in (select id from public.events where slug in (${eventSlugs}));
insert into public.event_translations (event_id, locale, name, description, translation_status)
select e.id, v.locale::public.locale, v.name, v.description, v.status::public.translation_status
from (values
${rows(
  events.flatMap((e) =>
    (["es", "en", "pt"] as const).flatMap((loc) => {
      const t = e[loc];
      return t ? [[e.slug, loc, t.name, t.short, status(loc)]] : [];
    }),
  ),
)}
) as v(slug, locale, name, description, status)
join public.events e on e.slug = v.slug;

delete from public.sources
  where event_id in (select id from public.events where slug in (${eventSlugs}));
${(() => {
  const r = events.flatMap((e) =>
    sourcesOf([e.source, ...(e.extraSources ?? [])]).map((s, i) => [
      e.slug,
      i,
      s.label,
      s.url,
    ]),
  );
  return r.length === 0
    ? ""
    : `insert into public.sources (event_id, sort_order, title, url)
select e.id, v.sort_order, v.title, v.url
from (values
${rows(r)}
) as v(slug, sort_order, title, url)
join public.events e on e.slug = v.slug;`;
})()}
`);

  // ── Rutas ──────────────────────────────────────────────────────────────
  const routeSlugs = slugList(routes.map((r) => r.slug));
  const stops = routes.flatMap((r) =>
    r.stops.map((s, i) => ({ route: r.slug, position: i, ...s })),
  );
  add(`
-- Rutas y sus paradas
insert into public.routes (slug, sort_order, duration_minutes, cover_image_path) values
${rows(routes.map((r, i) => [r.slug, i + 1, r.durationMinutes, r.cover?.src]))}
on conflict (slug) do update set
  sort_order = excluded.sort_order, duration_minutes = excluded.duration_minutes, cover_image_path = excluded.cover_image_path;

delete from public.route_translations
  where route_id in (select id from public.routes where slug in (${routeSlugs}));
insert into public.route_translations (route_id, locale, name, short_description, cover_alt, translation_status)
select r.id, v.locale::public.locale, v.name, v.description, v.cover_alt, v.status::public.translation_status
from (values
${rows(
  routes.flatMap((r) =>
    (["es", "en"] as const).flatMap((loc) => {
      const t = r[loc];
      return t
        ? [[r.slug, loc, t.name, t.description, r.cover?.alt[loc], status(loc)]]
        : [];
    }),
  ),
)}
) as v(slug, locale, name, description, cover_alt, status)
join public.routes r on r.slug = v.slug;

delete from public.route_stops
  where route_id in (select id from public.routes where slug in (${routeSlugs}));
insert into public.route_stops (route_id, place_id, position)
select r.id, p.id, v.position
from (values
${rows(stops.map((s) => [s.route, s.position, s.slug]))}
) as v(route, position, place)
join public.routes r on r.slug = v.route
join public.places p on p.slug = v.place;
${(() => {
  const r = stops.flatMap((s) =>
    s.notes
      ? (["es", "en"] as const).flatMap((loc) =>
          s.notes![loc]
            ? [[s.route, s.position, loc, s.notes![loc], status(loc)]]
            : [],
        )
      : [],
  );
  return r.length === 0
    ? ""
    : `insert into public.route_stop_translations (route_stop_id, locale, narrative, translation_status)
select s.id, v.locale::public.locale, v.narrative, v.status::public.translation_status
from (values
${rows(r)}
) as v(route, position, locale, narrative, status)
join public.routes r on r.slug = v.route
join public.route_stops s on s.route_id = r.id and s.position = v.position;`;
})()}

delete from public.sources
  where route_id in (select id from public.routes where slug in (${routeSlugs}));
${(() => {
  const r = routes.flatMap((x) =>
    sourcesOf([x.source]).map((s, i) => [x.slug, i, s.label, s.url]),
  );
  return r.length === 0
    ? ""
    : `insert into public.sources (route_id, sort_order, title, url)
select r.id, v.sort_order, v.title, v.url
from (values
${rows(r)}
) as v(slug, sort_order, title, url)
join public.routes r on r.slug = v.slug;`;
})()}
`);

  add(`
-- Publicar (la verificación sigue en 'pending': nada está confirmado en terreno)
update public.places set publication_status = 'published'
  where slug in (${placeSlugs}) and publication_status = 'draft' and not managed_in_panel;
update public.events set publication_status = 'published'
  where slug in (${eventSlugs}) and publication_status = 'draft';
update public.routes set publication_status = 'published'
  where slug in (${routeSlugs}) and publication_status = 'draft';

commit;
`);

  return out.join("\n");
}
