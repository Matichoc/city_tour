/**
 * Lecturas y acciones del panel /admin contra la API REST de Supabase, con el
 * token del usuario: la RLS decide qué ve y qué puede cambiar (staff lee todo,
 * incluidos borradores; solo admin/verificador verifican).
 */
import { cookies } from "next/headers";
import { ACCESS_COOKIE, jwtPayload } from "@/lib/admin/auth";
import { supabaseConfig } from "@/lib/db/content-source";
import {
  needsAttention,
  type MediaKind,
  type Scores,
} from "@/lib/media-policy";
import { removeObjects, signedUrls } from "@/lib/storage";

export const ENTITIES = ["lugar", "evento", "ruta"] as const;
export type EntityKind = (typeof ENTITIES)[number];

/** Tabla, tabla de traducciones y nombre para verify_entity() de cada tipo. */
const TABLES: Record<
  EntityKind,
  { table: string; translations: string; rpc: string }
> = {
  lugar: { table: "places", translations: "place_translations", rpc: "place" },
  evento: { table: "events", translations: "event_translations", rpc: "event" },
  ruta: { table: "routes", translations: "route_translations", rpc: "route" },
};

/** Dirección de la ficha en el sitio público (en español). */
export function publicPath(
  kind: EntityKind | "localidad",
  slug: string,
): string {
  const base = {
    lugar: "/es/lugares",
    evento: "/es/eventos",
    ruta: "/es/rutas",
    localidad: "/es/pueblos",
  }[kind];
  return `${base}/${encodeURIComponent(slug)}`;
}

export const isEntityKind = (v: string): v is EntityKind =>
  (ENTITIES as readonly string[]).includes(v);

export type Verification = "pending" | "verified" | "outdated";
export const VERIFICATION_STATES: Verification[] = [
  "pending",
  "verified",
  "outdated",
];

export type Session = {
  token: string;
  userId: string;
  role: "admin" | "editor" | "verifier" | "org_manager";
};

export type EntitySummary = {
  id: string;
  slug: string;
  name: string;
  publication: "draft" | "published" | "archived";
  verification: Verification;
  lastVerifiedAt: string | null;
  demo: boolean;
};

export type VerificationLog = {
  previous_status: Verification | null;
  new_status: Verification;
  notes: string | null;
  evidence_url: string | null;
  created_at: string;
};

export type EntityDetail = EntitySummary & {
  sources: { title: string; url: string | null }[];
  logs: VerificationLog[];
};

export async function rest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error("Supabase no está configurado");
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/**
 * Sesión vigente del panel, o `null` si no hay token o la persona no es parte
 * del personal (sin perfil, inactiva o con rol de negocio).
 */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return token ? sessionFor(token) : null;
}

/** Sesión para un token de acceso, según el rol en `profiles`. */
export async function sessionFor(token: string): Promise<Session | null> {
  const userId = jwtPayload(token).sub;
  if (!userId) return null;
  try {
    const role = await rest<Session["role"] | null>(
      token,
      "rpc/current_app_role",
      { method: "POST", body: "{}" },
    );
    return role && role !== "org_manager" ? { token, userId, role } : null;
  } catch {
    return null;
  }
}

export const canVerify = (s: Session) =>
  s.role === "admin" || s.role === "verifier";

type Row = {
  id: string;
  slug: string;
  publication_status: EntitySummary["publication"];
  verification_status: Verification;
  last_verified_at: string | null;
  is_demo?: boolean;
  translations: { locale: string; name: string }[];
};

const summary = (r: Row): EntitySummary => ({
  id: r.id,
  slug: r.slug,
  name: r.translations.find((t) => t.locale === "es")?.name ?? r.slug,
  publication: r.publication_status,
  verification: r.verification_status,
  lastVerifiedAt: r.last_verified_at,
  demo: r.is_demo === true,
});

const columns = (kind: EntityKind) =>
  [
    "id,slug,publication_status,verification_status,last_verified_at",
    kind === "ruta" ? "" : ",is_demo",
    `,translations:${TABLES[kind].translations}(locale,name)`,
  ].join("");

export async function listEntities(
  token: string,
  kind: EntityKind,
): Promise<EntitySummary[]> {
  const rows = await rest<Row[]>(
    token,
    `${TABLES[kind].table}?select=${columns(kind)}&order=sort_order,slug`,
  );
  return rows.map(summary);
}

export async function getEntity(
  token: string,
  kind: EntityKind,
  id: string,
): Promise<EntityDetail | null> {
  const select =
    `${columns(kind)},sources(title,url,sort_order),` +
    "verification_logs(previous_status,new_status,notes,evidence_url,created_at)";
  const rows = await rest<
    (Row & {
      sources: { title: string; url: string | null; sort_order: number }[];
      verification_logs: VerificationLog[];
    })[]
  >(
    token,
    `${TABLES[kind].table}?select=${select}&id=eq.${encodeURIComponent(id)}` +
      "&sources.order=sort_order&verification_logs.order=created_at.desc" +
      "&verification_logs.limit=20",
  );
  const r = rows[0];
  if (!r) return null;
  return {
    ...summary(r),
    sources: r.sources.map(({ title, url }) => ({ title, url })),
    logs: r.verification_logs,
  };
}

export type LocalitySummary = {
  id: string;
  slug: string;
  name: string;
  hasLocation: boolean;
  placeCount: number;
  source: { url: string; label: string } | null;
};

export async function listLocalities(
  token: string,
): Promise<LocalitySummary[]> {
  const rows = await rest<
    {
      id: string;
      slug: string;
      latitude: number | null;
      source_url: string | null;
      source_label: string | null;
      translations: { locale: string; name: string }[];
      places: { count: number }[];
    }[]
  >(
    token,
    "localities?select=id,slug,latitude,source_url,source_label," +
      "translations:locality_translations(locale,name),places(count)" +
      "&order=sort_order,slug",
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: nameEs(r.translations, r.slug),
    hasLocation: r.latitude !== null,
    placeCount: r.places[0]?.count ?? 0,
    source: r.source_url
      ? { url: r.source_url, label: r.source_label ?? r.source_url }
      : null,
  }));
}

/** Cambia el estado de verificación con verify_entity() (deja registro). */
export async function verifyEntity(
  token: string,
  kind: EntityKind,
  id: string,
  status: Verification,
  notes: string | null,
  evidenceUrl: string | null,
) {
  await rest<null>(token, "rpc/verify_entity", {
    method: "POST",
    body: JSON.stringify({
      p_entity: TABLES[kind].rpc,
      p_id: id,
      p_status: status,
      p_notes: notes,
      p_evidence_url: evidenceUrl,
    }),
  });
}

// ── Comentarios ───────────────────────────────────────────────────────────
export type ReviewFilter = "todos" | "visibles" | "ocultos" | "archivos";
export const REVIEW_FILTERS: ReviewFilter[] = [
  "todos",
  "visibles",
  "ocultos",
  "archivos",
];

export type MediaStatus = "uploading" | "pending" | "approved" | "rejected";
export type AdminMedia = {
  id: string;
  path: string;
  kind: MediaKind;
  status: MediaStatus;
  /** Enlace firmado (corto) para verlo en el panel. */
  url: string | null;
  /** El detector marcó algo dudoso, o no hay puntaje. */
  attention: boolean;
};

export type AdminReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  status: "visible" | "hidden";
  createdAt: string;
  /** Ficha comentada: tipo para el sitio público, slug y nombre en español. */
  target: { kind: "lugar" | "evento"; slug: string; name: string } | null;
  media: AdminMedia[];
};

type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  status: AdminReview["status"];
  created_at: string;
  place: { slug: string; translations: Row["translations"] } | null;
  event: { slug: string; translations: Row["translations"] } | null;
  media: {
    id: string;
    path: string;
    kind: MediaKind;
    status: MediaStatus;
    ai_scores: Scores | null;
    created_at: string;
  }[];
};

const nameEs = (tr: Row["translations"], slug: string) =>
  tr.find((t) => t.locale === "es")?.name ?? slug;

export async function listReviewsAdmin(
  token: string,
  filter: ReviewFilter,
): Promise<AdminReview[]> {
  const status =
    filter === "visibles"
      ? "&status=eq.visible"
      : filter === "ocultos"
        ? "&status=eq.hidden"
        : "";
  // «archivos»: solo comentarios con fotos o videos por revisar.
  const media =
    filter === "archivos"
      ? "pending_media:review_media!inner(id),media:review_media(id,path,kind,status,ai_scores,created_at)" +
        "&pending_media.status=eq.pending"
      : "media:review_media(id,path,kind,status,ai_scores,created_at)";
  const rows = await rest<ReviewRow[]>(
    token,
    "reviews?select=id,author_name,rating,body,status,created_at," +
      "place:places(slug,translations:place_translations(locale,name))," +
      "event:events(slug,translations:event_translations(locale,name))," +
      `${media}${status}&order=created_at.desc&limit=200`,
  );
  const cfg = supabaseConfig()!;
  const visible = rows.flatMap((r) =>
    r.media
      .filter((m) => m.status === "pending" || m.status === "approved")
      .map((m) => m.path),
  );
  const urls = await signedUrls(cfg, visible, {
    token,
    expiresIn: 3600,
    init: { cache: "no-store" },
  }).catch((error) => {
    console.error("[admin] no se pudieron firmar los archivos", error);
    return new Map<string, string>();
  });
  return rows.map((r) => ({
    id: r.id,
    author: r.author_name,
    rating: r.rating,
    text: r.body,
    status: r.status,
    createdAt: r.created_at,
    target: r.place
      ? {
          kind: "lugar",
          slug: r.place.slug,
          name: nameEs(r.place.translations, r.place.slug),
        }
      : r.event
        ? {
            kind: "evento",
            slug: r.event.slug,
            name: nameEs(r.event.translations, r.event.slug),
          }
        : null,
    media: [...r.media]
      .filter((m) => m.status !== "uploading")
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((m) => ({
        id: m.id,
        path: m.path,
        kind: m.kind,
        status: m.status,
        url: urls.get(m.path) ?? null,
        attention: needsAttention(m.ai_scores),
      })),
  }));
}

/** Aprueba o rechaza un archivo; al rechazar, el archivo se borra del bucket. */
export async function setMediaStatus(
  session: Session,
  id: string,
  status: "approved" | "rejected",
) {
  const [row] = await rest<{ path: string }[]>(
    session.token,
    `review_media?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        status,
        moderated_by: session.userId,
        moderated_at: new Date().toISOString(),
      }),
    },
  );
  if (!row) throw new Error("archivo no encontrado o sin permiso");
  if (status === "rejected")
    await removeObjects(supabaseConfig()!, session.token, [row.path]);
}

export const canModerate = (s: Session) =>
  s.role === "admin" || s.role === "editor";
export const canDeleteReviews = (s: Session) => s.role === "admin";

export async function setReviewStatus(
  session: Session,
  id: string,
  status: AdminReview["status"],
) {
  await rest<null>(session.token, `reviews?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      moderated_by: session.userId,
      moderated_at: new Date().toISOString(),
    }),
  });
}

export async function deleteReview(session: Session, id: string) {
  // Primero sus archivos: al borrar el comentario, sus filas se van en cascada.
  const media = await rest<{ path: string }[]>(
    session.token,
    `review_media?select=path&review_id=eq.${encodeURIComponent(id)}`,
  );
  await removeObjects(
    supabaseConfig()!,
    session.token,
    media.map((m) => m.path),
  );
  await rest<null>(session.token, `reviews?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ── Comercios: botón de acción, avisos y configuración ───────────────────
export const CTA_KINDS = [
  "whatsapp",
  "phone",
  "website",
  "menu",
  "booking",
  "instagram",
] as const;
export type CtaKindAdmin = (typeof CTA_KINDS)[number];

export type BusinessPlace = {
  id: string;
  slug: string;
  name: string;
  ctaKind: CtaKindAdmin | null;
  ctaValue: string | null;
  /** Última vez que el comercio confirmó sus datos (ISO). */
  infoUpdatedAt: string | null;
};

export async function listBusinessPlaces(
  token: string,
): Promise<BusinessPlace[]> {
  const rows = await rest<
    (Row & {
      cta_kind: CtaKindAdmin | null;
      cta_value: string | null;
      info_updated_at: string | null;
    })[]
  >(
    token,
    "places?select=id,slug,cta_kind,cta_value,info_updated_at,translations:place_translations(locale,name)" +
      "&is_business=eq.true&is_demo=eq.false&order=sort_order,slug",
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: nameEs(r.translations, r.slug),
    ctaKind: r.cta_kind,
    ctaValue: r.cta_value,
    infoUpdatedAt: r.info_updated_at,
  }));
}

/** Registra que el comercio confirmó o actualizó sus datos hoy. */
export async function markInfoUpdated(token: string, id: string) {
  await rest<null>(token, `places?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ info_updated_at: new Date().toISOString() }),
  });
}

export async function updatePlaceCta(
  token: string,
  id: string,
  kind: CtaKindAdmin | null,
  value: string | null,
) {
  await rest<null>(token, `places?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ cta_kind: kind, cta_value: value }),
  });
}

export type AdminNotice = {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
  /** Ya pasó su fecha de término. */
  expired: boolean;
  placeName: string | null;
};

export async function listNoticesAdmin(token: string): Promise<AdminNotice[]> {
  const rows = await rest<
    {
      id: string;
      title: string;
      body: string | null;
      link_url: string | null;
      starts_at: string;
      ends_at: string;
      active: boolean;
      place: { slug: string; translations: Row["translations"] } | null;
    }[]
  >(
    token,
    "notices?select=id,title,body,link_url,starts_at,ends_at,active," +
      "place:places(slug,translations:place_translations(locale,name))" +
      "&order=ends_at.desc&limit=100",
  );
  const now = Date.now();
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    linkUrl: r.link_url,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    active: r.active,
    expired: Date.parse(r.ends_at) <= now,
    placeName: r.place ? nameEs(r.place.translations, r.place.slug) : null,
  }));
}

export async function createNotice(
  session: Session,
  notice: {
    placeId: string | null;
    title: string;
    body: string | null;
    linkUrl: string | null;
    endsAt: string;
  },
) {
  await rest<null>(session.token, "notices", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      place_id: notice.placeId,
      title: notice.title,
      body: notice.body,
      link_url: notice.linkUrl,
      ends_at: notice.endsAt,
      created_by: session.userId,
    }),
  });
}

export async function setNoticeActive(
  token: string,
  id: string,
  active: boolean,
) {
  await rest<null>(token, `notices?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export async function deleteNotice(token: string, id: string) {
  await rest<null>(token, `notices?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type AdminSettings = {
  businessFormUrl: string | null;
  businessInvite: boolean;
};

export async function getSettingsAdmin(token: string): Promise<AdminSettings> {
  const rows = await rest<
    { business_form_url: string | null; business_invite: boolean }[]
  >(token, "site_settings?select=business_form_url,business_invite");
  const r = rows[0];
  return {
    businessFormUrl: r?.business_form_url ?? null,
    businessInvite: r?.business_invite ?? true,
  };
}

export async function updateSettings(token: string, s: AdminSettings) {
  await rest<null>(token, "site_settings?id=eq.true", {
    method: "PATCH",
    body: JSON.stringify({
      business_form_url: s.businessFormUrl,
      business_invite: s.businessInvite,
    }),
  });
}
