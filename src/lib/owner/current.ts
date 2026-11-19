/**
 * Quién está en «Mi local»: con el enlace personal del local (0031) o con su
 * correo y código (0036). Lo usan la página y las acciones.
 */
import { cookies } from "next/headers";
import {
  OWNER_COOKIE,
  getOwnerSession,
  type OwnerSession,
} from "@/lib/owner/access";
import {
  OWNER_ACCESS_COOKIE,
  OWNER_PLACE_COOKIE,
  OWNER_REFRESH_COOKIE,
  getOwnerSessionByEmail,
  myOwnerPlaces,
  needsRefresh,
  type OwnerPlace,
} from "@/lib/owner/email";
import { jwtPayload } from "@/lib/admin/auth";

export type OwnerContext =
  | { kind: "link"; token: string; session: OwnerSession }
  | {
      kind: "email";
      accessToken: string;
      email: string | null;
      places: OwnerPlace[];
      placeId: string | null;
      session: OwnerSession | null;
    }
  /** Hay sesión por correo pero el token de acceso venció: renovarla. */
  | { kind: "expired" }
  | null;

export async function getOwnerContext(): Promise<OwnerContext> {
  const jar = await cookies();
  const token = jar.get(OWNER_COOKIE)?.value;
  if (token) {
    const session = await getOwnerSession(token);
    if (session) return { kind: "link", token, session };
  }
  const at = jar.get(OWNER_ACCESS_COOKIE)?.value;
  const rt = jar.get(OWNER_REFRESH_COOKIE)?.value;
  if (!at && !rt) return null;
  if (!at || needsRefresh(at)) return rt ? { kind: "expired" } : null;

  const places = await myOwnerPlaces(at);
  const chosen = jar.get(OWNER_PLACE_COOKIE)?.value;
  const placeId =
    places.find((p) => p.placeId === chosen)?.placeId ??
    (places.length === 1 ? places[0].placeId : null);
  const session = placeId ? await getOwnerSessionByEmail(at, placeId) : null;
  const email = (jwtPayload(at) as { email?: string }).email ?? null;
  return { kind: "email", accessToken: at, email, places, placeId, session };
}
