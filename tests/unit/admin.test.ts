import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ── Simulaciones de Next ──────────────────────────────────────────────────
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (opts: string | { name: string }) =>
      void jar.delete(typeof opts === "string" ? opts : opts.name),
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
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...a: unknown[]) => revalidateTag(...a),
}));
vi.mock("next-intl/middleware", () => ({
  default: () => () => NextResponse.next(),
}));

import { jwtPayload, needsRefresh } from "@/lib/admin/auth";
import { listEntities } from "@/lib/admin/api";
import { signIn, verify } from "@/app/admin/actions";
import proxy from "@/proxy";

const jwt = (payload: object) =>
  `x.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.y`;
const USER = "571fa05b-3e1a-4c56-bfb1-8928608f82b0";
const PLACE = "607acc63-6f6e-4bb4-b1ba-a1cc0e783f40";
const future = () => Math.floor(Date.now() / 1000) + 3600;

type Call = { url: string; init: RequestInit };
let calls: Call[];
function stubFetch(handler: (url: string, init: RequestInit) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      return handler(url, init);
    }),
  );
}
const asRole = (role: string | null) => (url: string) =>
  url.includes("rpc/current_app_role")
    ? Response.json(role)
    : new Response(null, { status: 204 });

const form = (data: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
};
const redirectOf = async (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e) => (e instanceof Redirect ? e.to : Promise.reject(e)),
  );

beforeEach(() => {
  jar.clear();
  calls = [];
  revalidateTag.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-publica");
  vi.stubEnv("SHARE_LINK_SECRET", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tokens", () => {
  it("lee el JWT y decide cuándo renovarlo", () => {
    expect(jwtPayload(jwt({ sub: USER })).sub).toBe(USER);
    expect(jwtPayload("basura")).toEqual({});
    expect(needsRefresh(undefined)).toBe(true);
    expect(needsRefresh(jwt({ exp: future() }))).toBe(false);
    expect(needsRefresh(jwt({ exp: Math.floor(Date.now() / 1000) + 30 }))).toBe(
      true,
    );
  });
});

describe("signIn", () => {
  it("rechaza una cuenta sin rol de personal y no deja sesión", async () => {
    stubFetch((url) =>
      url.includes("/auth/v1/token")
        ? Response.json({
            access_token: jwt({ sub: USER, exp: future() }),
            refresh_token: "r",
            expires_in: 3600,
          })
        : asRole(null)(url),
    );
    const to = await redirectOf(
      signIn(form({ email: "a@b.cl", password: "x" })),
    );
    expect(to).toBe("/admin/ingresar?error=1");
    expect(jar.size).toBe(0);
  });

  it("con contraseña equivocada no llama más allá de Auth", async () => {
    stubFetch(() => new Response("{}", { status: 400 }));
    const to = await redirectOf(
      signIn(form({ email: "a@b.cl", password: "x" })),
    );
    expect(to).toBe("/admin/ingresar?error=1");
    expect(calls).toHaveLength(1);
  });

  it("el personal entra y quedan las dos cookies", async () => {
    const at = jwt({ sub: USER, exp: future() });
    stubFetch((url) =>
      url.includes("/auth/v1/token")
        ? Response.json({
            access_token: at,
            refresh_token: "r",
            expires_in: 3600,
          })
        : asRole("admin")(url),
    );
    const to = await redirectOf(
      signIn(form({ email: "a@b.cl", password: "x" })),
    );
    expect(to).toBe("/admin");
    expect(jar.get("adm_at")).toBe(at);
    expect(jar.get("adm_rt")).toBe("r");
    const auth = calls[0]!;
    expect(auth.url).toBe(
      "https://demo.supabase.co/auth/v1/token?grant_type=password",
    );
    expect(JSON.parse(auth.init.body as string)).toEqual({
      email: "a@b.cl",
      password: "x",
    });
  });
});

describe("verify", () => {
  const valid = {
    tipo: "lugar",
    id: PLACE,
    estado: "verified",
    nota: "Visto en terreno",
    evidencia: "",
  };

  it("sin sesión manda a ingresar", async () => {
    expect(await redirectOf(verify(form(valid)))).toBe("/admin/ingresar");
  });

  it("un editor no puede verificar", async () => {
    jar.set("adm_at", jwt({ sub: USER, exp: future() }));
    stubFetch(asRole("editor"));
    expect(await redirectOf(verify(form(valid)))).toBe(
      `/admin/lugar/${PLACE}?error=1`,
    );
    expect(calls.some((c) => c.url.includes("verify_entity"))).toBe(false);
  });

  it("rechaza evidencia que no es un enlace web", async () => {
    jar.set("adm_at", jwt({ sub: USER, exp: future() }));
    stubFetch(asRole("admin"));
    const to = await redirectOf(
      verify(form({ ...valid, evidencia: "javascript:alert(1)" })),
    );
    expect(to).toBe(`/admin/lugar/${PLACE}?error=1`);
  });

  it("un admin verifica con verify_entity y se refresca el sitio", async () => {
    const at = jwt({ sub: USER, exp: future() });
    jar.set("adm_at", at);
    stubFetch(asRole("admin"));
    const to = await redirectOf(
      verify(form({ ...valid, evidencia: "https://ejemplo.cl/foto.jpg" })),
    );
    expect(to).toBe(`/admin/lugar/${PLACE}?guardado=1`);
    const rpc = calls.find((c) =>
      c.url.endsWith("/rest/v1/rpc/verify_entity"),
    )!;
    expect(JSON.parse(rpc.init.body as string)).toEqual({
      p_entity: "place",
      p_id: PLACE,
      p_status: "verified",
      p_notes: "Visto en terreno",
      p_evidence_url: "https://ejemplo.cl/foto.jpg",
    });
    expect((rpc.init.headers as Record<string, string>).authorization).toBe(
      `Bearer ${at}`,
    );
    expect(revalidateTag).toHaveBeenCalledWith("content", "max");
  });

  it("si la base rechaza, avisa el error", async () => {
    jar.set("adm_at", jwt({ sub: USER, exp: future() }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch((url) =>
      url.includes("verify_entity")
        ? new Response("forbidden", { status: 403 })
        : asRole("admin")(url),
    );
    expect(await redirectOf(verify(form(valid)))).toBe(
      `/admin/lugar/${PLACE}?error=1`,
    );
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("listEntities", () => {
  it("usa el nombre en español y marca los ejemplos", async () => {
    stubFetch(() =>
      Response.json([
        {
          id: PLACE,
          slug: "playa-papudo",
          publication_status: "published",
          verification_status: "pending",
          last_verified_at: null,
          is_demo: false,
          translations: [
            { locale: "en", name: "Papudo Beach" },
            { locale: "es", name: "Playa de Papudo" },
          ],
        },
      ]),
    );
    const [row] = await listEntities("t", "lugar");
    expect(row).toMatchObject({
      name: "Playa de Papudo",
      demo: false,
      verification: "pending",
    });
    expect(calls[0]!.url).toContain("places?select=");
  });
});

describe("proxy en /admin", () => {
  const req = (cookie?: string) =>
    new NextRequest(
      "https://x.vercel.app/admin",
      cookie ? { headers: { cookie } } : undefined,
    );

  it("no agrega idioma ni toca la sesión vigente", async () => {
    stubFetch(() => new Response("", { status: 500 }));
    const res = await proxy(req(`adm_at=${jwt({ exp: future() })}; adm_rt=r`));
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  it("renueva el token por vencer", async () => {
    const nuevo = jwt({ sub: USER, exp: future() });
    stubFetch(() =>
      Response.json({
        access_token: nuevo,
        refresh_token: "r2",
        expires_in: 3600,
      }),
    );
    const res = await proxy(req(`adm_at=${jwt({ exp: 1 })}; adm_rt=r1`));
    expect(calls[0]!.url).toContain("grant_type=refresh_token");
    expect(res.cookies.get("adm_at")?.value).toBe(nuevo);
    expect(res.cookies.get("adm_rt")?.value).toBe("r2");
  });

  it("si no se puede renovar, borra la sesión", async () => {
    stubFetch(() => new Response("{}", { status: 400 }));
    const res = await proxy(req(`adm_at=${jwt({ exp: 1 })}; adm_rt=r1`));
    expect(res.cookies.get("adm_rt")?.value).toBe("");
  });

  it("sigue detrás del enlace del equipo", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "clave");
    const res = await proxy(req());
    expect(res.status).toBe(403);
  });
});
