import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
let userAgent = "Prueba";
let clientIp = "200.1.2.3, 10.0.0.1";
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      "x-forwarded-for": clientIp,
      "user-agent": userAgent,
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

import { createHmac } from "node:crypto";
import { finishReviewMedia, submitReview } from "@/lib/reviews-actions";
import { reviewBind } from "@/lib/review-gate";
import {
  cleanupAbandonedUploads,
  markAllReviewed,
  moderateMedia,
  moderateReview,
} from "@/app/admin/actions";
import { countReviewNotices, listReviewsAdmin } from "@/lib/admin/api";
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
  userAgent = "Prueba";
  clientIp = "200.1.2.3, 10.0.0.1";
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

// ── ABUSE-01/02: con REVIEW_GATE_SECRET, solo con prueba firmada ──────────
describe("submitReview con prueba firmada", () => {
  const SECRET = "secreto-de-pruebas-0123456789abcdef-0123456789";
  beforeEach(() => {
    vi.stubEnv("REVIEW_GATE_SECRET", SECRET);
  });
  const proofOf = (call: Call) => {
    const body = JSON.parse(call.init.body as string);
    const [payload, signature] = (body.p_proof as string).split(".");
    return {
      body,
      claims: JSON.parse(Buffer.from(payload!, "base64url").toString()),
      validSignature:
        createHmac("sha256", SECRET).update(payload!).digest("base64url") ===
        signature,
    };
  };

  it("llama a submit_review_v2 con una prueba válida atada a ese texto", async () => {
    stubFetch(() => Response.json("id"));
    await submitReview(idle, form(valid));
    expect(calls[0]!.url).toBe(
      "https://demo.supabase.co/rest/v1/rpc/submit_review_v2",
    );
    const { body, claims, validSignature } = proofOf(calls[0]!);
    expect(validSignature).toBe(true);
    expect(claims).toMatchObject({
      v: 1,
      act: "review",
      sender: body.p_sender_hash,
    });
    expect(claims.bind).toBe(
      reviewBind({
        entity: "place",
        slug: "playa-papudo",
        author: "Ana",
        rating: 5,
        body: "Muy linda la playa",
      }),
    );
    const left = claims.exp - Math.floor(Date.now() / 1000);
    expect(left).toBeGreaterThan(100);
    expect(left).toBeLessThanOrEqual(120);
  });

  it("sin nombre, la prueba cubre el nombre que de verdad se envía", async () => {
    stubFetch(() => Response.json("id"));
    await submitReview(
      idle,
      form({ ...valid, nombre: "", anonimo: "Visitor" }),
    );
    const { body, claims } = proofOf(calls[0]!);
    expect(body.p_author).toBe("Visitor");
    expect(claims.bind).toBe(
      reviewBind({
        entity: "place",
        slug: "playa-papudo",
        author: "Visitor",
        rating: 5,
        body: "Muy linda la playa",
      }),
    );
  });

  it("la huella depende de la IP y no del navegador", async () => {
    stubFetch(() => Response.json("id"));
    await submitReview(idle, form(valid));
    userAgent = "Otro navegador distinto";
    await submitReview(idle, form(valid));
    clientIp = "201.9.9.9";
    await submitReview(idle, form(valid));
    const sender = (i: number) =>
      JSON.parse(calls[i]!.init.body as string).p_sender_hash;
    expect(sender(0)).toBe(sender(1));
    expect(sender(0)).not.toBe(sender(2));
  });

  it("sin sal no envía nada (no se usa una sal vacía)", async () => {
    vi.stubEnv("REVIEWS_SALT", "");
    vi.stubEnv("SHARE_LINK_SECRET", "respaldo-que-ya-no-vale");
    stubFetch(() => Response.json("id"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await submitReview(idle, form(valid))).toEqual({ status: "error" });
    expect(calls).toHaveLength(0);
  });

  it("registra los archivos y termina la subida con su propia prueba", async () => {
    const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
    stubFetch((url) =>
      url.endsWith("submit_review_v2")
        ? Response.json(ID)
        : url.endsWith("attach_review_media_v2")
          ? Response.json([`${ID}/a.jpg`])
          : url.includes("/storage/v1/object/upload/sign/")
            ? Response.json({
                url: "/object/upload/sign/review-media/x?token=t",
              })
            : Response.json(1),
    );
    const res = await submitReview(
      idle,
      form({
        ...valid,
        archivos: JSON.stringify([{ mime: "image/jpeg", size: 1000 }]),
      }),
    );
    expect(res.reviewId).toBe(ID);
    const attach = calls.find((c) => c.url.endsWith("attach_review_media_v2"))!;
    const a = proofOf(attach);
    expect(a.validSignature).toBe(true);
    expect(a.claims).toMatchObject({ act: "media", bind: ID });
    expect(a.body.p_review).toBe(ID);

    expect(await finishReviewMedia(ID)).toBe(1);
    const finish = calls.find((c) => c.url.endsWith("finish_review_media_v2"))!;
    const f = proofOf(finish);
    expect(f.validSignature).toBe(true);
    expect(f.claims).toMatchObject({ act: "finish", bind: ID });
    expect(f.claims.nonce).not.toBe(a.claims.nonce);
  });

  describe("Turnstile (anti-robots)", () => {
    beforeEach(() => {
      vi.stubEnv("TURNSTILE_SECRET_KEY", "secreta-de-pruebas");
    });
    const siteverify = (success: boolean) => (url: string) =>
      url.includes("challenges.cloudflare.com")
        ? Response.json({ success })
        : Response.json("id");

    it("sin token no se envía nada a la base", async () => {
      stubFetch(siteverify(true));
      expect(await submitReview(idle, form(valid))).toEqual({
        status: "captcha",
      });
      expect(calls).toHaveLength(0);
    });

    it("con un token que Cloudflare rechaza, tampoco", async () => {
      stubFetch(siteverify(false));
      expect(
        await submitReview(
          idle,
          form({ ...valid, "cf-turnstile-response": "t" }),
        ),
      ).toEqual({ status: "captcha" });
      expect(calls.some((c) => c.url.includes("submit_review"))).toBe(false);
    });

    it("con un token válido se verifica (con la IP) y se publica", async () => {
      stubFetch(siteverify(true));
      const res = await submitReview(
        idle,
        form({ ...valid, "cf-turnstile-response": "token-bueno" }),
      );
      expect(res.status).toBe("ok");
      const check = calls[0]!;
      expect(check.url).toContain(
        "challenges.cloudflare.com/turnstile/v0/siteverify",
      );
      const sent = new URLSearchParams(String(check.init.body));
      expect(sent.get("secret")).toBe("secreta-de-pruebas");
      expect(sent.get("response")).toBe("token-bueno");
      expect(sent.get("remoteip")).toBe("200.1.2.3");
      expect(calls[1]!.url).toContain("submit_review_v2");
    });

    it("si Cloudflare no responde, no se publica", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("challenges.cloudflare.com")) throw new Error("red");
          return Response.json("id");
        }),
      );
      expect(
        await submitReview(
          idle,
          form({ ...valid, "cf-turnstile-response": "t" }),
        ),
      ).toEqual({ status: "captcha" });
    });

    it("el campo trampa y el filtro de groserías actúan antes que Turnstile", async () => {
      stubFetch(siteverify(true));
      expect(
        await submitReview(
          idle,
          form({ ...valid, texto: "qué weón el que atiende" }),
        ),
      ).toEqual({ status: "profanity" });
      expect(calls).toHaveLength(0);
    });
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

// ── Aviso de comentarios nuevos y limpieza de subidas abandonadas ─────────
describe("panel: comentarios nuevos y subidas abandonadas", () => {
  const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
  const MEDIA = "7a1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
  const jwt = btoa(
    JSON.stringify({ sub: "571fa05b-3e1a-4c56-bfb1-8928608f82b0", exp: 9e9 }),
  ).replace(/=+$/, "");
  const run = (p: Promise<unknown>) =>
    p.then(
      () => null,
      (e) => (e instanceof Redirect ? e.to : Promise.reject(e)),
    );
  const asRole = (
    r: string,
    extra: (url: string) => Response | null = () => null,
  ) => {
    jar.set("adm_at", `x.${jwt}.y`);
    stubFetch((url) =>
      url.includes("current_app_role")
        ? Response.json(r)
        : (extra(url) ?? new Response(null, { status: 204 })),
    );
  };
  const patches = () => calls.filter((c) => c.init.method === "PATCH");
  const bodyOf = (c: Call) => JSON.parse(c.init.body as string);

  it("cuenta los comentarios sin revisar y los que tienen archivos pendientes, sin repetir", async () => {
    stubFetch((url) =>
      url.includes("reviews?select=id&reviewed_at=is.null")
        ? Response.json([{ id: "a" }, { id: "b" }])
        : url.includes("review_media?select=review_id&status=eq.pending")
          ? Response.json([{ review_id: "b" }, { review_id: "c" }])
          : new Response(null, { status: 500 }),
    );
    expect(await countReviewNotices("token")).toBe(3);
  });

  it("si la base no responde, el aviso no rompe el panel", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await countReviewNotices("token")).toBe(0);
  });

  it("el filtro «por revisar» pide solo lo no revisado", async () => {
    stubFetch(() => Response.json([]));
    await listReviewsAdmin("token", "nuevos");
    expect(calls[0]!.url).toContain("reviewed_at=is.null");
    expect(calls[0]!.url).toContain("reviewed_at");
  });

  it("ocultar o mostrar también da el comentario por revisado", async () => {
    asRole("editor");
    await run(
      moderateReview(form({ id: ID, accion: "ocultar", filtro: "todos" })),
    );
    const body = bodyOf(patches()[0]!);
    expect(body.status).toBe("hidden");
    expect(body.reviewed_at).toEqual(expect.any(String));
    expect(body.reviewed_by).toBe("571fa05b-3e1a-4c56-bfb1-8928608f82b0");
  });

  it("«revisar» solo marca como revisado, sin cambiar la visibilidad", async () => {
    asRole("editor");
    expect(
      await run(
        moderateReview(form({ id: ID, accion: "revisar", filtro: "nuevos" })),
      ),
    ).toBe("/admin/comentarios?filtro=nuevos&guardado=1");
    const body = bodyOf(patches()[0]!);
    expect(patches()[0]!.url).toContain(`reviews?id=eq.${ID}`);
    expect(body).not.toHaveProperty("status");
    expect(body.reviewed_at).toEqual(expect.any(String));
  });

  it("un verificador no marca ni limpia", async () => {
    asRole("verifier");
    expect(
      await run(
        moderateReview(form({ id: ID, accion: "revisar", filtro: "todos" })),
      ),
    ).toBe("/admin/comentarios?filtro=todos&error=1");
    expect(await run(markAllReviewed(form({ filtro: "todos" })))).toBe(
      "/admin/comentarios?filtro=todos&error=1",
    );
    expect(await run(cleanupAbandonedUploads(form({ filtro: "todos" })))).toBe(
      "/admin/comentarios?filtro=todos&error=1",
    );
    expect(patches()).toHaveLength(0);
  });

  it("«marcar todos» solo toca lo que está sin revisar", async () => {
    asRole("admin");
    expect(await run(markAllReviewed(form({ filtro: "nuevos" })))).toBe(
      "/admin/comentarios?filtro=nuevos&guardado=1",
    );
    expect(patches()[0]!.url).toContain("reviews?reviewed_at=is.null");
    expect(bodyOf(patches()[0]!).reviewed_at).toEqual(expect.any(String));
  });

  it("aprobar o rechazar un archivo da por revisado su comentario", async () => {
    asRole("editor", (url) =>
      url.includes("review_media?id=eq.")
        ? Response.json([{ path: `${ID}/a.jpg`, review_id: ID }])
        : null,
    );
    await run(
      moderateMedia(form({ id: MEDIA, accion: "aprobar", filtro: "archivos" })),
    );
    const marked = patches().find((c) => c.url.includes(`reviews?id=eq.${ID}`));
    expect(marked).toBeTruthy();
    expect(bodyOf(marked!).reviewed_at).toEqual(expect.any(String));
  });

  it("limpia las subidas abandonadas: borra los archivos y los da por revisados", async () => {
    asRole("editor", (url) =>
      url.includes("review_media?select=id,path")
        ? Response.json([
            { id: "m1", path: "r1/a.jpg" },
            { id: "m2", path: "r2/b.mp4" },
          ])
        : null,
    );
    expect(await run(cleanupAbandonedUploads(form({ filtro: "todos" })))).toBe(
      "/admin/comentarios?filtro=todos&guardado=1",
    );
    const list = calls.find((c) =>
      c.url.includes("review_media?select=id,path"),
    )!;
    // Lo que se subía hace más de una hora, o lo ya descartado sin moderar.
    expect(decodeURIComponent(list.url)).toMatch(
      /or=\(and\(status\.eq\.uploading,created_at\.lt\..+\),and\(status\.eq\.rejected,moderated_at\.is\.null\)\)/,
    );
    const del = calls.find((c) => c.init.method === "DELETE")!;
    expect(del.url).toBe(
      "https://demo.supabase.co/storage/v1/object/review-media",
    );
    expect(bodyOf(del)).toEqual({ prefixes: ["r1/a.jpg", "r2/b.mp4"] });
    const mark = patches().find((c) => c.url.includes("review_media?id=in."))!;
    expect(decodeURIComponent(mark.url)).toContain("(m1,m2)");
    expect(bodyOf(mark)).toMatchObject({ status: "rejected" });
    expect(bodyOf(mark).moderated_at).toEqual(expect.any(String));
  });

  it("sin nada abandonado, no llama a Storage", async () => {
    asRole("admin", (url) =>
      url.includes("review_media?select=id,path") ? Response.json([]) : null,
    );
    await run(cleanupAbandonedUploads(form({ filtro: "todos" })));
    expect(calls.some((c) => c.init.method === "DELETE")).toBe(false);
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
