"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { canModerate, getSession, type Session } from "@/lib/admin/api";
import { supabaseConfig } from "@/lib/db/content-source";
import { CATEGORY_DEFS } from "@/content/catalog";
import type { CategorySlug, CtaKind } from "@/content/types";
import { ctaHref } from "@/lib/data";
import {
  addImageRow,
  applyPlan,
  createPlace,
  getPlaceForEdit,
  makeFirstImage,
  PLACE_BUCKET,
  planFromTable,
  publicImageUrl,
  removeImageRow,
  saveImportSheetUrl,
  setPublication,
  updatePlace,
  type ImportResult,
  type PlaceInput,
} from "@/lib/admin/places";
import { parseCsv, sheetCsvUrl } from "@/lib/import/csv";
import { parseLink, readTable, type PlanItem } from "@/lib/import/places-sheet";

const UUID = /^[0-9a-f-]{36}$/;
const CTA_KINDS: CtaKind[] = [
  "whatsapp",
  "phone",
  "website",
  "menu",
  "booking",
  "instagram",
];
const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";
const orNull = (v: string) => (v === "" ? null : v);
const https = (v: string) => (/^https:\/\/\S+$/i.test(v) ? v : null);

export type FormError =
  | "name"
  | "category"
  | "text"
  | "button"
  | "link"
  | "sernatur"
  | "email"
  | "save";

/** Lee y valida el formulario de una ficha; nunca confía en el navegador. */
function parsePlaceForm(f: FormData): PlaceInput | FormError {
  const name = text(f.get("nombre"));
  if (name.length < 3 || name.length > 80) return "name";
  const category = text(f.get("categoria")) as CategorySlug;
  if (!CATEGORY_DEFS.some((c) => c.slug === category)) return "category";
  const short = text(f.get("frase"));
  const description = text(f.get("descripcion"));
  const hours = text(f.get("horario"));
  const address = text(f.get("direccion"));
  if (
    short.length > 200 ||
    description.length > 1500 ||
    hours.length > 600 ||
    address.length > 200
  )
    return "text";

  const kind = text(f.get("boton_tipo")) as CtaKind | "";
  const value = text(f.get("boton_valor"));
  if (kind && (!CTA_KINDS.includes(kind) || ctaHref({ kind, value }) === null))
    return "button";

  const insta = text(f.get("instagram"));
  const site = text(f.get("web"));
  const maps = text(f.get("maps"));
  const instagram = insta ? (parseLink(insta).instagram ?? null) : null;
  const website = site
    ? https(
        /^https?:\/\//i.test(site)
          ? site.replace(/^http:/i, "https:")
          : `https://${site}`,
      )
    : null;
  const mapsUrl = maps ? https(maps) : null;
  if ((insta && !instagram) || (site && !website) || (maps && !mapsUrl))
    return "link";

  const sernaturNumber = text(f.get("sernatur_numero"));
  const sernaturDate = text(f.get("sernatur_vigencia"));
  if (
    (sernaturNumber || sernaturDate) &&
    (!/^\d{1,10}$/.test(sernaturNumber) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(sernaturDate))
  )
    return "sernatur";

  const email = text(f.get("contacto_correo")).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "email";

  return {
    name,
    categorySlug: category,
    localitySlug: orNull(text(f.get("localidad"))),
    address: orNull(address),
    short: orNull(short),
    description: orNull(description),
    hoursText: orNull(hours),
    ctaKind: kind || null,
    ctaValue: kind ? value : null,
    instagram,
    website,
    mapsUrl,
    sernaturNumber: orNull(sernaturNumber),
    sernaturValidUntil: orNull(sernaturDate),
    contactName: orNull(text(f.get("contacto_nombre"))),
    contactEmail: orNull(email),
  };
}

async function staff(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  return session;
}

export async function createPlaceAction(formData: FormData) {
  const session = await staff();
  const input = parsePlaceForm(formData);
  if (typeof input === "string" || !canModerate(session))
    redirect(
      `/admin/comercios/nuevo?error=${typeof input === "string" ? input : "save"}`,
    );
  let id: string;
  try {
    ({ id } = await createPlace(session, input, {
      publish: text(formData.get("publicar")) === "on",
    }));
  } catch (error) {
    console.error("[admin] no se pudo crear el comercio", error);
    redirect("/admin/comercios/nuevo?error=save");
  }
  updateTag("content");
  redirect(`/admin/comercios/${id}?creado=1#fotos`);
}

export async function updatePlaceAction(formData: FormData) {
  const session = await staff();
  const id = text(formData.get("id"));
  const input = parsePlaceForm(formData);
  const back = `/admin/comercios/${id}`;
  if (!UUID.test(id) || typeof input === "string" || !canModerate(session))
    redirect(`${back}?error=${typeof input === "string" ? input : "save"}`);
  try {
    await updatePlace(session, id, input);
  } catch (error) {
    console.error("[admin] no se pudo guardar el comercio", error);
    redirect(`${back}?error=save`);
  }
  updateTag("content");
  redirect(`${back}?guardado=1`);
}

/** Publicar o volver a borrador: solo administración. */
export async function publishPlaceAction(formData: FormData) {
  const session = await staff();
  const id = text(formData.get("id"));
  const publish = text(formData.get("accion")) === "publicar";
  const back = `/admin/comercios/${id}`;
  if (!UUID.test(id) || session.role !== "admin")
    redirect(`${back}?error=publish`);
  try {
    await setPublication(session, id, publish ? "published" : "draft");
  } catch (error) {
    console.error("[admin] no se pudo cambiar la publicación", error);
    redirect(`${back}?error=publish`);
  }
  updateTag("content");
  redirect(`${back}?guardado=1`);
}

// ── Imágenes ──────────────────────────────────────────────────────────────
const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD = 4 * 1024 * 1024;
const KINDS = ["photo", "menu", "promo", "logo"] as const;
type Kind = (typeof KINDS)[number];

export type UploadResult =
  | { ok: true }
  | { ok: false; error: "type" | "size" | "kind" | "read" | "save" | "denied" };

/**
 * Sube una imagen: se vuelve a codificar a WebP (así se borran los metadatos
 * ocultos, como la ubicación GPS de las fotos del celular), se achica y se
 * guarda en el bucket público `place-images`.
 */
export async function uploadPlaceImage(
  formData: FormData,
): Promise<UploadResult> {
  const session = await getSession();
  if (!session || !canModerate(session)) return { ok: false, error: "denied" };
  const id = text(formData.get("id"));
  const kind = text(formData.get("tipo")) as Kind;
  const file = formData.get("archivo");
  if (!UUID.test(id) || !KINDS.includes(kind))
    return { ok: false, error: "kind" };
  if (!(file instanceof File) || !IMAGE_MIME.includes(file.type))
    return { ok: false, error: "type" };
  if (file.size > MAX_UPLOAD || file.size === 0)
    return { ok: false, error: "size" };
  const cfg = supabaseConfig();
  if (!cfg) return { ok: false, error: "save" };

  let out: { data: Buffer; width: number; height: number };
  try {
    const { data, info } = await sharp(Buffer.from(await file.arrayBuffer()), {
      failOn: "error",
    })
      .rotate()
      .resize({ width: kind === "logo" ? 512 : 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    out = { data, width: info.width, height: info.height };
  } catch {
    return { ok: false, error: "read" };
  }

  try {
    const place = await getPlaceForEdit(session.token, id);
    if (!place) return { ok: false, error: "denied" };
    const path = `${id}/${randomUUID()}.webp`;
    const res = await fetch(
      `${cfg.url}/storage/v1/object/${PLACE_BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: cfg.key,
          authorization: `Bearer ${session.token}`,
          "content-type": "image/webp",
          "x-upsert": "false",
        },
        body: new Uint8Array(out.data),
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Storage ${res.status}: ${await res.text()}`);
    const label = {
      photo: "Foto de",
      menu: "Carta de",
      promo: "Publicidad de",
      logo: "Logo de",
    }[kind];
    await addImageRow(session.token, id, {
      url: publicImageUrl(cfg.url, path),
      kind,
      width: out.width,
      height: out.height,
      alt: text(formData.get("alt")) || `${label} ${place.name}`,
      credit: orNull(text(formData.get("credito"))),
    });
  } catch (error) {
    console.error("[admin] no se pudo subir la imagen", error);
    return { ok: false, error: "save" };
  }
  updateTag("content");
  return { ok: true };
}

export async function removePlaceImageAction(formData: FormData) {
  const session = await staff();
  const place = text(formData.get("lugar"));
  const id = text(formData.get("id"));
  const back = `/admin/comercios/${place}`;
  if (!UUID.test(place) || !UUID.test(id) || !canModerate(session))
    redirect(`${back}?error=save#fotos`);
  try {
    const path = await removeImageRow(session.token, place, id);
    const cfg = supabaseConfig();
    const prefix = cfg ? publicImageUrl(cfg.url, "") : null;
    if (cfg && prefix && path.startsWith(prefix)) {
      // Borra también el archivo del bucket.
      await fetch(`${cfg.url}/storage/v1/object/${PLACE_BUCKET}`, {
        method: "DELETE",
        headers: {
          apikey: cfg.key,
          authorization: `Bearer ${session.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ prefixes: [path.slice(prefix.length)] }),
        cache: "no-store",
      });
    }
  } catch (error) {
    console.error("[admin] no se pudo quitar la imagen", error);
    redirect(`${back}?error=save#fotos`);
  }
  updateTag("content");
  redirect(`${back}?guardado=1#fotos`);
}

export async function makeCoverAction(formData: FormData) {
  const session = await staff();
  const place = text(formData.get("lugar"));
  const id = text(formData.get("id"));
  const back = `/admin/comercios/${place}`;
  if (!UUID.test(place) || !UUID.test(id) || !canModerate(session))
    redirect(`${back}?error=save#fotos`);
  try {
    await makeFirstImage(session.token, place, id);
  } catch (error) {
    console.error("[admin] no se pudo cambiar el orden", error);
    redirect(`${back}?error=save#fotos`);
  }
  updateTag("content");
  redirect(`${back}?guardado=1#fotos`);
}

// ── Importar desde la planilla ────────────────────────────────────────────
const MAX_CSV = 1024 * 1024;

export type PlanView = {
  key: string;
  name: string;
  status: PlanItem["status"];
  reason: PlanItem["reason"];
  changed: string[];
  needsCategory: boolean;
  duplicates: number;
  slug: string | null;
  category: CategorySlug | null;
  offer: string;
  locality: string;
};

export type PreviewState =
  | { status: "idle" }
  | { status: "error"; error: "badUrl" | "fetch" | "empty" | "denied" | "file" }
  | {
      status: "ready";
      source: { url: string } | { csv: string };
      items: PlanView[];
      unknownColumns: string[];
    };

export type ApplyState =
  | { status: "idle" }
  | { status: "error"; error: "denied" | "source" }
  | { status: "done"; result: ImportResult };

async function readSource(
  f: FormData,
): Promise<
  | { cells: string[][]; source: { url: string } | { csv: string } }
  | "badUrl"
  | "fetch"
  | "empty"
  | "file"
> {
  const file = f.get("archivo");
  let csv = text(f.get("csv"));
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_CSV) return "file";
    csv = await file.text();
  }
  if (csv) {
    if (csv.length > MAX_CSV) return "file";
    const cells = parseCsv(csv);
    return cells.length > 1 ? { cells, source: { csv } } : "empty";
  }
  const url = text(f.get("planilla"));
  const link = sheetCsvUrl(url);
  if (!link) return "badUrl";
  try {
    const res = await fetch(link, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    // Si la hoja no está compartida con «cualquier persona con el enlace»,
    // Google responde con una página de ingreso, no con el CSV.
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("csv"))
      return "fetch";
    const cells = parseCsv(await res.text());
    return cells.length > 1 ? { cells, source: { url } } : "empty";
  } catch {
    return "fetch";
  }
}

const toView = (
  i: PlanItem,
  labels: { locality: (slug: string | null) => string },
): PlanView => ({
  key: i.key,
  name: i.name,
  status: i.status,
  reason: i.reason,
  changed: i.changed,
  needsCategory: i.needsCategory,
  duplicates: i.duplicates,
  slug: i.existing?.slug ?? null,
  category: i.record?.categorySlug ?? null,
  offer: i.record?.offer ?? "",
  locality:
    i.record?.localityText || labels.locality(i.record?.localitySlug ?? null),
});

export async function previewImport(
  _: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const session = await getSession();
  if (!session || !canModerate(session))
    return { status: "error", error: "denied" };
  const src = await readSource(formData);
  if (typeof src === "string") return { status: "error", error: src };
  const { items, unknownColumns } = await planFromTable(
    session.token,
    readTable(src.cells),
  );
  if ("url" in src.source && session.role === "admin")
    await saveImportSheetUrl(session.token, src.source.url).catch(() => {});
  return {
    status: "ready",
    source: src.source,
    items: items.map((i) => toView(i, { locality: (s) => s ?? "" })),
    unknownColumns,
  };
}

export async function applyImport(
  _: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const session = await getSession();
  if (!session || !canModerate(session))
    return { status: "error", error: "denied" };
  const src = await readSource(formData);
  if (typeof src === "string") return { status: "error", error: "source" };
  // Se vuelve a calcular el plan con los datos de ahora: no se confía en lo
  // que mostró la pantalla.
  const { items } = await planFromTable(session.token, readTable(src.cells));
  const chosen = new Set(formData.getAll("incluir").map(String));
  const categories: Record<string, CategorySlug | undefined> = {};
  for (const it of items) {
    const c = text(formData.get(`cat_${it.key}`)) as CategorySlug;
    if (CATEGORY_DEFS.some((d) => d.slug === c)) categories[it.key] = c;
  }
  const result = await applyPlan(
    session,
    items.filter((i) => chosen.has(i.key)),
    { publish: text(formData.get("publicar")) === "on", categories },
  );
  updateTag("content");
  return { status: "done", result };
}
