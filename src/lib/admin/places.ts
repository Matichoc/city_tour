/**
 * Crear, editar e importar comercios desde el panel, con el token de quien
 * está conectado: la RLS decide qué puede hacer (el editor crea borradores; solo
 * un administrador publica).
 */
import { rest, type Session } from "@/lib/admin/api";
import { CATEGORY_DEFS } from "@/content/catalog";
import type { CategorySlug, CtaKind, PlaceHours } from "@/content/types";
import { groupHours } from "@/lib/hours";
import {
  DATA_FIELDS,
  contactSnapshotOf,
  planImport,
  slugify,
  snapshotOf,
  type ContactField,
  type DataField,
  type ExistingPlace,
  type PlanItem,
  type Record_,
  type Table,
} from "@/lib/import/places-sheet";

const enc = encodeURIComponent;
export type PlaceInput = {
  name: string;
  categorySlug: CategorySlug;
  localitySlug: string | null;
  address: string | null;
  short: string | null;
  description: string | null;
  hoursText: string | null;
  ctaKind: CtaKind | null;
  ctaValue: string | null;
  instagram: string | null;
  website: string | null;
  mapsUrl: string | null;
  sernaturNumber: string | null;
  sernaturValidUntil: string | null;
  contactName: string | null;
  contactEmail: string | null;
  /** El representante del local confirmó los datos de la ficha. */
  ownerValidated: boolean;
};

export type LocalityOption = { id: string; slug: string; names: string[] };

export async function listLocalityOptions(
  token: string,
): Promise<LocalityOption[]> {
  const rows = await rest<
    {
      id: string;
      slug: string;
      translations: { locale: string; name: string }[];
    }[]
  >(
    token,
    "localities?select=id,slug,translations:locality_translations(locale,name)&order=sort_order,slug",
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    names: r.translations.map((t) => t.name),
  }));
}

export const localityLabel = (l: LocalityOption) =>
  l.names.find(Boolean) ?? l.slug;

async function idBySlug(
  token: string,
  table: "categories" | "localities",
  slug: string,
) {
  const [row] = await rest<{ id: string }[]>(
    token,
    `${table}?select=id&slug=eq.${enc(slug)}&limit=1`,
  );
  if (!row) throw new Error(`No existe ${table}/${slug}`);
  return row.id;
}

async function freeSlug(token: string, name: string) {
  const base = slugify(name).slice(0, 60) || "comercio";
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const found = await rest<{ id: string }[]>(
      token,
      `places?select=id&slug=eq.${enc(slug)}&limit=1`,
    );
    if (found.length === 0) return slug;
  }
  throw new Error("No se encontró un nombre de dirección libre");
}

const post = <T>(
  token: string,
  path: string,
  body: unknown,
  prefer = "return=representation",
) =>
  rest<T>(token, path, {
    method: "POST",
    headers: { prefer },
    body: JSON.stringify(body),
  });

const patch = (token: string, path: string, body: unknown) =>
  rest<null>(token, path, { method: "PATCH", body: JSON.stringify(body) });

async function saveSpanishText(
  token: string,
  placeId: string,
  text: { name?: string; short?: string | null; description?: string | null },
) {
  // Con nombre se puede crear o reemplazar la ficha; sin nombre (cambio parcial
  // de la importación) solo se actualizan esos campos de la ficha existente.
  if (text.name !== undefined)
    await post(
      token,
      "place_translations?on_conflict=place_id,locale",
      { place_id: placeId, locale: "es", ...toTranslation(text) },
      "resolution=merge-duplicates,return=minimal",
    );
  else
    await patch(
      token,
      `place_translations?place_id=eq.${enc(placeId)}&locale=eq.es`,
      toTranslation(text),
    );
}

const toTranslation = (t: {
  name?: string;
  short?: string | null;
  description?: string | null;
}) => ({
  ...(t.name !== undefined ? { name: t.name } : {}),
  ...(t.short !== undefined ? { short_description: t.short } : {}),
  ...(t.description !== undefined ? { full_description: t.description } : {}),
});

async function saveContact(
  token: string,
  placeId: string,
  c: { name: string | null; email: string | null },
) {
  if (!c.email) return;
  await post(
    token,
    "place_contacts?on_conflict=place_id,email",
    { place_id: placeId, name: c.name, email: c.email },
    "resolution=merge-duplicates,return=minimal",
  );
}

/**
 * Guarda el último contacto importado en la tabla privada (solo personal).
 * Va aparte de `places.import_snapshot` porque esa columna no debe tener
 * datos personales (PRIV-01).
 */
async function saveContactSnapshot(
  token: string,
  placeId: string,
  contact: Record<ContactField, string | null>,
) {
  await post(
    token,
    "place_import_private?on_conflict=place_id",
    { place_id: placeId, contact, updated_at: new Date().toISOString() },
    "resolution=merge-duplicates,return=minimal",
  );
}

type ImportMeta = {
  importKey: string;
  snapshot: Record<Exclude<DataField, ContactField>, string | null>;
  contactSnapshot: Record<ContactField, string | null>;
  confirmedAt: string | null;
};

/** Crea una ficha en borrador y, si quien la crea es admin y lo pide, la publica. */
export async function createPlace(
  session: Session,
  input: PlaceInput,
  opts: { publish: boolean; import?: ImportMeta } = { publish: false },
): Promise<{ id: string; slug: string; published: boolean }> {
  const { token } = session;
  const [categoryId, localityId, slug] = await Promise.all([
    idBySlug(token, "categories", input.categorySlug),
    input.localitySlug
      ? idBySlug(token, "localities", input.localitySlug)
      : null,
    freeSlug(token, input.name),
  ]);
  const [row] = await post<{ id: string }[]>(token, "places", {
    slug,
    category_id: categoryId,
    locality_id: localityId,
    address: input.address,
    hours_text: input.hoursText,
    cta_kind: input.ctaKind,
    cta_value: input.ctaKind ? input.ctaValue : null,
    instagram: input.instagram,
    website: input.website,
    maps_url: input.mapsUrl,
    sernatur_number: input.sernaturNumber,
    sernatur_valid_until: input.sernaturNumber
      ? input.sernaturValidUntil
      : null,
    is_business: true,
    managed_in_panel: true,
    owner_validated: input.ownerValidated,
    publication_status: "draft",
    ...(opts.import
      ? {
          import_key: opts.import.importKey,
          import_snapshot: opts.import.snapshot,
          imported_at: new Date().toISOString(),
          info_updated_at: opts.import.confirmedAt,
        }
      : {}),
  });
  if (!row) throw new Error("No se pudo crear la ficha");
  await saveSpanishText(token, row.id, {
    name: input.name,
    short: input.short,
    description: input.description ?? input.short,
  });
  await saveContact(token, row.id, {
    name: input.contactName,
    email: input.contactEmail,
  });
  if (opts.import)
    await saveContactSnapshot(token, row.id, opts.import.contactSnapshot);
  const published = opts.publish && session.role === "admin";
  if (published)
    await patch(token, `places?id=eq.${enc(row.id)}`, {
      publication_status: "published",
    });
  return { id: row.id, slug, published };
}

export type PlaceForEdit = PlaceInput & {
  id: string;
  slug: string;
  publication: "draft" | "published" | "archived";
  infoUpdatedAt: string | null;
  images: PlaceImageRow[];
  /** Horarios por temporada (los de la ficha pública). */
  hours: PlaceHours[];
};

export type PlaceImageRow = {
  id: string;
  path: string;
  kind: "photo" | "menu" | "promo" | "logo" | "video";
  alt: string;
  credit: string | null;
  position: number;
};

export async function getPlaceForEdit(
  token: string,
  id: string,
): Promise<PlaceForEdit | null> {
  const [r] = await rest<
    {
      id: string;
      slug: string;
      publication_status: PlaceForEdit["publication"];
      address: string | null;
      hours_text: string | null;
      cta_kind: CtaKind | null;
      cta_value: string | null;
      instagram: string | null;
      website: string | null;
      maps_url: string | null;
      sernatur_number: string | null;
      sernatur_valid_until: string | null;
      info_updated_at: string | null;
      owner_validated: boolean;
      hours: Parameters<typeof groupHours>[0];
      category: { slug: CategorySlug } | null;
      locality: { slug: string } | null;
      translations: {
        locale: string;
        name: string;
        short_description: string | null;
        full_description: string | null;
      }[];
      contacts: { name: string | null; email: string | null }[];
      images: {
        id: string;
        storage_path: string;
        kind: PlaceImageRow["kind"];
        alt_text: string;
        credit: string | null;
        position: number;
      }[];
    }[]
  >(
    token,
    "places?select=id,slug,publication_status,address,hours_text,cta_kind,cta_value,instagram,website,maps_url," +
      "sernatur_number,sernatur_valid_until,info_updated_at,owner_validated," +
      "hours:place_hours(day_of_week,opens_at,closes_at,closed,from_month,to_month,holidays)," +
      "category:categories(slug),locality:localities(slug)," +
      "translations:place_translations(locale,name,short_description,full_description)," +
      "contacts:place_contacts(name,email),images:place_images(id,storage_path,kind,alt_text,credit,position)" +
      `&id=eq.${enc(id)}&limit=1`,
  );
  if (!r) return null;
  const es = r.translations.find((t) => t.locale === "es");
  return {
    id: r.id,
    slug: r.slug,
    publication: r.publication_status,
    infoUpdatedAt: r.info_updated_at,
    name: es?.name ?? r.slug,
    categorySlug: r.category?.slug ?? "gastronomia",
    localitySlug: r.locality?.slug ?? null,
    address: r.address,
    short: es?.short_description ?? null,
    description: es?.full_description ?? null,
    hoursText: r.hours_text,
    ctaKind: r.cta_kind,
    ctaValue: r.cta_value,
    instagram: r.instagram,
    website: r.website,
    mapsUrl: r.maps_url,
    sernaturNumber: r.sernatur_number,
    sernaturValidUntil: r.sernatur_valid_until,
    contactName: r.contacts[0]?.name ?? null,
    contactEmail: r.contacts[0]?.email ?? null,
    ownerValidated: r.owner_validated,
    hours: groupHours(r.hours),
    images: r.images
      .map((i) => ({
        id: i.id,
        path: i.storage_path,
        kind: i.kind,
        alt: i.alt_text,
        credit: i.credit,
        position: i.position,
      }))
      .sort((a, b) => a.position - b.position),
  };
}

export async function updatePlace(
  session: Session,
  id: string,
  input: PlaceInput,
) {
  const { token } = session;
  const [categoryId, localityId] = await Promise.all([
    idBySlug(token, "categories", input.categorySlug),
    input.localitySlug
      ? idBySlug(token, "localities", input.localitySlug)
      : null,
  ]);
  await patch(token, `places?id=eq.${enc(id)}`, {
    category_id: categoryId,
    locality_id: localityId,
    address: input.address,
    hours_text: input.hoursText,
    cta_kind: input.ctaKind,
    cta_value: input.ctaKind ? input.ctaValue : null,
    instagram: input.instagram,
    website: input.website,
    maps_url: input.mapsUrl,
    sernatur_number: input.sernaturNumber,
    sernatur_valid_until: input.sernaturNumber
      ? input.sernaturValidUntil
      : null,
    managed_in_panel: true,
    owner_validated: input.ownerValidated,
  });
  await saveSpanishText(token, id, {
    name: input.name,
    short: input.short,
    description: input.description,
  });
  await saveContact(token, id, {
    name: input.contactName,
    email: input.contactEmail,
  });
}

export const setPublication = (
  session: Session,
  id: string,
  status: "published" | "draft",
) =>
  patch(session.token, `places?id=eq.${enc(id)}`, {
    publication_status: status,
  });

/** Registra que el comercio confirmó sus datos hoy (se usa al editar con él). */
export const touchInfo = (token: string, id: string) =>
  patch(token, `places?id=eq.${enc(id)}`, {
    info_updated_at: new Date().toISOString(),
  });

// ── Imágenes ──────────────────────────────────────────────────────────────
export const PLACE_BUCKET = "place-images";
export const VIDEO_BUCKET = "place-videos";

/** Dirección pública de un archivo de un bucket público. */
export const publicObjectUrl = (base: string, bucket: string, path: string) =>
  `${base}/storage/v1/object/public/${bucket}/${path}`;

export const publicImageUrl = (base: string, path: string) =>
  publicObjectUrl(base, PLACE_BUCKET, path);

export async function addImageRow(
  token: string,
  placeId: string,
  img: {
    url: string;
    kind: PlaceImageRow["kind"];
    width: number;
    height: number;
    alt: string;
    credit: string | null;
  },
) {
  const existing = await rest<{ position: number }[]>(
    token,
    `place_images?select=position&place_id=eq.${enc(placeId)}&order=position.desc&limit=1`,
  );
  const position = (existing[0]?.position ?? -1) + 1;
  await patch(token, `places?id=eq.${enc(placeId)}`, {
    managed_in_panel: true,
  });
  await post(
    token,
    "place_images",
    {
      place_id: placeId,
      storage_path: img.url,
      kind: img.kind,
      width: img.width,
      height: img.height,
      alt_text: img.alt,
      alt_text_en: img.alt,
      alt_text_pt: img.alt,
      credit: img.credit,
      position,
    },
    "return=minimal",
  );
}

/** Quita la imagen de la ficha y devuelve su ruta (para borrar el archivo). */
export async function removeImageRow(
  token: string,
  placeId: string,
  id: string,
) {
  const [row] = await rest<{ storage_path: string }[]>(
    token,
    `place_images?select=storage_path&id=eq.${enc(id)}&place_id=eq.${enc(placeId)}`,
  );
  if (!row) throw new Error("Imagen no encontrada");
  await patch(token, `places?id=eq.${enc(placeId)}`, {
    managed_in_panel: true,
  });
  await rest<null>(token, `place_images?id=eq.${enc(id)}`, {
    method: "DELETE",
  });
  return row.storage_path;
}

/** Deja la imagen como primera (portada si es foto). */
export async function makeFirstImage(
  token: string,
  placeId: string,
  id: string,
) {
  const first = await rest<{ position: number }[]>(
    token,
    `place_images?select=position&place_id=eq.${enc(placeId)}&order=position.asc&limit=1`,
  );
  await patch(token, `place_images?id=eq.${enc(id)}`, {
    position: (first[0]?.position ?? 0) - 1,
  });
}

/** Cambia el texto alternativo y el crédito de una imagen o video. */
export async function updateImageText(
  token: string,
  placeId: string,
  id: string,
  text: { alt: string; credit: string | null },
) {
  const [row] = await rest<{ alt_text: string }[]>(
    token,
    `place_images?select=alt_text&id=eq.${enc(id)}&place_id=eq.${enc(placeId)}`,
  );
  if (!row) throw new Error("Imagen no encontrada");
  await patch(token, `places?id=eq.${enc(placeId)}`, {
    managed_in_panel: true,
  });
  await patch(token, `place_images?id=eq.${enc(id)}`, {
    alt_text: text.alt,
    credit: text.credit,
    // Si cambió el texto en español, las traducciones viejas ya no calzan: se
    // muestra el español hasta que alguien las revise.
    ...(row.alt_text !== text.alt
      ? { alt_text_en: null, alt_text_pt: null }
      : {}),
  });
}

/** Sube o baja una imagen un lugar en el orden de la ficha. */
export async function moveImage(
  token: string,
  placeId: string,
  id: string,
  direction: "up" | "down",
) {
  const rows = await rest<{ id: string; position: number }[]>(
    token,
    `place_images?select=id,position&place_id=eq.${enc(placeId)}&order=position.asc`,
  );
  const at = rows.findIndex((r) => r.id === id);
  const to = direction === "up" ? at - 1 : at + 1;
  if (at < 0 || to < 0 || to >= rows.length) return;
  const order = rows.map((r) => r.id);
  [order[at], order[to]] = [order[to]!, order[at]!];
  await patch(token, `places?id=eq.${enc(placeId)}`, {
    managed_in_panel: true,
  });
  // Posiciones 0..n-1 en el orden nuevo (solo se escriben las que cambian).
  await Promise.all(
    order.map((rowId, position) =>
      rows.find((r) => r.id === rowId)!.position === position
        ? null
        : patch(token, `place_images?id=eq.${enc(rowId)}`, { position }),
    ),
  );
}

// ── Horarios por temporada ────────────────────────────────────────────────
export const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validSeason(h: PlaceHours): boolean {
  const month = (m: number) => Number.isInteger(m) && m >= 1 && m <= 12;
  return (
    month(h.fromMonth) &&
    month(h.toMonth) &&
    h.days.length > 0 &&
    h.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
    TIME.test(h.opens) &&
    TIME.test(h.closes)
  );
}

/**
 * Reemplaza los horarios de la ficha. Primero se agregan los nuevos y recién
 * después se quitan los anteriores, así un error a medio camino no deja la
 * ficha sin horarios.
 */
export async function replaceHours(
  token: string,
  placeId: string,
  seasons: PlaceHours[],
) {
  if (!seasons.every(validSeason)) throw new Error("Horario no válido");
  const old = await rest<{ id: string }[]>(
    token,
    `place_hours?select=id&place_id=eq.${enc(placeId)}`,
  );
  const rows = seasons.flatMap((h) =>
    [...new Set(h.days)].map((day) => ({
      place_id: placeId,
      day_of_week: day,
      opens_at: h.opens,
      closes_at: h.closes,
      from_month: h.fromMonth,
      to_month: h.toMonth,
      holidays: h.holidays === true,
    })),
  );
  await patch(token, `places?id=eq.${enc(placeId)}`, {
    managed_in_panel: true,
  });
  if (rows.length > 0) await post(token, "place_hours", rows, "return=minimal");
  if (old.length > 0)
    await rest<null>(
      token,
      `place_hours?id=in.(${old.map((o) => enc(o.id)).join(",")})`,
      { method: "DELETE" },
    );
}

// ── Importación ───────────────────────────────────────────────────────────
export async function loadImportContext(token: string) {
  const [places, localities] = await Promise.all([
    rest<
      {
        id: string;
        slug: string;
        import_key: string | null;
        import_snapshot: ExistingPlace["snapshot"];
        info_updated_at: string | null;
        translations: { locale: string; name: string }[];
        place_import_private: {
          contact: ExistingPlace["contactSnapshot"];
        } | null;
      }[]
    >(
      token,
      "places?select=id,slug,import_key,import_snapshot,info_updated_at,translations:place_translations(locale,name),place_import_private(contact)",
    ),
    listLocalityOptions(token),
  ]);
  const existing: ExistingPlace[] = places.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.translations.find((t) => t.locale === "es")?.name ?? p.slug,
    importKey: p.import_key,
    snapshot: p.import_snapshot,
    contactSnapshot: p.place_import_private?.contact ?? null,
    infoUpdatedAt: p.info_updated_at,
  }));
  return { existing, localities };
}

export async function planFromTable(token: string, table: Table) {
  const { existing, localities } = await loadImportContext(token);
  return planImport(table, existing, localities);
}

export type ImportResult = {
  created: number;
  updated: number;
  confirmed: number;
  linked: number;
  same: number;
  skipped: number;
  errors: { name: string; message: string }[];
};

const recordToInput = (r: Record_, category: CategorySlug): PlaceInput => ({
  name: r.name,
  categorySlug: category,
  localitySlug: r.localitySlug,
  address: r.address,
  short: r.phrase,
  description: r.phrase,
  hoursText: r.hoursText,
  ctaKind: r.ctaKind,
  ctaValue: r.ctaValue,
  instagram: r.instagram,
  website: r.website,
  mapsUrl: r.mapsUrl,
  sernaturNumber: null,
  sernaturValidUntil: null,
  contactName: r.contactName,
  contactEmail: r.contactEmail,
  // El formulario exige la autorización del dueño o encargado.
  ownerValidated: true,
});

/**
 * Aplica el plan. Solo toca lo que cambió en la planilla desde la última
 * importación, así lo que se editó a mano en el panel en otros campos se
 * conserva. `categories`: categoría elegida a mano para comercios nuevos.
 */
export async function applyPlan(
  session: Session,
  items: PlanItem[],
  opts: {
    publish: boolean;
    categories: Record<string, CategorySlug | undefined>;
  },
): Promise<ImportResult> {
  const { token } = session;
  const out: ImportResult = {
    created: 0,
    updated: 0,
    confirmed: 0,
    linked: 0,
    same: 0,
    skipped: 0,
    errors: [],
  };
  for (const it of items) {
    const r = it.record;
    try {
      if (it.status === "skip" || !r) {
        out.skipped++;
      } else if (it.status === "same") {
        out.same++;
      } else if (it.status === "new") {
        const category = r.categorySlug ?? opts.categories[it.key];
        if (!category) {
          out.skipped++;
          continue;
        }
        await createPlace(session, recordToInput(r, category), {
          publish: opts.publish,
          import: {
            importKey: r.key,
            snapshot: snapshotOf(r),
            contactSnapshot: contactSnapshotOf(r),
            confirmedAt: r.confirmedAt,
          },
        });
        out.created++;
      } else if (it.existing) {
        const id = it.existing.id;
        const body: Record<string, unknown> = {};
        // El contacto importado se guarda aparte, antes de tocar la ficha: así
        // `import_snapshot` nunca lleva datos personales (ni en filas antiguas,
        // cuyo snapshot se reemplaza aquí).
        if (
          it.status === "update" ||
          it.status === "link" ||
          !it.existing.importKey
        )
          await saveContactSnapshot(token, id, contactSnapshotOf(r));
        if (it.status === "link" || !it.existing.importKey) {
          body.import_key = r.key;
          body.import_snapshot = snapshotOf(r);
          body.imported_at = new Date().toISOString();
        }
        if (it.status === "update") {
          body.import_snapshot = snapshotOf(r);
          body.imported_at = new Date().toISOString();
          body.managed_in_panel = true;
          body.owner_validated = true;
          const ch = new Set<DataField>(it.changed);
          if (ch.has("categorySlug") && r.categorySlug)
            body.category_id = await idBySlug(
              token,
              "categories",
              r.categorySlug,
            );
          if (ch.has("localitySlug"))
            body.locality_id = r.localitySlug
              ? await idBySlug(token, "localities", r.localitySlug)
              : null;
          if (ch.has("address")) body.address = r.address;
          if (ch.has("hoursText")) body.hours_text = r.hoursText;
          if (ch.has("ctaKind") || ch.has("ctaValue")) {
            body.cta_kind = r.ctaKind;
            body.cta_value = r.ctaKind ? r.ctaValue : null;
          }
          if (ch.has("instagram")) body.instagram = r.instagram;
          if (ch.has("website")) body.website = r.website;
          if (ch.has("mapsUrl")) body.maps_url = r.mapsUrl;
          if (ch.has("name") || ch.has("phrase"))
            await saveSpanishText(token, id, {
              ...(ch.has("name") ? { name: r.name } : {}),
              ...(ch.has("phrase")
                ? { short: r.phrase, description: r.phrase }
                : {}),
            });
          if (ch.has("contactName") || ch.has("contactEmail"))
            await saveContact(token, id, {
              name: r.contactName,
              email: r.contactEmail,
            });
        }
        if (
          r.confirmedAt &&
          (!it.existing.infoUpdatedAt ||
            Date.parse(r.confirmedAt) > Date.parse(it.existing.infoUpdatedAt))
        )
          body.info_updated_at = r.confirmedAt;
        if (Object.keys(body).length > 0)
          await patch(token, `places?id=eq.${enc(id)}`, body);
        if (it.status === "update") out.updated++;
        else if (it.status === "confirm") out.confirmed++;
        else out.linked++;
      }
    } catch (error) {
      out.errors.push({
        name: it.name,
        message: error instanceof Error ? error.message.slice(0, 200) : "error",
      });
    }
  }
  return out;
}

export const CATEGORY_OPTIONS = CATEGORY_DEFS.map((c) => ({
  slug: c.slug,
  name: c.es,
}));
export { DATA_FIELDS };

// ── Planilla guardada ─────────────────────────────────────────────────────
export async function getImportSheetUrl(token: string): Promise<string | null> {
  try {
    const [r] = await rest<{ import_sheet_url: string | null }[]>(
      token,
      "site_settings?select=import_sheet_url",
    );
    return r?.import_sheet_url ?? null;
  } catch {
    return null;
  }
}

export const saveImportSheetUrl = (token: string, url: string) =>
  patch(token, "site_settings?id=eq.true", { import_sheet_url: url });
