/**
 * Acceso del locatario con el enlace personal de su local (migración 0031).
 * Habla con Supabase con la clave pública: las funciones de la base validan
 * el enlace y solo dejan ver y proponer lo de ese local. Nada se publica sin
 * que el personal lo apruebe.
 */
import { supabaseConfig } from "@/lib/db/content-source";

/** Cookie con el enlace del local (httpOnly, solo para /local). */
export const OWNER_COOKIE = "ml_llave";
export const OWNER_COOKIE_MAX_AGE = 365 * 24 * 3600;

/** Campos que el locatario puede proponer, con su largo máximo (igual que la base). */
export const OWNER_FIELDS = {
  short_description: 200,
  full_description: 3000,
  hours_text: 600,
  address: 200,
  cta_kind: 20,
  cta_value: 300,
  instagram: 100,
  website: 300,
} as const;
export type OwnerField = keyof typeof OWNER_FIELDS;
export type OwnerValues = Record<OwnerField, string | null>;

export const CTA_KINDS = [
  "whatsapp",
  "phone",
  "website",
  "menu",
  "booking",
  "instagram",
] as const;
export type OwnerCtaKind = (typeof CTA_KINDS)[number];

export type ProposalStatus = "pending" | "approved" | "rejected";

export type OwnerSession = {
  placeId: string;
  slug: string;
  name: string;
  published: boolean;
  current: OwnerValues;
  last: {
    status: ProposalStatus;
    changes: Partial<OwnerValues>;
    createdAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  } | null;
};

/** El enlace son 24 bytes al azar en hexadecimal. */
export const isOwnerToken = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{48}$/.test(v);

type RpcResult<T> = { ok: true; data: T } | { ok: false; code: string | null };

async function anonRpc<T>(
  fn: string,
  args: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const cfg = supabaseConfig();
  if (!cfg) return { ok: false, code: null };
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        authorization: `Bearer ${cfg.key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) return { ok: false, code: body?.code ?? null };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, code: null };
  }
}

type RawSession = {
  place_id: string;
  slug: string;
  name: string | null;
  published: boolean;
  current: OwnerValues;
  last: {
    status: ProposalStatus;
    changes: Partial<OwnerValues>;
    created_at: string;
    reviewed_at: string | null;
    review_note: string | null;
  } | null;
} | null;

/** Datos del local para su enlace, o null si el enlace no sirve. */
export async function getOwnerSession(
  token: string | undefined,
): Promise<OwnerSession | null> {
  if (!isOwnerToken(token)) return null;
  const res = await anonRpc<RawSession>("owner_session", { p_token: token });
  if (!res.ok || !res.data) return null;
  const s = res.data;
  return {
    placeId: s.place_id,
    slug: s.slug,
    name: s.name ?? s.slug,
    published: s.published,
    current: s.current,
    last: s.last
      ? {
          status: s.last.status,
          changes: s.last.changes,
          createdAt: s.last.created_at,
          reviewedAt: s.last.reviewed_at,
          reviewNote: s.last.review_note,
        }
      : null,
  };
}

export type SubmitResult = "ok" | "invalid" | "expired" | "limit" | "error";

export async function submitOwnerProposal(
  token: string,
  changes: Partial<OwnerValues>,
  name: string,
  note: string | null,
): Promise<SubmitResult> {
  const res = await anonRpc<string>("submit_owner_proposal", {
    p_token: token,
    p_changes: changes,
    p_name: name,
    p_note: note,
  });
  if (res.ok) return "ok";
  if (res.code === "28000") return "expired";
  if (res.code === "22023") return "invalid";
  if (res.code === "54000") return "limit";
  return "error";
}

const clean = (v: FormDataEntryValue | null, max: number): string | null => {
  const s = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
  return s ? s.slice(0, max) : null;
};
const isHttp = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

export type OwnerFormError = "cta" | "ctaValue" | "website" | "instagram";

/** Lee el formulario del locatario y revisa los formatos (la base revisa de nuevo). */
export function readOwnerForm(form: FormData): {
  values: OwnerValues;
  errors: OwnerFormError[];
} {
  const values = Object.fromEntries(
    (Object.keys(OWNER_FIELDS) as OwnerField[]).map((f) => [
      f,
      clean(form.get(f), OWNER_FIELDS[f]),
    ]),
  ) as OwnerValues;
  const errors: OwnerFormError[] = [];
  const kind = values.cta_kind;
  if (kind && !(CTA_KINDS as readonly string[]).includes(kind)) {
    errors.push("cta");
  }
  if (!kind) values.cta_value = null;
  if (kind && !values.cta_value) errors.push("ctaValue");
  if (kind && values.cta_value) {
    const phoneLike = kind === "whatsapp" || kind === "phone";
    const ok = phoneLike
      ? (values.cta_value.match(/\d/g) ?? []).length >= 8
      : isHttp(values.cta_value);
    if (!ok) errors.push("ctaValue");
  }
  if (values.website && !isHttp(values.website)) errors.push("website");
  if (values.instagram && !isHttp(values.instagram)) errors.push("instagram");
  return { values, errors };
}

/** Solo lo que cambió respecto de la ficha actual (el botón va con su valor). */
export function changedFields(
  current: OwnerValues,
  next: OwnerValues,
): Partial<OwnerValues> {
  const out: Partial<OwnerValues> = {};
  for (const f of Object.keys(OWNER_FIELDS) as OwnerField[]) {
    if ((current[f] ?? null) !== (next[f] ?? null)) out[f] = next[f];
  }
  if ("cta_kind" in out || "cta_value" in out) {
    out.cta_kind = next.cta_kind;
    out.cta_value = next.cta_value;
  }
  return out;
}
