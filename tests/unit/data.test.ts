import { describe, expect, it } from "vitest";
import { LOCALITIES, PLACES } from "@/content/papudo-places";
import { ROUTES } from "@/content/papudo-routes";
import { MUNICIPALITY, SPONSOR } from "@/content/catalog";
import {
  getLocality,
  getPlace,
  isLocated,
  getRoute,
  canonicalCategory,
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
  it("todo lugar tiene fuente, y coordenadas válidas cuando las tiene", () => {
    for (const p of PLACES) {
      expect(p.source, p.slug).toBeDefined();
      expect(p.latitude === null, p.slug).toBe(p.longitude === null);
      if (p.latitude !== null && p.longitude !== null) {
        expect(p.latitude).toBeLessThan(-32);
        expect(p.latitude).toBeGreaterThan(-33);
        expect(p.longitude).toBeLessThan(-71);
      }
    }
  });
  it("los lugares agregados desde la web tienen al menos dos fuentes", () => {
    for (const p of listPlaces("es").filter((x) => !x.hasLocation)) {
      expect(p.sources.length, p.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("los locales de muestra están marcados como comercio local", () => {
    const negocios = listPlaces("es")
      .filter((p) => p.business)
      .map((p) => p.slug);
    expect(negocios.sort()).toEqual([
      "fuente-papudo",
      "hotel-carande",
      "restaurante-donde-pablo",
      "roots-salinas",
    ]);
  });
  it("el Santuario de Pullally cita el decreto de 2021 y la fuente oficial", () => {
    for (const slug of ["papudo-pullally", "papudo-salinas-pullally"]) {
      const p = getPlace(slug, "es")!;
      expect(p.shortDescription).toContain("2021");
      expect(p.shortDescription).not.toContain("2020");
      expect(
        p.sources.some((s) => s.url.includes("monumentos.gob.cl")),
        slug,
      ).toBe(true);
    }
  });
  it("solo los lugares con coordenada entran al mapa y a los recorridos", () => {
    const sinUbicacion = listPlaces("es").filter((p) => !isLocated(p));
    expect(sinUbicacion.length).toBeGreaterThan(0);
    expect(sinUbicacion.every((p) => p.latitude === null)).toBe(true);
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
      listPlaces("es", { category: "balneario" }).every(
        (p) => p.categorySlug === "balneario",
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
  it("cuenta lugares por categoría (deportes aún vacía)", () => {
    const c = listCategories("es");
    expect(c.find((x) => x.slug === "deportes")!.count).toBe(0);
    expect(c.find((x) => x.slug === "alojamiento")!.count).toBe(1);
    expect(isCategorySlug("balneario")).toBe(true);
    expect(isCategorySlug("nada")).toBe(false);
  });
  it("las categorías del PLADETUR son los seis productos más alojamiento", () => {
    expect(listCategories("es").map((c) => c.slug)).toEqual([
      "balneario",
      "recreacion",
      "deportes",
      "patrimonio",
      "gastronomia",
      "ruralidad",
      "alojamiento",
    ]);
  });
  it("los nombres anteriores de categoría siguen resolviendo", () => {
    expect(canonicalCategory("playas")).toBe("balneario");
    expect(canonicalCategory("naturaleza")).toBe("ruralidad");
    expect(canonicalCategory("actividades")).toBe("recreacion");
    expect(canonicalCategory("balneario")).toBe("balneario");
    expect(canonicalCategory("nada")).toBeNull();
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
    const slugs = PLACES.map((p) => p.slug);
    for (const e of esperados) expect(slugs, e).toContain(e);
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
  it("el contacto de la municipalidad solo tiene datos con fuente", () => {
    expect(MUNICIPALITY.links.map((l) => l.kind)).toEqual(["phone"]);
    expect(MUNICIPALITY.website).toContain("munipapudo.cl");
    expect(MUNICIPALITY.sources.length).toBeGreaterThanOrEqual(2);
  });
  it("Matichoc figura como créditos con su enlace", () => {
    expect(SPONSOR.name).toBe("Matichoc");
    expect(SPONSOR.websiteUrl).toBe("https://www.matichoc.cl");
  });
});

describe("portada de la ruta", () => {
  it("la ruta costera tiene ilustración con texto alternativo en ambos idiomas", () => {
    const es = getRoute("ruta-costera-papudo", "es")!.cover!;
    const en = getRoute("ruta-costera-papudo", "en")!.cover!;
    expect(es.src).toBe("/rutas/ruta-costera-papudo.webp");
    expect(es.alt).not.toBe(en.alt);
    expect(es.alt.length).toBeGreaterThan(20);
  });
});

describe("ilustraciones", () => {
  it("todo lugar tiene ilustración y el archivo existe", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    for (const p of listPlaces("es")) {
      expect(p.picture.alt.length, p.slug).toBeGreaterThan(20);
      expect(
        existsSync(join(process.cwd(), "public", p.picture.src)),
        p.picture.src,
      ).toBe(true);
    }
  });
  it("las escenas específicas se asignan a su lugar", () => {
    expect(getPlace("papudo-plaza", "es")!.picture.src).toContain("plaza");
    expect(getPlace("papudo-pullally", "es")!.picture.src).toContain("humedal");
    expect(getPlace("papudo-parque", "es")!.picture.src).toContain("paseo");
    expect(getPlace("playa-chica-papudo", "es")!.picture.src).toContain(
      "playa",
    );
  });
  it("el texto alternativo cambia con el idioma", () => {
    expect(getPlace("playa-papudo", "en")!.picture.alt).not.toBe(
      getPlace("playa-papudo", "es")!.picture.alt,
    );
  });
});
