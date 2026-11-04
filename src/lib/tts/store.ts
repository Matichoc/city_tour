/**
 * Audios de «Escuchar» en Supabase Storage (bucket público `listen-audio`,
 * migración 0030). Cada archivo se llama por el hash de su voz y su texto:
 * se genera una sola vez y, si el texto cambia (una edición en /admin), se
 * genera uno nuevo. Se sube con la clave PÚBLICA: la base solo acepta nombres
 * firmados con el secreto de los comentarios (REVIEW_GATE_SECRET), así que no
 * hace falta la clave de servicio en Vercel (regla del proyecto).
 */
import { createHash, createHmac } from "node:crypto";
import type { Locale } from "@/i18n/routing";
import {
  AUDIO_FORMAT,
  VOICES,
  synthesize,
  type AzureConfig,
} from "@/lib/tts/azure";

export const LISTEN_BUCKET = "listen-audio";

export type AudioStore = {
  /** URL del proyecto de Supabase (sin /rest/v1). */
  url: string;
  /** Clave pública (anon o sb_publishable_…). */
  anonKey: string;
  /** REVIEW_GATE_SECRET: firma el nombre de cada audio. */
  secret: string;
  azure: AzureConfig;
};

/** Ruta del archivo en el bucket: `es/<hash>.<firma>.mp3`. */
export function audioPath(
  text: string,
  locale: Locale,
  secret: string,
): string {
  const hash = createHash("sha256")
    .update(`${VOICES[locale].voice}|${AUDIO_FORMAT}|${text}`)
    .digest("hex")
    .slice(0, 32);
  const base = `${locale}/${hash}`;
  const sig = createHmac("sha256", secret).update(base).digest("base64url");
  return `${base}.${sig}.mp3`;
}

export const publicAudioUrl = (url: string, path: string) =>
  `${url}/storage/v1/object/public/${LISTEN_BUCKET}/${path}`;

// Rutas que ya se sabe que existen (dentro de esta instancia del servidor).
const known = new Set<string>();

/** URL pública del audio de un texto; lo genera y sube si aún no existe. */
export async function ensureAudio(
  store: AudioStore,
  text: string,
  locale: Locale,
): Promise<string> {
  const path = audioPath(text, locale, store.secret);
  const url = publicAudioUrl(store.url, path);
  if (known.has(path)) return url;
  const head = await fetch(url, {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!head.ok) {
    const audio = await synthesize(store.azure, text, locale);
    const up = await fetch(
      `${store.url}/storage/v1/object/${LISTEN_BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: store.anonKey,
          "content-type": "audio/mpeg",
          "cache-control": "max-age=31536000",
        },
        body: audio,
        signal: AbortSignal.timeout(20_000),
      },
    );
    // Si otro pedido lo subió justo antes, ya existe: está bien.
    if (!up.ok && up.status !== 409 && !/duplicate/i.test(await up.text()))
      throw new Error(`Storage ${up.status}`);
  }
  known.add(path);
  return url;
}
