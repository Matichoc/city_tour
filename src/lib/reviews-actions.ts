"use server";

import { createHash } from "node:crypto";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { supabaseConfig } from "@/lib/db/content-source";
import { hasProfanity } from "@/lib/profanity";
import { REVIEWS_TAG, type ReviewEntity } from "@/lib/reviews";
import { parseMediaMeta } from "@/lib/media-policy";
import { signedUploadUrl } from "@/lib/storage";

export type SubmitState = {
  status:
    | "idle"
    | "ok"
    | "rating"
    | "text"
    | "profanity"
    | "rate"
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
 * Huella anónima del remitente para limitar envíos: hash con sal de la IP y
 * el navegador. Nunca se guarda la IP.
 */
async function senderHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim();
  const salt = process.env.REVIEWS_SALT ?? process.env.SHARE_LINK_SECRET ?? "";
  return createHash("sha256")
    .update(`${salt}|${ip}|${h.get("user-agent") ?? ""}`)
    .digest("hex");
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
  const res = await fetch(`${cfg.url}/rest/v1/rpc/submit_review`, {
    method: "POST",
    headers: { apikey: cfg.key, "content-type": "application/json" },
    body: JSON.stringify({
      p_entity: entity,
      p_slug: slug,
      p_author: author || formData.get("anonimo") || "Visitante",
      p_rating: rating,
      p_body: body,
      p_sender_hash: sender,
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
    const paths = await rpc<string[]>(cfg, "attach_review_media", {
      p_review: reviewId,
      p_sender_hash: sender,
      p_files: media,
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
    return await rpc<number>(cfg, "finish_review_media", {
      p_review: reviewId,
      p_sender_hash: await senderHash(),
    });
  } catch (error) {
    console.error("[comentarios] finish_review_media falló", error);
    return 0;
  }
}
