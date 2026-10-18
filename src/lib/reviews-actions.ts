"use server";

import { createHash } from "node:crypto";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { supabaseConfig } from "@/lib/db/content-source";
import { hasProfanity } from "@/lib/profanity";
import { REVIEWS_TAG, type ReviewEntity } from "@/lib/reviews";
import { parseMediaMeta } from "@/lib/media-policy";
import { signedUploadUrl } from "@/lib/storage";
import {
  gateSecret,
  reviewBind,
  signProof,
  type ProofAct,
} from "@/lib/review-gate";

export type SubmitState = {
  status:
    | "idle"
    | "ok"
    | "rating"
    | "text"
    | "profanity"
    | "rate"
    | "captcha"
    | "media"
    | "error";
  /** Comentario publicado: id y enlaces para subir sus archivos (en orden). */
  reviewId?: string;
  uploads?: string[];
  /** Se publicó el texto, pero no se pudieron preparar los archivos. */
  mediaFailed?: boolean;
};

const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";

/**
 * Huella anónima del remitente para limitar envíos: hash con sal de la IP.
 * Nunca se guarda la IP, y el navegador (User-Agent) no cuenta: cambiarlo no
 * cambia la huella. La sal (REVIEWS_SALT) es obligatoria; sin ella devuelve
 * null y no se envía nada.
 */
async function senderHash(): Promise<string | null> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim();
  const salt = process.env.REVIEWS_SALT ?? "";
  if (!salt) return null;
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

/** Cloudflare Turnstile: si hay clave secreta, exige y valida el token del formulario. */
async function passesCaptcha(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim();
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return res.ok && data.success === true;
  } catch {
    // Sin respuesta de Cloudflare no se publica (falla cerrado).
    return false;
  }
}

/** Prueba firmada para la acción indicada, o null si falta REVIEW_GATE_SECRET (no se envía nada). */
function proofFor(
  act: ProofAct,
  sender: string,
  bind: string,
): { p_proof: string } | null {
  const secret = gateSecret();
  return secret ? { p_proof: signProof({ act, sender, bind, secret }) } : null;
}

export async function submitReview(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // Campo trampa: las personas no lo ven; los robots lo llenan.
  if (text(formData.get("sitio"))) return { status: "ok" };

  const entity = text(formData.get("entidad")) as ReviewEntity;
  const slug = text(formData.get("slug"));
  const rating = Number(formData.get("estrellas"));
  const body = text(formData.get("texto")).slice(0, 500);
  const author = text(formData.get("nombre")).slice(0, 40);
  if (!["place", "event"].includes(entity) || !slug) return { status: "error" };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: "rating" };
  }
  if (body.length < 5) return { status: "text" };
  if (hasProfanity(body) || hasProfanity(author)) {
    return { status: "profanity" };
  }
  const media = parseMediaMeta(formData.get("archivos"));
  if (!media) return { status: "media" };

  const cfg = supabaseConfig();
  if (!cfg) return { status: "error" };
  const sender = await senderHash();
  if (!sender) {
    console.error(
      "[comentarios] falta REVIEWS_SALT: no se envía el comentario",
    );
    return { status: "error" };
  }
  if (!(await passesCaptcha(text(formData.get("cf-turnstile-response"))))) {
    return { status: "captcha" };
  }
  // El nombre que se envía es el mismo sobre el que se firma la prueba.
  const authorSent = author || text(formData.get("anonimo")) || "Visitante";
  const proof = proofFor(
    "review",
    sender,
    reviewBind({ entity, slug, author: authorSent, rating, body }),
  );
  if (!proof) {
    console.error(
      "[comentarios] falta REVIEW_GATE_SECRET: no se envía el comentario",
    );
    return { status: "error" };
  }
  const res = await fetch(`${cfg.url}/rest/v1/rpc/submit_review_v2`, {
    method: "POST",
    headers: { apikey: cfg.key, "content-type": "application/json" },
    body: JSON.stringify({
      p_entity: entity,
      p_slug: slug,
      p_author: authorSent,
      p_rating: rating,
      p_body: body,
      p_sender_hash: sender,
      ...proof,
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!res?.ok) {
    const detail = res ? await res.text() : "";
    if (detail.includes("54000")) return { status: "rate" };
    console.error("[comentarios] submit_review falló", res?.status, detail);
    return { status: "error" };
  }
  updateTag(REVIEWS_TAG);
  const reviewId = (await res.json()) as string;
  if (media.length === 0) return { status: "ok", reviewId };

  // Archivos: se registran (mismo remitente) y se preparan enlaces de subida.
  try {
    const attachProof = proofFor("media", sender, reviewId);
    if (!attachProof) throw new Error("falta REVIEW_GATE_SECRET");
    const paths = await rpc<string[]>(cfg, "attach_review_media_v2", {
      p_review: reviewId,
      p_sender_hash: sender,
      p_files: media,
      ...attachProof,
    });
    const uploads = await Promise.all(
      paths.map((path) => signedUploadUrl(cfg, path)),
    );
    return { status: "ok", reviewId, uploads };
  } catch (error) {
    console.error("[comentarios] no se pudieron preparar los archivos", error);
    return { status: "ok", reviewId, mediaFailed: true };
  }
}

async function rpc<T>(
  cfg: NonNullable<ReturnType<typeof supabaseConfig>>,
  fn: string,
  args: object,
): Promise<T> {
  const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: cfg.key, "content-type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${fn} ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/**
 * El navegador terminó de subir: lo que llegó al bucket queda pendiente de
 * revisión del personal. Devuelve cuántos archivos quedaron en revisión.
 */
export async function finishReviewMedia(reviewId: string): Promise<number> {
  const cfg = supabaseConfig();
  if (!cfg || !/^[0-9a-f-]{36}$/.test(reviewId)) return 0;
  try {
    const sender = await senderHash();
    if (!sender) return 0;
    const proof = proofFor("finish", sender, reviewId);
    if (!proof) throw new Error("falta REVIEW_GATE_SECRET");
    return await rpc<number>(cfg, "finish_review_media_v2", {
      p_review: reviewId,
      p_sender_hash: sender,
      ...proof,
    });
  } catch (error) {
    console.error("[comentarios] finish_review_media falló", error);
    return 0;
  }
}
