import { describe, expect, it } from "vitest";
import { LOCALITIES, PLACES } from "@/content/papudo-places";
import { ROUTES } from "@/content/papudo-routes";
import { MUNICIPALITY, SPONSOR } from "@/content/catalog";
import {
  getLocality,
  getPlace,
  getRoute,
  isCategorySlug,
  listCategories,
  listPlaces,
  listRoutes,
} from "@/lib/data";
import { addMinutesToClock, formatDuration } from "@/lib/itinerary-format";
import es from "@/messages/es.json";
import en from "@/messages/en.json";

const keys = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" && v ? keys(v, `${p}${k}.`) : [`${p}${k}`],
  );

describe("contenido de Papudo", () => {
  it("todo lugar tiene fuente y coordenadas válidas", () => {
    for (const p of PLACES) {
      expect(p.source, p.slug).toBeDefined();
      expect(p.latitude).toBeLessThan(-32);
      expect(p.latitude).toBeGreaterThan(-33);
      expect(p.longitude).toBeLessThan(-71);
    }
  });
  it("los slugs son únicos", () => {
    expect(new Set(PLACES.map((p) => p.slug)).size).toBe(PLACES.length);
  });
  it("ningún lugar aparece como verificado", () => {
    expect(listPlaces("es").every((p) => p.verification === "pending")).toBe(
      true,
    );
  });
  it("los pueblos referenciados existen", () => {
    const slugs = new Set(LOCALITIES.map((l) => l.slug));
    for (const p of PLACES)
      if (p.localitySlug) expect(slugs.has(p.localitySlug)).toBe(true);
  });
  it("las paradas de las rutas existen", () => {
    const slugs = new Set(PLACES.map((p) => p.slug));
    for (const r of ROUTES)
      for (const s of r.stops) expect(slugs.has(s.slug), s.slug).toBe(true);
    expect(listRoutes("es")[0]!.stops.length).toBe(ROUTES[0]!.stops.length);
  });
});

describe("capa de datos", () => {
  it("cae a español si falta la traducción al inglés", () => {
    const place =
      getPlace("paseo-la-terraza", "en") ?? getPlace("papudo-parque", "en");
    expect(place).toBeDefined();
    const noEn = PLACES.find((p) => !p.en);
    if (noEn) {
      const p = getPlace(noEn.slug, "en")!;
      expect(p.name).toBe(noEn.es.name);
      expect(p.fallbackToSpanish).toBe(true);
    }
  });
  it("traduce al inglés cuando existe", () => {
    expect(getPlace("playa-papudo", "en")!.name).toBe("Papudo Beach");
    expect(getPlace("playa-papudo", "es")!.name).toBe("Playa de Papudo");
  });
  it("filtra por categoría, pueblo y texto sin importar tildes", () => {
    expect(
      listPlaces("es", { category: "playas" }).every(
        (p) => p.categorySlug === "playas",
      ),
    ).toBe(true);
    expect(listPlaces("es", { locality: "pullally" }).length).toBeGreaterThan(
      0,
    );
    expect(listPlaces("es", { query: "laguna" }).map((p) => p.slug)).toContain(
      "papudo-pullally",
    );
    expect(listPlaces("es", { query: "zzz" })).toHaveLength(0);
  });
  it("las categorías vacías cuentan cero (alojamiento, gastronomía)", () => {
    const c = listCategories("es");
    expect(c.find((x) => x.slug === "alojamiento")!.count).toBe(0);
    expect(isCategorySlug("playas")).toBe(true);
    expect(isCategorySlug("nada")).toBe(false);
  });
  it("una ruta devuelve sus paradas en orden", () => {
    const r = getRoute("ruta-costera-papudo", "es")!;
    expect(r.stops.map((s) => s.place.slug)).toEqual(
      ROUTES[0]!.stops.map((s) => s.slug),
    );
  });
});

describe("formato de recorridos", () => {
  it("suma minutos a una hora y pasa de medianoche", () => {
    expect(addMinutesToClock("10:00", 95)).toBe("11:35");
    expect(addMinutesToClock("23:30", 60)).toBe("00:30");
  });
  it("da formato a la duración", () => {
    expect(formatDuration(40)).toBe("40 min");
    expect(formatDuration(95)).toBe("1 h 35 min");
    expect(formatDuration(120)).toBe("2 h");
  });
});

describe("traducciones", () => {
  it("es.json y en.json tienen las mismas claves", () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });
});

describe("completitud respecto de directorio_turistico (auditoría de Papudo)", () => {
  it("incluye todos los lugares de la comuna de Papudo del repo de referencia", () => {
    const esperados = [
      "playa-papudo",
      "playa-chica-papudo",
      "papudo-pullally",
      "papudo-salinas-pullally",
      "papudo-playa-los-lilenes",
      "papudo-parque",
      "papudo-plaza",
    ];
    expect(PLACES.map((p) => p.slug).sort()).toEqual([...esperados].sort());
  });
  it("incluye los tres pueblos de la comuna", () => {
    expect(LOCALITIES.map((l) => l.slug).sort()).toEqual([
      "las-salinas-papudo",
      "papudo",
      "pullally",
    ]);
  });
  it("cada pueblo tiene página y sus lugares", () => {
    expect(getLocality("pullally", "es")!.name).toBe("Pullally");
    expect(listPlaces("es", { locality: "papudo" }).length).toBeGreaterThan(0);
  });
  it("el contacto de la municipalidad incluye sitio, redes, teléfono y correo", () => {
    const kinds = MUNICIPALITY.links.map((l) => l.kind).sort();
    expect(kinds).toEqual(["email", "facebook", "instagram", "phone"]);
    expect(MUNICIPALITY.website).toContain("munipapudo.cl");
  });
  it("Matichoc figura como créditos con su enlace", () => {
    expect(SPONSOR.name).toBe("Matichoc");
    expect(SPONSOR.websiteUrl).toBe("https://www.matichoc.cl");
  });
});
