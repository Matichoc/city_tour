/**
 * Sesión del panel /admin con Supabase Auth (correo y contraseña), por la API
 * REST y sin librerías. Los tokens viven en cookies httpOnly limitadas a
 * /admin; el proxy renueva el de acceso antes de que venza.
 */
import { supabaseConfig } from "@/lib/db/content-source";

export const ACCESS_COOKIE = "adm_at";
export const REFRESH_COOKIE = "adm_rt";
/** Se renueva el token de acceso si le queda menos que esto (segundos). */
const REFRESH_MARGIN = 60;

export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
  maxAge,
});
/**
 * Cierre por inactividad: la cookie de renovación dura 4 horas y se renueva
 * con cada renovación del token de acceso (cada hora de uso). Sin usar el
 * panel unas 4 horas, la sesión se cierra sola: un computador compartido no
 * queda abierto de un día para otro.
 */
export const REFRESH_MAX_AGE = 4 * 3600;

/** Contenido del JWT de acceso (sin verificar la firma: eso lo hace Supabase). */
export function jwtPayload(token: string): { sub?: string; exp?: number } {
  try {
    const part = token.split(".")[1] ?? "";
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

export function needsRefresh(token: string | undefined, now = Date.now()) {
  const exp = token ? jwtPayload(token).exp : undefined;
  return !exp || exp * 1000 - now < REFRESH_MARGIN * 1000;
}

async function tokenRequest(
  grant: "password" | "refresh_token",
  body: Record<string, string>,
): Promise<Tokens | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const res = await fetch(`${cfg.url}/auth/v1/token?grant_type=${grant}`, {
    method: "POST",
    headers: { apikey: cfg.key, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Partial<Tokens>;
  return data.access_token && data.refresh_token ? (data as Tokens) : null;
}

export const signInWithPassword = (email: string, password: string) =>
  tokenRequest("password", { email, password });

export const refreshTokens = (refreshToken: string) =>
  tokenRequest("refresh_token", { refresh_token: refreshToken });

/** Cierra la sesión en Supabase (invalida el token de renovación). */
export async function signOutRemote(accessToken: string) {
  const cfg = supabaseConfig();
  if (!cfg) return;
  await fetch(`${cfg.url}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: cfg.key, authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => {});
}
