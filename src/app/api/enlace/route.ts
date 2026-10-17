import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { ACCESS_PARAM, parseHours, signAccess } from "@/lib/share-link";
import { escapeHtml } from "@/lib/html";
import es from "@/messages/es.json";

/**
 * Crea un enlace temporal: `/api/enlace?horas=4`. El navegador pide usuario y
 * contraseña; la contraseña es `SHARE_LINK_SECRET` (el usuario da igual). Así
 * la clave no queda en la URL ni en los registros.
 */
const sha256 = (s: string) => createHash("sha256").update(s).digest();

function passwordFrom(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const i = decoded.indexOf(":");
  return i === -1 ? null : decoded.slice(i + 1);
}

export async function GET(request: NextRequest) {
  const secret = process.env.SHARE_LINK_SECRET;
  if (!secret) return new Response(null, { status: 404 });

  const password = passwordFrom(request);
  if (password === null || !timingSafeEqual(sha256(password), sha256(secret))) {
    return new Response(es.share.askPassword, {
      status: 401,
      headers: {
        "www-authenticate": 'Basic realm="enlace", charset="UTF-8"',
        "cache-control": "no-store",
      },
    });
  }

  const hours = parseHours(request.nextUrl.searchParams.get("horas"));
  const expiresAt = Date.now() + hours * 3_600_000;
  const url = new URL("/es", request.nextUrl.origin);
  url.searchParams.set(ACCESS_PARAM, await signAccess(secret, expiresAt));
  const expires = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "full",
    timeStyle: "short",
  }).format(expiresAt);

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(es.share.linkTitle)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:10vh auto;padding:0 1rem;color:#0f3b4c;background:#fdf8ef}code{display:block;word-break:break-all;background:#fff;padding:.75rem;border-radius:.5rem;font-size:1rem}</style>
</head><body><h1>${escapeHtml(es.share.linkTitle)}</h1>
<code>${escapeHtml(url.toString())}</code>
<p>${escapeHtml(es.share.linkBody.replace("{expires}", expires))}</p></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
