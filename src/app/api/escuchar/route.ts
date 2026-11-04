import type { NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getData } from "@/lib/data";
import { supabaseConfig } from "@/lib/db/content-source";
import { ACCESS_COOKIE, verifyAccess } from "@/lib/share-link";
import { createLimiter } from "@/lib/routing/limits";
import { placeListen, routeListen } from "@/lib/listen-text";
import { azureConfig } from "@/lib/tts/azure";
import { ensureAudio } from "@/lib/tts/store";

/**
 * Audios de «Escuchar» con voz natural: `/api/escuchar?tipo=lugar&slug=…&locale=es`
 * devuelve un audio por parte (la ficha entera, o la presentación y cada
 * parada de una ruta). El texto lo arma el servidor desde los datos: nadie
 * puede pedir que se lea otra cosa. Cada audio se genera una sola vez.
 */
const allow = createLimiter(30, 60_000);
const noStore = { "cache-control": "no-store" };
const fail = (status: number, error: string) =>
  Response.json({ error }, { status, headers: noStore });

export async function GET(request: NextRequest) {
  // Solo desde esta misma app (no como servicio para otros sitios).
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    return fail(403, "forbidden");

  // En un sitio cerrado con enlace temporal, el audio también lo exige.
  const secret = process.env.SHARE_LINK_SECRET;
  if (
    secret &&
    !(await verifyAccess(secret, request.cookies.get(ACCESS_COOKIE)?.value))
  )
    return fail(401, "unauthorized");

  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(client)) return fail(429, "rate-limited");

  const azure = azureConfig();
  const supabase = supabaseConfig();
  // El mismo secreto de los comentarios firma el nombre de cada audio.
  const gateSecret = process.env.REVIEW_GATE_SECRET?.trim();
  if (!azure || !supabase || !gateSecret || gateSecret.length < 32)
    return fail(503, "not-configured");

  const params = request.nextUrl.searchParams;
  const kind = params.get("tipo");
  const slug = params.get("slug") ?? "";
  const locale = params.get("locale") ?? "";
  if (!hasLocale(routing.locales, locale) || !/^[a-z0-9-]{1,80}$/.test(slug))
    return fail(400, "invalid");

  const data = await getData();
  const sections =
    kind === "lugar"
      ? await (async () => {
          const place = data.getPlace(slug, locale);
          return place ? placeListen(place, locale) : null;
        })()
      : kind === "ruta"
        ? await (async () => {
            const route = data.getRoute(slug, locale);
            return route ? routeListen(route, locale) : null;
          })()
        : null;
  if (!sections) return fail(404, "not-found");

  try {
    const store = {
      url: supabase.url,
      anonKey: supabase.key,
      secret: gateSecret,
      azure,
    };
    const urls = await Promise.all(
      sections.map((s) => ensureAudio(store, s.segments.join(" "), locale)),
    );
    return Response.json(
      { sections: urls.map((url) => ({ url })) },
      { headers: { "cache-control": "private, max-age=300" } },
    );
  } catch {
    console.error("escuchar: no se pudo generar o guardar el audio");
    return fail(502, "upstream");
  }
}
