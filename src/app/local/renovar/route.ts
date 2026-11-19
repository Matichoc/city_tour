import { NextResponse, type NextRequest } from "next/server";
import {
  OWNER_ACCESS_COOKIE,
  OWNER_REFRESH_COOKIE,
  OWNER_REFRESH_MAX_AGE,
  ownerCookie,
  refreshTokens,
} from "@/lib/owner/email";

/**
 * Renueva la sesión por correo de «Mi local» (el token de acceso dura una
 * hora; la renovación, 30 días). Si ya no se puede, pide entrar de nuevo.
 */
export async function GET(request: NextRequest) {
  const rt = request.cookies.get(OWNER_REFRESH_COOKIE)?.value;
  const tokens = rt ? await refreshTokens(rt) : null;
  const target = new URL(tokens ? "/local" : "/local/ingresar", request.url);
  if (!tokens) target.searchParams.set("error", "sesion");
  const res = NextResponse.redirect(target, {
    headers: { "cache-control": "no-store" },
  });
  if (tokens) {
    res.cookies.set(
      OWNER_ACCESS_COOKIE,
      tokens.access_token,
      ownerCookie(tokens.expires_in),
    );
    res.cookies.set(
      OWNER_REFRESH_COOKIE,
      tokens.refresh_token,
      ownerCookie(OWNER_REFRESH_MAX_AGE),
    );
  } else {
    res.cookies.delete({ name: OWNER_ACCESS_COOKIE, path: "/local" });
    res.cookies.delete({ name: OWNER_REFRESH_COOKIE, path: "/local" });
  }
  return res;
}
