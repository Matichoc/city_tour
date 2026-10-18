// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { signAccess, ACCESS_COOKIE } from "@/lib/share-link";

const OSRM_OK = (meters = 841, seconds = 96) => ({
  code: "Ok",
  routes: [
    {
      distance: meters,
      duration: seconds,
      geometry: {
        type: "LineString",
        coordinates: [
          [-71.4478, -32.5075],
          [-71.4475, -32.5069],
          [-71.4466, -32.5066],
        ],
      },
    },
  ],
});

type Fetch = ReturnType<typeof vi.fn>;
let upstream: Fetch;

async function load() {
  vi.resetModules();
  return (await import("@/app/api/ruta/route")).GET;
}
const url = (q: Record<string, string>) =>
  "http://localhost/api/ruta?" + new URLSearchParams(q).toString();
const ok = {
  mode: "walk",
  fromLat: "-32.5088",
  fromLon: "-71.4497",
  toLat: "-32.5075",
  toLon: "-71.4478",
};
const call = (
  GET: Awaited<ReturnType<typeof load>>,
  q: Record<string, string> = ok,
  headers: Record<string, string> = {},
) => GET(new NextRequest(url(q), { headers }));

beforeEach(() => {
  upstream = vi.fn(async () => Response.json(OSRM_OK()));
  vi.stubGlobal("fetch", upstream);
  vi.stubEnv("ROUTING_MIN_INTERVAL_MS", "0");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("/api/ruta: ruta por calles", () => {
  it("devuelve distancia, duración y la línea por calles", async () => {
    const GET = await load();
    const res = await call(GET);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      mode: "walk",
      distanceMeters: 841,
      durationSeconds: 96,
      coordinates: [
        [-71.4478, -32.5075],
        [-71.4475, -32.5069],
        [-71.4466, -32.5066],
      ],
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("usa el servicio a pie o en auto según el modo, con User-Agent propio", async () => {
    const GET = await load();
    await call(GET, { ...ok, mode: "walk" });
    await call(GET, { ...ok, mode: "car", fromLat: "-32.5089" });
    const [walkUrl, walkInit] = upstream.mock.calls[0]!;
    const [carUrl] = upstream.mock.calls[1]!;
    expect(String(walkUrl)).toContain("routed-foot");
    expect(String(carUrl)).toContain("routed-car");
    expect(
      (walkInit as RequestInit & { headers: Record<string, string> }).headers[
        "user-agent"
      ],
    ).toMatch(/Papudo/);
  });

  it("manda las coordenadas redondeadas (origen ~10 m) y en el orden lon,lat", async () => {
    const GET = await load();
    await call(GET, {
      ...ok,
      fromLat: "-32.508812345",
      fromLon: "-71.449712345",
    });
    expect(String(upstream.mock.calls[0]![0])).toContain(
      "/-71.4497,-32.5088;-71.4478,-32.5075?",
    );
  });

  it("repite una consulta igual sin volver a llamar al servicio", async () => {
    const GET = await load();
    await call(GET);
    await call(GET);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("rechaza parámetros inválidos", async () => {
    const GET = await load();
    for (const bad of [
      { ...ok, mode: "bici" },
      { ...ok, fromLat: "abc" },
      { ...ok, toLon: "" },
      { ...ok, fromLat: "95" },
    ]) {
      expect((await call(GET, bad)).status).toBe(400);
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  it("solo traza rutas que llegan a la zona de Papudo (no es un servicio general)", async () => {
    const GET = await load();
    const res = await call(GET, {
      ...ok,
      toLat: "-33.45",
      toLon: "-70.66", // Santiago
    });
    expect(res.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("no acepta orígenes demasiado lejanos", async () => {
    const GET = await load();
    const res = await call(GET, { ...ok, fromLat: "-41.1", fromLon: "-73.0" });
    expect(res.status).toBe(400);
  });

  it("si el servicio de rutas falla, responde 502 sin romper", async () => {
    upstream.mockResolvedValueOnce(new Response("x", { status: 503 }));
    const GET = await load();
    const res = await call(GET);
    expect(res.status).toBe(502);
  });

  it("si el servicio no encuentra camino, responde 404", async () => {
    upstream.mockResolvedValueOnce(Response.json({ code: "NoRoute" }));
    const GET = await load();
    expect((await call(GET)).status).toBe(404);
  });

  it("limita las consultas por persona", async () => {
    const GET = await load();
    let last = 200;
    for (let i = 0; i < 45; i++) {
      const res = await call(
        GET,
        { ...ok, fromLat: (-32.5 - i * 0.0005).toFixed(4) },
        { "x-forwarded-for": "203.0.113.9" },
      );
      last = res.status;
    }
    expect(last).toBe(429);
    // Otra persona no se ve afectada.
    const other = await call(GET, ok, { "x-forwarded-for": "198.51.100.4" });
    expect(other.status).toBe(200);
  });

  it("no acepta llamadas de otros sitios (solo desde esta app)", async () => {
    const GET = await load();
    const res = await call(GET, ok, { "sec-fetch-site": "cross-site" });
    expect(res.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("en un sitio cerrado con enlace temporal, exige el enlace vigente", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "clave");
    const GET = await load();
    expect((await call(GET)).status).toBe(401);
    const token = await signAccess("clave", Date.now() + 3_600_000);
    const res = await call(GET, ok, {
      cookie: `${ACCESS_COOKIE}=${encodeURIComponent(token)}`,
    });
    expect(res.status).toBe(200);
  });

  it("recorta las líneas demasiado largas, conservando inicio y fin", async () => {
    const coordinates = Array.from({ length: 6000 }, (_, i) => [
      -71.45 + i * 1e-5,
      -32.5,
    ]);
    upstream.mockResolvedValueOnce(
      Response.json({
        code: "Ok",
        routes: [{ distance: 5000, duration: 600, geometry: { coordinates } }],
      }),
    );
    const GET = await load();
    const body = await (await call(GET)).json();
    expect(body.coordinates.length).toBeLessThanOrEqual(1500);
    expect(body.coordinates[0]).toEqual(coordinates[0]);
    expect(body.coordinates.at(-1)).toEqual(coordinates.at(-1));
  });

  it("no registra las coordenadas de nadie", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const GET = await load();
    await call(GET);
    upstream.mockResolvedValueOnce(new Response("x", { status: 500 }));
    await call(GET, { ...ok, fromLat: "-32.5090" });
    const printed = JSON.stringify([...log.mock.calls, ...err.mock.calls]);
    expect(printed).not.toMatch(/-32\.50|-71\.44/);
    log.mockRestore();
    err.mockRestore();
  });
});
