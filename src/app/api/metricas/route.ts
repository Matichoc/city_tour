import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/db/content-source";
import { gateSecret, metricsBind, signProof } from "@/lib/review-gate";
import { isBot, parseMetricsBody } from "@/lib/metrics";
import { createLimiter } from "@/lib/routing/limits";
import { ACCESS_COOKIE, verifyAccess } from "@/lib/share-link";

/**
 * Recibe las métricas anónimas del sitio (POST desde el navegador, con
 * `navigator.sendBeacon`) y las suma en la base con una prueba firmada: solo
 * este servidor puede contar. Nunca guarda la IP ni datos de la persona.
 * Siempre responde 204: quien envía no necesita saber si se contó.
 */
const allow = createLimiter(60, 60_000);
const done = () =>
  new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

/** Huella anónima para el tope por hora; la base la borra a las 3 horas. */
function senderHash(ip: string, salt: string) {
  return createHash("sha256").update(`${salt}|metric|${ip}`).digest("hex");
}

export async function POST(request: NextRequest) {
  // Solo desde esta misma app.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return done();
  if (isBot(request.headers.get("user-agent"))) return done();

  // En un sitio cerrado con enlace temporal, solo cuenta quien tiene acceso.
  const shareSecret = process.env.SHARE_LINK_SECRET;
  if (
    shareSecret &&
    !(await verifyAccess(
      shareSecret,
      request.cookies.get(ACCESS_COOKIE)?.value,
    ))
  )
    return done();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(ip)) return done();

  const cfg = supabaseConfig();
  const secret = gateSecret();
  const salt = process.env.REVIEWS_SALT ?? "";
  if (!cfg || !secret || !salt) return done();

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > 8000) return done();
    raw = JSON.parse(text);
  } catch {
    return done();
  }
  const body = parseMetricsBody(raw);
  if (!body) return done();

  const sender = senderHash(ip, salt);
  const payload = JSON.stringify(body.events);
  const proof = signProof({
    act: "metric",
    sender,
    bind: metricsBind(payload),
    secret,
  });
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/record_metrics`, {
      method: "POST",
      headers: { apikey: cfg.key, "content-type": "application/json" },
      body: JSON.stringify({
        p_payload: payload,
        p_locale: body.locale,
        p_sender: sender,
        p_proof: proof,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    // Un tope alcanzado (P0001) es normal; lo demás se anota para revisar.
    if (!res.ok && res.status !== 400)
      console.error("[metricas] la base respondió", res.status);
  } catch (error) {
    console.error("[metricas] no se pudo registrar", error);
  }
  return done();
}
