import { describe, expect, it } from "vitest";
import {
  APPROX_PENALTY_KM,
  formatKm,
  nearLocalities,
  nearestLocality,
  rankByNearness,
} from "@/lib/near";

// Centros de los pueblos, como en src/content/papudo-places.ts.
const TOWNS = [
  { slug: "papudo", name: "Papudo", latitude: -32.5069, longitude: -71.4458 },
  {
    slug: "pullally",
    name: "Pullally",
    latitude: -32.4331,
    longitude: -71.3238,
  },
  {
    slug: "las-salinas-papudo",
    name: "Las Salinas",
    latitude: -32.4112,
    longitude: -71.4108,
  },
];

const place = (
  slug: string,
  localitySlug: string | null,
  latitude: number | null = null,
  longitude: number | null = null,
) => ({ slug, localitySlug, latitude, longitude });

describe("rankByNearness", () => {
  const items = [
    place("playa-papudo", "papudo", -32.5061, -71.4472),
    place("caleta-salinas", "las-salinas-papudo", -32.412, -71.411),
    place("restorán-papudo-sin-pin", "papudo"),
    place("almacén-salinas-sin-pin", "las-salinas-papudo"),
    place("sin-pueblo", null),
  ];

  it("en Papudo, lo exacto cercano va antes que lo aproximado", () => {
    const r = rankByNearness(items, TOWNS[0]!, TOWNS);
    expect(r.map((x) => x.item.slug)).toEqual([
      "playa-papudo",
      "restorán-papudo-sin-pin",
      "caleta-salinas",
      "almacén-salinas-sin-pin",
      "sin-pueblo",
    ]);
    expect(r[0]!.approx).toBe(false);
    expect(r[0]!.km).toBeLessThan(0.3);
    expect(r[1]!.approx).toBe(true);
    expect(r[4]!.km).toBeNull();
  });

  it("en Las Salinas, lo de Las Salinas va antes que lo de Papudo", () => {
    const r = rankByNearness(items, TOWNS[2]!, TOWNS);
    expect(r.slice(0, 2).map((x) => x.item.slug)).toEqual([
      "caleta-salinas",
      "almacén-salinas-sin-pin",
    ]);
  });

  it("lo aproximado se mide al centro de su pueblo, con recargo solo para ordenar", () => {
    const r = rankByNearness([items[2]!], TOWNS[0]!, TOWNS);
    expect(r[0]!.km).toBeCloseTo(0, 5);
    expect(APPROX_PENALTY_KM).toBeGreaterThan(0);
  });

  it("a igual distancia respeta el orden sugerido", () => {
    const twins = [place("b", "papudo"), place("a", "papudo")];
    expect(
      rankByNearness(twins, TOWNS[0]!, TOWNS).map((x) => x.item.slug),
    ).toEqual(["b", "a"]);
  });
});

describe("nearestLocality y nearLocalities", () => {
  it("encuentra el pueblo más cercano", () => {
    const n = nearestLocality({ latitude: -32.43, longitude: -71.33 }, TOWNS);
    expect(n?.locality.slug).toBe("pullally");
  });

  it("deja fuera los pueblos sin coordenadas", () => {
    expect(
      nearLocalities([
        { slug: "x", name: "X", latitude: null, longitude: null },
        ...TOWNS,
      ]).map((l) => l.slug),
    ).toEqual(["papudo", "pullally", "las-salinas-papudo"]);
  });
});

describe("formatKm", () => {
  it("redondea metros y kilómetros", () => {
    expect(formatKm(0.012, "es")).toBe("50 m");
    expect(formatKm(0.437, "es")).toBe("450 m");
    expect(formatKm(2.44, "es")).toBe("2,4 km");
    expect(formatKm(23.6, "es")).toBe("24 km");
    expect(formatKm(2.44, "en")).toBe("2.4 km");
  });
});
