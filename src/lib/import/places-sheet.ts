/**
 * Importación de comercios desde la planilla del formulario «Suma tu
 * comercio». Todo son funciones puras: leen la tabla, la entienden por el
 * nombre de sus columnas (no por su posición, así se pueden agregar o mover
 * preguntas) y calculan qué hay que crear, actualizar o dejar igual.
 */
import { ctaHref } from "@/lib/data";
import type { CategorySlug, CtaKind } from "@/content/types";

/** Texto sin tildes, signos ni mayúsculas, para comparar. */
export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const slugify = (s: string) => norm(s).replace(/ /g, "-");

// ── Columnas ──────────────────────────────────────────────────────────────
export const FIELDS = [
  "timestamp",
  "name",
  "offer",
  "locality",
  "address",
  "phrase",
  "hours",
  "phone",
  "link",
  "maps",
  "photoHow",
  "photoBy",
  "contactName",
  "contactEmail",
  "authorization",
] as const;
export type Field = (typeof FIELDS)[number];

/** Fragmentos (normalizados) del encabezado que identifican cada columna. */
const HEADERS: Record<Field, string[]> = {
  timestamp: ["marca temporal", "timestamp"],
  name: [
    "como se llama tu negocio",
    "nombre del negocio",
    "nombre del comercio",
  ],
  offer: ["que ofreces", "rubro", "tipo de negocio"],
  locality: ["donde esta", "localidad", "sector"],
  address: ["direccion o como llegar", "direccion"],
  phrase: ["en una frase", "que te hace especial"],
  hours: ["que dias y a que hora", "horario"],
  phone: ["whatsapp o telefono", "telefono"],
  link: ["instagram facebook o pagina web", "instagram", "pagina web"],
  maps: ["enlace de google maps", "google maps"],
  photoHow: ["como nos mandas tus fotos"],
  photoBy: ["quien tomo las fotos"],
  contactName: ["tu nombre"],
  contactEmail: ["tu correo", "correo"],
  authorization: ["autorizacion"],
};

export type Table = { rows: Record<string, string>[]; unknown: string[] };

/** Asocia cada encabezado con su campo; los que no se conocen quedan aparte. */
export function readTable(cells: string[][]): Table {
  const [head, ...body] = cells;
  if (!head) return { rows: [], unknown: [] };
  const map = new Map<number, Field>();
  const unknown: string[] = [];
  head.forEach((h, i) => {
    const n = norm(h);
    const field = (Object.keys(HEADERS) as Field[]).find((f) =>
      HEADERS[f].some((frag) => n === frag || n.includes(frag)),
    );
    if (field && ![...map.values()].includes(field)) map.set(i, field);
    else if (n) unknown.push(h.trim());
  });
  const rows = body.map((r) => {
    const o: Record<string, string> = {};
    for (const [i, f] of map) o[f] = (r[i] ?? "").trim();
    return o;
  });
  return { rows, unknown };
}

// ── Valores ───────────────────────────────────────────────────────────────
/** «17/10/2026 0:53:04» (hora de Chile) → instante ISO. */
export function parseTimestamp(s: string): string | null {
  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!m) return null;
  const [d, mo, y, h, mi, se] = m.slice(1).map((x) => Number(x ?? 0)) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, se);
  const offset = (t: number) => {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago",
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(new Date(t));
    const g = (k: string) => Number(p.find((x) => x.type === k)!.value);
    return (
      Date.UTC(
        g("year"),
        g("month") - 1,
        g("day"),
        g("hour"),
        g("minute"),
        g("second"),
      ) - t
    );
  };
  let t = asUtc - offset(asUtc);
  t = asUtc - offset(t);
  const date = new Date(t);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Teléfono chileno → «+569…»; celular (9…) = WhatsApp, fijo = llamada. */
export function parsePhone(
  s: string,
): { kind: Extract<CtaKind, "whatsapp" | "phone">; value: string } | null {
  let d = s.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("56")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  if (/^9\d{8}$/.test(d)) return { kind: "whatsapp", value: `+56${d}` };
  if (/^[2-7]\d{7,8}$/.test(d)) return { kind: "phone", value: `+56${d}` };
  return null;
}

const CATEGORY_WORDS: [CategorySlug, string[]][] = [
  [
    "alojamiento",
    ["alojamiento", "hospedaje", "cabana", "hotel", "hostal", "camping"],
  ],
  [
    "gastronomia",
    ["comida", "restaurante", "cocineria", "cafe", "heladeria", "gastronom"],
  ],
  ["deportes", ["deporte", "surf", "kayak", "pesca"]],
  [
    "ruralidad",
    [
      "campo",
      "agroturismo",
      "granja",
      "huerta",
      "rural",
      "caballo",
      "cabalgata",
    ],
  ],
  ["patrimonio", ["patrimonio", "cultura", "museo", "artesan", "taller"]],
  ["balneario", ["playa", "balneario", "bano"]],
  [
    "recreacion",
    [
      "excursion",
      "paseo",
      "turismo",
      "actividad",
      "tour",
      "experiencia",
      "recreacion",
    ],
  ],
];

/** «¿Qué ofreces?» → categoría de la guía, o null si hay que elegirla a mano. */
export function categoryOf(offer: string): CategorySlug | null {
  const n = norm(offer);
  for (const [slug, words] of CATEGORY_WORDS)
    if (words.some((w) => n.includes(w))) return slug;
  return null;
}

/** Instagram → enlace; otras redes o sitios → sitio web. */
export function parseLink(s: string): { instagram?: string; website?: string } {
  const raw = s.trim();
  if (!raw) return {};
  // «@usuario» (o un nombre sin punto) es un usuario de Instagram.
  const handle = raw.match(/^@([\w.]{2,30})$/) ?? raw.match(/^([\w]{2,30})$/);
  if (handle) return { instagram: `https://www.instagram.com/${handle[1]}/` };
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(url);
    if (!u.hostname.includes(".")) return {};
    if (u.hostname.endsWith("instagram.com"))
      return {
        instagram: `https://www.instagram.com${u.pathname.replace(/\/?$/, "/")}`,
      };
    return { website: u.toString() };
  } catch {
    return {};
  }
}

const httpsOrNull = (s: string) => {
  const t = s.trim();
  return /^https:\/\/\S+$/i.test(t) ? t : null;
};

// ── Registro normalizado de una fila ──────────────────────────────────────
export type Record_ = {
  key: string;
  name: string;
  categorySlug: CategorySlug | null;
  offer: string;
  localitySlug: string | null;
  localityText: string;
  address: string | null;
  phrase: string | null;
  hoursText: string | null;
  ctaKind: CtaKind | null;
  ctaValue: string | null;
  instagram: string | null;
  website: string | null;
  mapsUrl: string | null;
  photoCredit: string | null;
  contactName: string | null;
  contactEmail: string | null;
  confirmedAt: string | null;
};

/** Campos que se comparan para saber si algo cambió (sin la fecha de envío). */
export const DATA_FIELDS = [
  "name",
  "categorySlug",
  "localitySlug",
  "address",
  "phrase",
  "hoursText",
  "ctaKind",
  "ctaValue",
  "instagram",
  "website",
  "mapsUrl",
  "photoCredit",
  "contactName",
  "contactEmail",
] as const satisfies readonly (keyof Record_)[];
export type DataField = (typeof DATA_FIELDS)[number];

const orNull = (s: string | undefined) => (s && s.trim() ? s.trim() : null);

export type RowIssue = "noName" | "noAuthorization";

export function toRecord(
  row: Record<string, string>,
  localities: { slug: string; names: string[] }[],
): { record: Record_ | null; skip: RowIssue | null } {
  const name = (row.name ?? "").trim();
  if (!name) return { record: null, skip: "noName" };
  if (!orNull(row.authorization))
    return { record: null, skip: "noAuthorization" };
  const phone = row.phone ? parsePhone(row.phone) : null;
  const link = parseLink(row.link ?? "");
  const loc = norm(row.locality ?? "");
  const locality = loc
    ? localities.find((l) =>
        l.names.some((n) => norm(n) === loc || loc.includes(norm(n))),
      )
    : undefined;
  const cta =
    phone && ctaHref({ kind: phone.kind, value: phone.value }) ? phone : null;
  return {
    skip: null,
    record: {
      key: slugify(name),
      name,
      categorySlug: categoryOf(row.offer ?? ""),
      offer: (row.offer ?? "").trim(),
      localitySlug: locality?.slug ?? null,
      localityText: (row.locality ?? "").trim(),
      address: orNull(row.address),
      phrase: orNull((row.phrase ?? "").replace(/^["«“]+|["»”]+$/g, "")),
      hoursText: orNull(row.hours),
      ctaKind: cta?.kind ?? null,
      ctaValue: cta?.value ?? null,
      instagram: link.instagram ?? null,
      website: link.website ?? null,
      mapsUrl: httpsOrNull(row.maps ?? ""),
      photoCredit: orNull(row.photoBy),
      contactName: orNull(row.contactName),
      contactEmail: orNull(row.contactEmail)?.toLowerCase() ?? null,
      confirmedAt: row.timestamp ? parseTimestamp(row.timestamp) : null,
    },
  };
}

// ── Plan: qué hacer con cada comercio ─────────────────────────────────────
export type ExistingPlace = {
  id: string;
  slug: string;
  /** Nombre en español. */
  name: string;
  importKey: string | null;
  snapshot: Partial<Record<DataField, string | null>> | null;
  infoUpdatedAt: string | null;
};

export type PlanStatus =
  | "new" // no existe: se crea
  | "update" // cambió algún dato de la planilla desde la última importación
  | "confirm" // mismos datos, pero volvió a responder: se actualiza la fecha
  | "link" // ya estaba en la guía: se vincula sin cambiar sus datos
  | "same" // sin cambios
  | "skip"; // no se puede importar

export type PlanItem = {
  key: string;
  name: string;
  status: PlanStatus;
  record: Record_ | null;
  existing: ExistingPlace | null;
  /** Campos de la planilla que cambiaron (para «update»). */
  changed: DataField[];
  /** Por qué se omite, o qué falta. */
  reason: "noName" | "noAuthorization" | null;
  /** Falta elegir la categoría a mano (comercio nuevo sin rubro reconocible). */
  needsCategory: boolean;
  /** Filas repetidas del mismo comercio: se usa la última respuesta. */
  duplicates: number;
};

export const snapshotOf = (r: Record_): Record<DataField, string | null> =>
  Object.fromEntries(DATA_FIELDS.map((f) => [f, r[f] ?? null])) as Record<
    DataField,
    string | null
  >;

const later = (a: string | null, b: string | null) =>
  !!a && (!b || Date.parse(a) > Date.parse(b));

export function planImport(
  table: Table,
  existing: ExistingPlace[],
  localities: { slug: string; names: string[] }[],
): { items: PlanItem[]; unknownColumns: string[] } {
  const items: PlanItem[] = [];
  const byKey = new Map<string, number>();
  let blank = 0;
  for (const row of table.rows) {
    const { record, skip } = toRecord(row, localities);
    if (!record) {
      // Sin nombre no hay nada que mostrar; sin autorización sí se avisa.
      if (skip === "noAuthorization")
        items.push({
          key: `sin-autorizacion-${++blank}`,
          name: (row.name ?? "").trim(),
          status: "skip",
          record: null,
          existing: null,
          changed: [],
          reason: skip,
          needsCategory: false,
          duplicates: 0,
        });
      continue;
    }
    // Respuestas repetidas del mismo comercio: manda la más reciente.
    const at = byKey.get(record.key);
    if (at !== undefined) {
      const prev = items[at]!;
      prev.duplicates += 1;
      if (!later(record.confirmedAt, prev.record?.confirmedAt ?? null))
        continue;
      prev.record = record;
      prev.name = record.name;
      continue;
    }
    byKey.set(record.key, items.length);
    items.push({
      key: record.key,
      name: record.name,
      status: "new",
      record,
      existing: null,
      changed: [],
      reason: null,
      needsCategory: false,
      duplicates: 0,
    });
  }

  for (const it of items) {
    if (!it.record) continue;
    const r = it.record;
    const found =
      existing.find((p) => p.importKey === r.key) ??
      existing.find((p) => slugify(p.name) === r.key);
    it.existing = found ?? null;
    if (!found) {
      it.status = "new";
      it.needsCategory = r.categorySlug === null;
      continue;
    }
    if (!found.importKey || !found.snapshot) {
      // Ya estaba en la guía (hecha a mano o desde el repo): se vincula.
      it.status = later(r.confirmedAt, found.infoUpdatedAt)
        ? "confirm"
        : "link";
      continue;
    }
    const now = snapshotOf(r);
    it.changed = DATA_FIELDS.filter(
      (f) => (found.snapshot![f] ?? null) !== now[f],
    );
    it.status =
      it.changed.length > 0
        ? "update"
        : later(r.confirmedAt, found.infoUpdatedAt)
          ? "confirm"
          : "same";
  }
  return { items, unknownColumns: table.unknown };
}
