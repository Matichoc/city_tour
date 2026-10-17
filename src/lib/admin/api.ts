/**
 * Lecturas y acciones del panel /admin contra la API REST de Supabase, con el
 * token del usuario: la RLS decide qué ve y qué puede cambiar (staff lee todo,
 * incluidos borradores; solo admin/verificador verifican).
 */
import { cookies } from "next/headers";
import { ACCESS_COOKIE, jwtPayload } from "@/lib/admin/auth";
import { supabaseConfig } from "@/lib/db/content-source";

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

async function rest<T>(
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
