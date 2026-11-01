/**
 * Lectura en voz alta con la voz del dispositivo (Web Speech API). Funciones
 * puras: el componente `ListenButton` las usa y se prueban sin navegador.
 */

/** Idioma de la voz para cada idioma del sitio (español de Chile primero). */
export const SPEECH_LANG = {
  es: "es-CL",
  en: "en-US",
  pt: "pt-BR",
} as const;

/**
 * Corta el texto en trozos de a lo más `max` caracteres, por oraciones y, si
 * una oración es muy larga, por comas o espacios. Chrome corta en silencio las
 * lecturas largas (~15 s) y pausar a mitad de un trozo no funciona en Android:
 * con trozos cortos se puede pausar y seguir desde el trozo en curso.
 */
export function splitIntoChunks(text: string, max = 200): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) ?? [
    clean,
  ];
  const chunks: string[] = [];
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (sentence.length <= max) {
      chunks.push(sentence);
      continue;
    }
    let rest = sentence;
    while (rest.length > max) {
      const window = rest.slice(0, max);
      const cut = Math.max(
        window.lastIndexOf(", "),
        window.lastIndexOf("; "),
        window.lastIndexOf(": "),
      );
      const at = cut > max / 3 ? cut + 1 : window.lastIndexOf(" ");
      const end = at > 0 ? at : max;
      chunks.push(rest.slice(0, end).trim());
      rest = rest.slice(end).trim();
    }
    if (rest) chunks.push(rest);
  }
  return chunks;
}

export type VoiceLike = Pick<SpeechSynthesisVoice, "lang" | "name">;

const NATURAL = /natural|online|neural|google|premium|enhanced/i;

/**
 * Elige la mejor voz para `lang` (p. ej. "es-CL"): primero la del país, luego
 * cualquiera del mismo idioma (para el español, las latinoamericanas antes que
 * la de España) y, a igualdad, las que suenan más naturales. `null` si el
 * dispositivo no tiene voz en ese idioma.
 */
export function pickVoice<V extends VoiceLike>(
  voices: readonly V[],
  lang: string,
): V | null {
  const want = lang.toLowerCase().replace("_", "-");
  const base = want.split("-")[0];
  const score = (v: V) => {
    const l = v.lang.toLowerCase().replace("_", "-");
    if (l.split("-")[0] !== base) return -1;
    let s = 0;
    if (l === want) s += 100;
    else if (base === "es" && /^es-(419|us|mx|ar|co|pe|cl)/.test(l)) s += 50;
    if (NATURAL.test(v.name)) s += 10;
    return s;
  };
  let best: V | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const s = score(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

/**
 * Una parte de lo que se lee: una ficha entera, o la introducción y cada
 * parada de una ruta. `label` se muestra mientras suena y `targetId` es el
 * elemento de la página que se marca como la parte en curso.
 */
export type ListenSection = {
  segments: string[];
  label?: string;
  targetId?: string;
};

export type QueueItem = { text: string; section: number };

/** Cola de trozos a leer, cada uno con la parte a la que pertenece. */
export function buildQueue(
  sections: readonly ListenSection[],
  max = 200,
): QueueItem[] {
  return sections.flatMap((s, section) =>
    s.segments.flatMap((seg) =>
      splitIntoChunks(seg, max).map((text) => ({ text, section })),
    ),
  );
}

/**
 * Posición en la cola donde empieza la parte anterior (`-1`) o siguiente
 * (`+1`) a la del trozo `at`; `-1` si no hay. Hacia atrás, si ya se avanzó
 * dentro de la parte en curso, vuelve a su comienzo (como un reproductor).
 */
export function jumpSection(
  queue: readonly QueueItem[],
  at: number,
  dir: -1 | 1,
): number {
  const current = queue[at]?.section;
  if (current === undefined) return -1;
  if (dir === 1)
    return queue.findIndex((q, i) => i > at && q.section > current);
  const start = queue.findIndex((q) => q.section === current);
  if (start < at) return start;
  const prev = queue.findLast((q, i) => i < start && q.section < current);
  return prev ? queue.findIndex((q) => q.section === prev.section) : -1;
}

/** Velocidades que ofrece el botón, en orden de rotación. */
export const SPEECH_RATES = [1, 1.25, 0.8] as const;
