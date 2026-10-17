import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { ACCESS_COOKIE, ACCESS_PARAM, verifyAccess } from "@/lib/share-link";
import { escapeHtml } from "@/lib/html";
import es from "@/messages/es.json";

const intl = createMiddleware(routing);

function expiredPage() {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(es.share.expiredTitle)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;color:#0f3b4c;background:#fdf8ef}h1{font-size:1.5rem}</style>
</head><body><h1>${escapeHtml(es.share.expiredTitle)}</h1><p>${escapeHtml(es.share.expiredBody)}</p></body></html>`;
  return new NextResponse(html, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/**
 * Con `SHARE_LINK_SECRET` (solo en vistas previas) el sitio se ve únicamente
 * con un enlace vigente (src/lib/share-link.ts). Sin esa variable, como siempre.
 */
export default async function proxy(request: NextRequest) {
  const secret = process.env.SHARE_LINK_SECRET;
  if (!secret) return intl(request);

  const fromUrl = request.nextUrl.searchParams.get(ACCESS_PARAM);
  if (fromUrl !== null) {
    const expiresAt = await verifyAccess(secret, fromUrl);
    if (!expiresAt) return expiredPage();
    // Se guarda en una cookie y se limpia la dirección para no reenviar el código.
    const clean = request.nextUrl.clone();
    clean.searchParams.delete(ACCESS_PARAM);
    const response = NextResponse.redirect(clean);
    response.cookies.set(ACCESS_COOKIE, fromUrl, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      // El del equipo no vence: la cookie dura lo máximo que aceptan los
      // navegadores (400 días); abrir el enlace de nuevo la renueva.
      ...(expiresAt === Infinity
        ? { maxAge: 400 * 24 * 3600 }
        : { expires: new Date(expiresAt) }),
    });
    return response;
  }

  if (await verifyAccess(secret, request.cookies.get(ACCESS_COOKIE)?.value)) {
    return intl(request);
  }
  return expiredPage();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
