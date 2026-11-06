// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { signAccess, ACCESS_COOKIE } from "@/lib/share-link";

// Ruta Costera: Salinas de Pullally → Playa de Papudo → Playa Chica.
const STOPS = ["-32.4419,-71.4253", "-32.5052,-71.4486", "-32.5075,-71.4478"];
const STREET = [
  [-71.4253, -32.4419],
  [-71.4301, -32.4602],
  [-71.4402, -32.4873],
  [-71.4486, -32.5052],
  [-71.4478, -32.5075],
];
const OSRM_OK = {
  code: "Ok",
  routes: [
    { distance: 9400, duration: 7200, geometry: { coordinates: STREET } },
  ],
};

let upstream: ReturnType<typeof vi.fn>;
async function load() {
  vi.resetModules();
  return (await import("@/app/api/ruta/paradas/route")).GET;
}
const call = (
  GET: Awaited<ReturnType<typeof load>>,
  mode = "walk",
  stops = STOPS,
  headers: Record<string, string> = {},
) => {
  const q = new URLSearchParams({ mode });
  for (const s of stops) q.append("p", s);
  return GET(
    new NextRequest(`http://localhost/api/ruta/paradas?${q}`, { headers }),
  );
};

beforeEach(() => {
  upstream = vi.fn(async () => Response.json(OSRM_OK));
  vi.stubGlobal("fetch", upstream);
  vi.stubEnv("ROUTING_MIN_INTERVAL_MS", "0");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("/api/ruta/paradas: camino por calles entre paradas", () => {
  it("devuelve el camino por calles que pasa por todas las paradas, en orden", async () => {
    const GET = await load();
    const res = await call(GET);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      mode: "walk",
      distanceMeters: 9400,
      durationSeconds: 7200,
      coordinates: STREET,
    });
    // Un solo pedido con las tres paradas, en orden lon,lat.
    const asked = String(upstream.mock.calls[0]![0]);
    expect(asked).toContain(
      "/route/v1/driving/-71.4253,-32.4419;-71.4486,-32.5052;-71.4478,-32.5075?",
    );
  });

  it("el camino no es la recta entre paradas: trae los puntos de las calles", async () => {
    const GET = await load();
    const body = await (await call(GET)).json();
    expect(body.coordinates.length).toBeGreaterThan(STOPS.length);
  });

  it("entrega el tiempo de cada tramo entre paradas", async () => {
    upstream.mockResolvedValueOnce(
      Response.json({
        code: "Ok",
        routes: [
          {
            ...OSRM_OK.routes[0],
            legs: [
              { distance: 8100.4, duration: 6100.2 },
              { distance: 1299.6, duration: 1099.8 },
            ],
          },
        ],
      }),
    );
    const GET = await load();
    const body = await (await call(GET)).json();
    expect(body.legs).toEqual([
      { distanceMeters: 8100, durationSeconds: 6100 },
      { distanceMeters: 1300, durationSeconds: 1100 },
    ]);
  });

  it("usa el servicio a pie o en auto según el modo", async () => {
    const GET = await load();
    await call(GET, "car");
    expect(String(upstream.mock.calls[0]![0])).toContain("routed-car");
  });

  it("repite una consulta igual sin volver a llamar al servicio", async () => {
    const GET = await load();
    await call(GET);
    await call(GET);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("rechaza pedidos inválidos", async () => {
    const GET = await load();
    expect((await call(GET, "bus")).status).toBe(400);
    expect((await call(GET, "walk", [STOPS[0]!])).status).toBe(400);
    expect((await call(GET, "walk", ["-32.5,abc", STOPS[1]!])).status).toBe(
      400,
    );
    const many = Array.from({ length: 26 }, () => STOPS[1]!);
    expect((await call(GET, "walk", many)).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("solo traza caminos dentro de la comuna (no es un ruteador general)", async () => {
    const GET = await load();
    const res = await call(GET, "walk", ["-33.4489,-70.6693", STOPS[1]!]);
    expect(res.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("si el servicio falla, responde 502 (el mapa no dibuja ninguna línea)", async () => {
    upstream.mockRejectedValueOnce(new Error("caído"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const GET = await load();
    expect((await call(GET)).status).toBe(502);
  });

  it("si no hay camino entre las paradas, responde 404", async () => {
    upstream.mockResolvedValueOnce(Response.json({ code: "NoRoute" }));
    const GET = await load();
    expect((await call(GET)).status).toBe(404);
  });

  it("no acepta llamadas de otros sitios", async () => {
    const GET = await load();
    const res = await call(GET, "walk", STOPS, {
      "sec-fetch-site": "cross-site",
    });
    expect(res.status).toBe(403);
  });

  it("en un sitio cerrado con enlace temporal, exige el enlace vigente", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "clave");
    const GET = await load();
    expect((await call(GET)).status).toBe(401);
    const token = await signAccess("clave", Date.now() + 3_600_000);
    const res = await call(GET, "walk", STOPS, {
      cookie: `${ACCESS_COOKIE}=${encodeURIComponent(token)}`,
    });
    expect(res.status).toBe(200);
  });
});
