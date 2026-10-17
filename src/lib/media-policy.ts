/**
 * Reglas para fotos y videos de los comentarios. Se comparten entre el
 * navegador (antes de subir) y el servidor (al registrar los archivos).
 */
export const MEDIA_BUCKET = "review-media";
export const MAX_FILES = 4;
export const MAX_VIDEOS = 1;
export const MAX_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;
export const ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(",");

export type MediaKind = "image" | "video";
export const kindOf = (mime: string): MediaKind | null =>
  (IMAGE_TYPES as readonly string[]).includes(mime)
    ? "image"
    : (VIDEO_TYPES as readonly string[]).includes(mime)
      ? "video"
      : null;

/** Clases del detector NSFW.js con su probabilidad (0–1). */
export type Scores = Partial<
  Record<"Drawing" | "Hentai" | "Neutral" | "Porn" | "Sexy", number>
>;

/**
 * ¿Es obsceno? Se bloquea el desnudo explícito (Porn, Hentai). «Sexy» no se
 * bloquea solo: en una guía de playas, un traje de baño es normal; si es muy
 * alto, igual queda marcado para quien revisa.
 */
export function isObscene(s: Scores): boolean {
  const porn = s.Porn ?? 0;
  const hentai = s.Hentai ?? 0;
  return porn >= 0.5 || hentai >= 0.5 || porn + hentai >= 0.6;
}

export const needsAttention = (s: Scores | null | undefined): boolean =>
  !s || isObscene(s) || (s.Sexy ?? 0) >= 0.8 || (s.Porn ?? 0) >= 0.2;

/** Para videos: el peor puntaje de los cuadros revisados. */
export function worst(frames: Scores[]): Scores {
  const out: Scores = {};
  for (const f of frames)
    for (const [k, v] of Object.entries(f) as [keyof Scores, number][])
      out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

export type MediaMeta = { mime: string; size: number; scores: Scores };

/** Valida la lista de archivos que manda el formulario (no se confía en él). */
export function parseMediaMeta(raw: unknown): MediaMeta[] | null {
  if (raw === "" || raw == null) return [];
  let list: unknown;
  try {
    list = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!Array.isArray(list) || list.length > MAX_FILES) return null;
  const out: MediaMeta[] = [];
  for (const item of list) {
    const m = item as Partial<MediaMeta>;
    if (
      typeof m.mime !== "string" ||
      !kindOf(m.mime) ||
      typeof m.size !== "number" ||
      !Number.isInteger(m.size) ||
      m.size < 1 ||
      m.size > MAX_BYTES
    )
      return null;
    const scores: Scores = {};
    for (const k of ["Drawing", "Hentai", "Neutral", "Porn", "Sexy"] as const) {
      const v = (m.scores as Scores | undefined)?.[k];
      if (typeof v === "number" && v >= 0 && v <= 1) scores[k] = v;
    }
    // El navegador ya descarta lo obsceno; si llega igual, se rechaza aquí.
    if (isObscene(scores)) return null;
    out.push({ mime: m.mime, size: m.size, scores });
  }
  if (out.filter((m) => kindOf(m.mime) === "video").length > MAX_VIDEOS)
    return null;
  return out;
}
