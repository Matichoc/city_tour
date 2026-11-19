/**
 * «Mi local» con correo y código (migración 0036): Supabase Auth manda un
 * código de 6 dígitos al correo; con él, el locatario queda con una sesión
 * (cookies httpOnly solo para /local) y las funciones de la base le muestran
 * los locales registrados con ese correo. Sin contraseña.
 *
 * Requiere en Supabase: plantilla de correo con {{ .Token }} y, para uso
 * real, un SMTP propio (el correo de prueba de Supabase tiene un tope muy
 * bajo por hora). Ver docs/MI-LOCAL-CORREO.md.
 */
import { supabaseConfig } from "@/lib/db/content-source";
import { needsRefresh, refreshTokens, type Tokens } from "@/lib/admin/auth";
import {
  toOwnerSession,
  type OwnerSession,
  type OwnerValues,
  type RawSession,
  type SubmitResult,
} from "@/lib/owner/access";

export const OWNER_ACCESS_COOKIE = "ml_at";
export const OWNER_REFRESH_COOKIE = "ml_rt";
/** Local elegido cuando el correo administra más de uno. */
export const OWNER_PLACE_COOKIE = "ml_local";
/** Correo al que se mandó el código (para no ponerlo en la dirección). */
export const OWNER_EMAIL_COOKIE = "ml_correo";
/** La sesión por correo dura 30 días sin volver a pedir código. */
export const OWNER_REFRESH_MAX_AGE = 30 * 24 * 3600;

export const ownerCookie = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/local",
  maxAge,
});

export const isEmail = (v: string) =>
  v.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
export const isCode = (v: string) => /^\d{6}$/.test(v);

export type CodeRequest = "ok" | "limit" | "error";

/** Pide a Supabase que mande el código al correo (crea la cuenta si no existe). */
export async function requestOwnerCode(email: string): Promise<CodeRequest> {
  const cfg = supabaseConfig();
  if (!cfg) return "error";
  try {
    const res = await fetch(`${cfg.url}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: cfg.key, "content-type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
      cache: "no-store",
    });
    if (res.ok) return "ok";
    return res.status === 429 ? "limit" : "error";
  } catch {
    return "error";
  }
}

/** Revisa el código: si sirve, devuelve los tokens de la sesión. */
export async function verifyOwnerCode(
  email: string,
  code: string,
): Promise<Tokens | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: cfg.key, "content-type": "application/json" },
      body: JSON.stringify({ type: "email", email, token: code }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<Tokens>;
    return data.access_token && data.refresh_token ? (data as Tokens) : null;
  } catch {
    return null;
  }
}

export { needsRefresh, refreshTokens };

async function userRpc<T>(
  accessToken: string,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; code: string | null }> {
  const cfg = supabaseConfig();
  if (!cfg) return { ok: false, code: null };
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        authorization: `Bearer ${accessToken}`,
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

export type OwnerPlace = { placeId: string; slug: string; name: string };

/** Locales registrados con el correo de la sesión. */
export async function myOwnerPlaces(
  accessToken: string,
): Promise<OwnerPlace[]> {
  const res = await userRpc<{ place_id: string; slug: string; name: string }[]>(
    accessToken,
    "owner_my_places",
    {},
  );
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data.map((r) => ({
    placeId: r.place_id,
    slug: r.slug,
    name: r.name,
  }));
}

export async function getOwnerSessionByEmail(
  accessToken: string,
  placeId: string,
): Promise<OwnerSession | null> {
  const res = await userRpc<RawSession>(accessToken, "owner_session_mine", {
    p_place: placeId,
  });
  return res.ok ? toOwnerSession(res.data) : null;
}

export async function submitOwnerProposalByEmail(
  accessToken: string,
  placeId: string,
  changes: Partial<OwnerValues>,
  name: string,
  note: string | null,
): Promise<SubmitResult> {
  const res = await userRpc<string>(accessToken, "submit_owner_proposal_mine", {
    p_place: placeId,
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
