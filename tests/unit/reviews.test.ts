import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      "x-forwarded-for": "200.1.2.3, 10.0.0.1",
      "user-agent": "Prueba",
    }),
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => void jar.set(name, value),
    delete: () => {},
  }),
}));
class Redirect extends Error {
  constructor(public to: string) {
    super(to);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Redirect(to);
  },
}));
const updateTag = vi.fn();
vi.mock("next/cache", () => ({
  updateTag: (...a: unknown[]) => updateTag(...a),
  revalidateTag: vi.fn(),
}));

import { submitReview } from "@/lib/reviews-actions";
import { moderateReview } from "@/app/admin/actions";
import { reviewStats } from "@/lib/reviews";

type Call = { url: string; init: RequestInit };
let calls: Call[];
const stubFetch = (handler: (url: string, init: RequestInit) => Response) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      return handler(url, init);
    }),
  );
const form = (d: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(d)) f.set(k, v);
  return f;
};
const idle = { status: "idle" as const };
const valid = {
  entidad: "place",
  slug: "playa-papudo",
  estrellas: "5",
  texto: "Muy linda la playa",
  nombre: "Ana",
};

beforeEach(() => {
  calls = [];
  jar.clear();
  updateTag.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-publica");
  vi.stubEnv("REVIEWS_SALT", "sal");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("submitReview", () => {
  it("valida estrellas, texto y groserías sin llamar a la base", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    expect(
      await submitReview(idle, form({ ...valid, estrellas: "0" })),
    ).toEqual({ status: "rating" });
    expect(await submitReview(idle, form({ ...valid, texto: "ok" }))).toEqual({
      status: "text",
    });
    expect(
      await submitReview(
        idle,
        form({ ...valid, texto: "qué weón el que atiende" }),
      ),
    ).toEqual({ status: "profanity" });
    expect(
      await submitReview(idle, form({ ...valid, nombre: "conchetumare" })),
    ).toEqual({ status: "profanity" });
    expect(calls).toHaveLength(0);
  });

  it("el campo trampa descarta robots en silencio", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    expect(
      await submitReview(idle, form({ ...valid, sitio: "http://spam" })),
    ).toEqual({ status: "ok" });
    expect(calls).toHaveLength(0);
  });

  it("publica con submit_review, sin enviar la IP, y refresca el sitio", async () => {
    stubFetch(() => Response.json("id"));
    expect(await submitReview(idle, form(valid))).toEqual({
      status: "ok",
      reviewId: "id",
    });
    const body = JSON.parse(calls[0]!.init.body as string);
    expect(calls[0]!.url).toBe(
      "https://demo.supabase.co/rest/v1/rpc/submit_review",
    );
    expect(body).toMatchObject({
      p_entity: "place",
      p_slug: "playa-papudo",
      p_author: "Ana",
      p_rating: 5,
      p_body: "Muy linda la playa",
    });
    expect(body.p_sender_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(body)).not.toContain("200.1.2.3");
    expect(updateTag).toHaveBeenCalledWith("reviews");
  });

  it("sin nombre usa «Visitante» en el idioma del formulario", async () => {
    stubFetch(() => Response.json("id"));
    await submitReview(
      idle,
      form({ ...valid, nombre: "", anonimo: "Visitor" }),
    );
    expect(JSON.parse(calls[0]!.init.body as string).p_author).toBe("Visitor");
  });

  it("informa el límite de envíos", async () => {
    stubFetch(() => new Response('{"code":"54000"}', { status: 400 }));
    expect(await submitReview(idle, form(valid))).toEqual({ status: "rate" });
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("moderateReview", () => {
  const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
  const jwt = btoa(
    JSON.stringify({ sub: "571fa05b-3e1a-4c56-bfb1-8928608f82b0", exp: 9e9 }),
  ).replace(/=+$/, "");
  const role = (r: string) => (url: string) =>
    url.includes("current_app_role")
      ? Response.json(r)
      : url.includes("review_media?select=")
        ? Response.json([{ path: "id/foto.jpg" }])
        : new Response(null, { status: 204 });
  const run = (d: Record<string, string>) =>
    moderateReview(form(d)).then(
      () => null,
      (e) => (e instanceof Redirect ? e.to : Promise.reject(e)),
    );

  it("un editor oculta pero no borra", async () => {
    jar.set("adm_at", `x.${jwt}.y`);
    stubFetch(role("editor"));
    expect(await run({ id: ID, accion: "borrar", filtro: "todos" })).toBe(
      "/admin/comentarios?filtro=todos&error=1",
    );
    expect(await run({ id: ID, accion: "ocultar", filtro: "todos" })).toBe(
      "/admin/comentarios?filtro=todos&guardado=1",
    );
    const patch = calls.find((c) => c.init.method === "PATCH")!;
    expect(patch.url).toContain(`reviews?id=eq.${ID}`);
    expect(JSON.parse(patch.init.body as string)).toMatchObject({
      status: "hidden",
    });
    expect(updateTag).toHaveBeenCalledWith("reviews");
  });

  it("un admin borra", async () => {
    jar.set("adm_at", `x.${jwt}.y`);
    stubFetch(role("admin"));
    expect(await run({ id: ID, accion: "borrar", filtro: "ocultos" })).toBe(
      "/admin/comentarios?filtro=ocultos&guardado=1",
    );
    // Primero el archivo en Storage, después el comentario.
    const deletes = calls.filter((c) => c.init.method === "DELETE");
    expect(deletes.map((c) => c.url)).toEqual([
      "https://demo.supabase.co/storage/v1/object/review-media",
      `https://demo.supabase.co/rest/v1/reviews?id=eq.${ID}`,
    ]);
    expect(JSON.parse(deletes[0]!.init.body as string)).toEqual({
      prefixes: ["id/foto.jpg"],
    });
  });
});

describe("reviewStats", () => {
  it("calcula promedio y distribución", () => {
    expect(reviewStats([])).toMatchObject({ count: 0, average: null });
    const s = reviewStats([5, 4, 5]);
    expect(s.average).toBeCloseTo(14 / 3);
    expect(s.dist.find((d) => d.n === 5)!.count).toBe(2);
  });
});
