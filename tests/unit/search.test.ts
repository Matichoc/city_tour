import { describe, expect, it } from "vitest";
import { STATIC_CONTENT } from "@/content";
import { createData } from "@/lib/data";
import { locales } from "@/i18n/routing";
import es from "@/messages/es.json";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

const { listPlaces } = createData(STATIC_CONTENT, true);
const messages = { es, en, pt } as const;

describe("sugerencias del buscador", () => {
  for (const locale of locales) {
    it(`${locale}: cada ejemplo sugerido devuelve resultados`, () => {
      const s = messages[locale].search;
      const examples = [s.example1, s.example2, s.example3, s.example4];
      for (const q of examples) {
        expect(
          listPlaces(locale, { query: q }).length,
          `«${q}» en ${locale}`,
        ).toBeGreaterThan(0);
      }
    });
  }

  it("el nombre de la categoría también cuenta al buscar", () => {
    const names = listPlaces("es", { query: "gastronomía" });
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((p) => p.categorySlug === "gastronomia")).toBe(true);
  });
});
