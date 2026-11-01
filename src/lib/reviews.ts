/**
 * Comentarios reales de visitantes (tabla `reviews`). Se leen con la clave
 * pública (solo los visibles, por RLS) y se cachean con la etiqueta `reviews`,
 * que se invalida al publicar o moderar.
 */
import { supabaseConfig } from "@/lib/db/content-source";
import type { MediaKind } from "@/lib/media-policy";
import { signedUrls } from "@/lib/storage";

export type ReviewEntity = "place" | "event";
export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  /** Fotos y videos aprobados por el personal, con enlace firmado. */
  media: { kind: MediaKind; url: string }[];
};

export const REVIEWS_TAG = "reviews";

const PARENT: Record<ReviewEntity, string> = {
  place: "places",
  event: "events",
};

/** Comentarios visibles de una ficha publicada, del más nuevo al más viejo. */
export async function listReviews(
  entity: ReviewEntity,
  slug: string,
): Promise<Review[]> {
  const cfg = supabaseConfig();
  if (!cfg) return [];
  const parent = PARENT[entity];
  const query =
    `reviews?select=id,author_name,rating,body,created_at,${parent}!inner(slug),` +
    "media:review_media(path,kind,created_at)" +
    `&${parent}.slug=eq.${encodeURIComponent(slug)}&status=eq.visible` +
    "&order=created_at.desc&limit=100";
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${query}`, {
      headers: { apikey: cfg.key },
      next: { revalidate: 300, tags: [REVIEWS_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = (await res.json()) as {
      id: string;
      author_name: string;
      rating: number;
      body: string;
      created_at: string;
      media?: { path: string; kind: MediaKind; created_at: string }[];
    }[];
    // Solo llegan los aprobados (RLS); se firman en un solo pedido.
    const paths = rows.flatMap((r) => (r.media ?? []).map((m) => m.path));
    const urls = await signedUrls(cfg, paths, {
      init: { next: { revalidate: 300, tags: [REVIEWS_TAG] } },
    }).catch((error) => {
      console.error("[comentarios] No se pudieron firmar los archivos.", error);
      return new Map<string, string>();
    });
    return rows.map((r) => ({
      id: r.id,
      author: r.author_name,
      rating: r.rating,
      text: r.body,
      createdAt: r.created_at,
      media: [...(r.media ?? [])]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .flatMap((m) => {
          const url = urls.get(m.path);
          return url ? [{ kind: m.kind, url }] : [];
        }),
    }));
  } catch (error) {
    console.error("[comentarios] No se pudieron leer.", error);
    return [];
  }
}

/** Promedio y distribución de estrellas. */
export function reviewStats(ratings: number[]) {
  const count = ratings.length;
  const average = count ? ratings.reduce((a, b) => a + b, 0) / count : null;
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: ratings.filter((r) => r === n).length,
  }));
  return { count, average, dist };
}
