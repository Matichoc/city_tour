import { NextResponse, type NextRequest } from "next/server";
import {
  OWNER_COOKIE,
  OWNER_COOKIE_MAX_AGE,
  getOwnerSession,
  isOwnerToken,
} from "@/lib/owner/access";

/**
 * Entrada con el enlace del local: valida el código, lo guarda en una cookie
 * (solo para /local) y limpia la dirección para no dejarlo en el historial.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("llave");
  const target = new URL("/local", request.url);
  const session = isOwnerToken(token) ? await getOwnerSession(token) : null;
  if (!session) {
    target.searchParams.set("error", "enlace");
    return NextResponse.redirect(target, {
      headers: { "cache-control": "no-store" },
    });
  }
  const response = NextResponse.redirect(target, {
    headers: { "cache-control": "no-store" },
  });
  response.cookies.set(OWNER_COOKIE, token!, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/local",
    maxAge: OWNER_COOKIE_MAX_AGE,
  });
  return response;
}
