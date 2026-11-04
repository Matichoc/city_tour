/**
 * Voz natural con Azure AI Speech (API REST, sin librerías). Español de Chile
 * con Catalina; inglés y portugués con voces neurales equivalentes. Nunca se
 * usa la voz del dispositivo: si Azure no está configurado o falla, no hay
 * audio (regla del proyecto: nada de voz robótica).
 */
import type { Locale } from "@/i18n/routing";

export const VOICES: Record<Locale, { voice: string; lang: string }> = {
  es: { voice: "es-CL-CatalinaNeural", lang: "es-CL" },
  en: { voice: "en-US-JennyNeural", lang: "en-US" },
  pt: { voice: "pt-BR-FranciscaNeural", lang: "pt-BR" },
};

/** MP3 mono de 48 kb/s: ~360 KB por minuto, suficiente para voz. */
export const AUDIO_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

export type AzureConfig = { key: string; region: string };

export function azureConfig(
  env: Record<string, string | undefined> = process.env,
): AzureConfig | null {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();
  return key && region ? { key, region } : null;
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** SSML de un texto, con la voz del idioma. */
export function ssml(text: string, locale: Locale): string {
  const v = VOICES[locale];
  return (
    `<speak version="1.0" xml:lang="${v.lang}">` +
    `<voice name="${v.voice}">${escapeXml(text)}</voice></speak>`
  );
}

/** Genera el audio (MP3) de un texto. Lanza un error si Azure no responde. */
export async function synthesize(
  cfg: AzureConfig,
  text: string,
  locale: Locale,
): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://${cfg.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": cfg.key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": AUDIO_FORMAT,
        "User-Agent": "papudo-en-tu-mano",
      },
      body: ssml(text, locale),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!res.ok) throw new Error(`Azure TTS ${res.status}`);
  return res.arrayBuffer();
}
