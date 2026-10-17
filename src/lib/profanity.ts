/**
 * Filtro básico de groserías e insultos para los comentarios de visitantes.
 * No reemplaza la moderación: solo frena lo evidente antes de publicar.
 * Normaliza tildes, mayúsculas, números usados como letras (3→e, 0→o...) y
 * letras separadas o repetidas («p.u.t.a», «weoooon»). Las palabras con usos
 * normales («perra», «retrasado») no están: esas quedan para la moderación.
 */

const WORDS = [
  // Chile y español general (raíces: cubren plurales y derivados).
  "weon",
  "hueon",
  "huevon",
  "aweonao",
  "ahueonao",
  "conchetumare",
  "conchesumadre",
  "conchatumadre",
  "ctm",
  "csm",
  "culiao",
  "culiado",
  "chucha",
  "pico",
  "raja",
  "puta",
  "puto",
  "maraco",
  "maricon",
  "mierda",
  "cagada",
  "cagar",
  "hijueputa",
  "hijo de puta",
  "imbecil",
  "idiota",
  "estupido",
  "pendejo",
  "gil",
  "saco wea",
  "sacowea",
  "verga",
  "follar",
  "coger",
  "joder",
  "cabron",
  "mongolico",
  "nazi",
  // Inglés común.
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "dick",
];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

/** Texto en minúsculas, sin tildes, con números como letras y sin repeticiones. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[013457@$]/g, (c) => LEET[c] ?? c)
    .replace(/(\p{L})\1+/gu, "$1");
}

const collapse = (w: string) => normalize(w).replace(/[^a-z ]/g, "");

const PATTERNS = WORDS.map((w) => {
  const letters = collapse(w).replace(/ /g, "");
  // Letras de la palabra con separadores opcionales entre ellas («p.u.t.a»).
  const body = letters.split("").join("[^a-z]{0,2}");
  // Las cortas («gil», «pico») solo como palabra completa (o en plural):
  // «Gilberto» pasa.
  const end = letters.length <= 5 ? "(e?s)?([^a-z]|$)" : "";
  return new RegExp(`(^|[^a-z])${body}${end}`, "u");
});

/** `true` si el texto contiene una grosería o insulto de la lista. */
export function hasProfanity(text: string): boolean {
  const t = normalize(text);
  return PATTERNS.some((re) => re.test(t));
}
