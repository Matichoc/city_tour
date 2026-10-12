import { describe, expect, it } from "vitest";
import {
  PLACES,
  getPlace,
  isCategorySlug,
  listPlaces,
  localize,
} from "@/lib/demo-data";

describe("localize", () => {
  it("devuelve inglés si existe", () => {
    expect(localize({ es: "Hola", en: "Hello" }, "en")).toBe("Hello");
  });
  it("cae a español si falta la traducción", () => {
    expect(localize({ es: "Paseo La Terraza" }, "en")).toBe("Paseo La Terraza");
  });
  it("español siempre devuelve español", () => {
    expect(localize({ es: "Hola", en: "Hello" }, "es")).toBe("Hola");
  });
});

describe("datos de demostración", () => {
  it("ninguna ficha está marcada como verificada", () => {
    expect(PLACES.every((p) => p.verification === "pending")).toBe(true);
  });
  it("los slugs son únicos", () => {
    expect(new Set(PLACES.map((p) => p.slug)).size).toBe(PLACES.length);
  });
  it("filtra por categoría y valida el slug", () => {
    expect(listPlaces("playas").length).toBeGreaterThan(0);
    expect(listPlaces("playas").every((p) => p.category === "playas")).toBe(
      true,
    );
    expect(isCategorySlug("nada")).toBe(false);
    expect(getPlace("no-existe")).toBeUndefined();
  });
});
