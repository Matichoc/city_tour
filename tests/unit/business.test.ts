import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) =>
      jar.has(n) ? { name: n, value: jar.get(n)! } : undefined,
    set: () => {},
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

import { ctaHref } from "@/lib/data";
import { listNotices } from "@/lib/business";
import {
  addNotice,
  changeNotice,
  saveCta,
  saveSettings,
} from "@/app/admin/actions";
import { rowsToContent } from "@/lib/db/content-source";

type Call = { url: string; init: RequestInit };
let calls: Call[];
const stubFetch = (h: (url: string, init: RequestInit) => Response) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      return h(url, init);
    }),
  );
const role = (r: string) => (url: string) =>
  url.includes("current_app_role")
    ? Response.json(r)
    : new Response(null, { status: 204 });
const form = (d: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(d)) f.set(k, v);
  return f;
};
const run = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e) => (e instanceof Redirect ? e.to : Promise.reject(e)),
  );
const ID = "607acc63-6f6e-4bb4-b1ba-a1cc0e783f40";
const login = () =>
  jar.set(
    "adm_at",
    `x.${btoa(JSON.stringify({ sub: "571fa05b-3e1a-4c56-bfb1-8928608f82b0", exp: 9e9 })).replace(/=+$/, "")}.y`,
  );

beforeEach(() => {
  calls = [];
  jar.clear();
  updateTag.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("ctaHref", () => {
  it("arma WhatsApp y teléfono desde el número", () => {
    expect(ctaHref({ kind: "whatsapp", value: "+56 9 1234 5678" })).toBe(
      "https://wa.me/56912345678",
    );
    expect(ctaHref({ kind: "phone", value: "+56 (33) 232 5100" })).toBe(
      "tel:+56332325100",
    );
    expect(ctaHref({ kind: "whatsapp", value: "abc" })).toBeNull();
  });
  it("acepta solo enlaces http(s) para web, carta, reservas e Instagram", () => {
    expect(ctaHref({ kind: "menu", value: "https://ej.cl/carta.pdf" })).toBe(
      "https://ej.cl/carta.pdf",
    );
    expect(
      ctaHref({ kind: "website", value: "javascript:alert(1)" }),
    ).toBeNull();
  });
  it("llega desde la base a la ficha", () => {
    const content = rowsToContent({
      localities: [],
      events: [],
      routes: [],
      places: [
        {
          slug: "local",
          latitude: null,
          longitude: null,
          address: null,
          is_demo: false,
          is_business: true,
          verification_status: "pending",
          cta_kind: "booking",
          cta_value: "https://reservas.cl",
          category: { slug: "gastronomia" },
          locality: null,
          translations: [
            {
              locale: "es",
              name: "Local",
              short_description: "",
              full_description: "",
            },
          ],
          sources: [],
        },
      ],
    });
    expect(content.places[0]!.cta).toEqual({
      kind: "booking",
      value: "https://reservas.cl",
    });
  });
});

describe("acciones de comercios", () => {
  it("saveCta valida el número antes de guardar", async () => {
    login();
    stubFetch(role("editor"));
    expect(
      await run(saveCta(form({ id: ID, tipo: "whatsapp", valor: "hola" }))),
    ).toBe("/admin/comercios?error=1#botones");
    expect(
      await run(
        saveCta(form({ id: ID, tipo: "whatsapp", valor: "+56 9 1234 5678" })),
      ),
    ).toBe("/admin/comercios?guardado=1#botones");
    const patch = calls.find((c) => c.init.method === "PATCH")!;
    expect(JSON.parse(patch.init.body as string)).toEqual({
      cta_kind: "whatsapp",
      cta_value: "+56 9 1234 5678",
    });
    expect(updateTag).toHaveBeenCalledWith("content");
  });

  it("saveCta sin tipo quita el botón", async () => {
    login();
    stubFetch(role("admin"));
    await run(saveCta(form({ id: ID, tipo: "", valor: "" })));
    const patch = calls.find((c) => c.init.method === "PATCH")!;
    expect(JSON.parse(patch.init.body as string)).toEqual({
      cta_kind: null,
      cta_value: null,
    });
  });

  it("addNotice exige título y una fecha futura", async () => {
    login();
    stubFetch(role("editor"));
    expect(
      await run(
        addNotice(form({ lugar: "", titulo: "Hola", hasta: "2020-01-01" })),
      ),
    ).toBe("/admin/comercios?error=1#avisos");
    expect(
      await run(
        addNotice(form({ lugar: "", titulo: "x", hasta: "2099-01-01" })),
      ),
    ).toBe("/admin/comercios?error=1#avisos");
    expect(
      await run(
        addNotice(
          form({
            lugar: ID,
            titulo: "20% en marzo",
            hasta: "2099-01-31",
            enlace: "https://ej.cl",
          }),
        ),
      ),
    ).toBe("/admin/comercios?guardado=1#avisos");
    const post = calls.find(
      (c) => c.init.method === "POST" && c.url.endsWith("/notices"),
    )!;
    expect(JSON.parse(post.init.body as string)).toMatchObject({
      place_id: ID,
      title: "20% en marzo",
      link_url: "https://ej.cl",
      ends_at: "2099-02-01T02:59:59.000Z",
    });
    expect(updateTag).toHaveBeenCalledWith("notices");
  });

  it("changeNotice pausa y borra", async () => {
    login();
    stubFetch(role("editor"));
    await run(changeNotice(form({ id: ID, accion: "pausar" })));
    await run(changeNotice(form({ id: ID, accion: "borrar" })));
    expect(
      calls.some(
        (c) => c.init.method === "PATCH" && c.init.body === '{"active":false}',
      ),
    ).toBe(true);
    expect(calls.some((c) => c.init.method === "DELETE")).toBe(true);
  });

  it("solo administración cambia la invitación", async () => {
    login();
    stubFetch(role("editor"));
    expect(
      await run(
        saveSettings(
          form({ formulario: "https://forms.gle/x", invitacion: "on" }),
        ),
      ),
    ).toBe("/admin/comercios?error=1#invitacion");
    calls = [];
    stubFetch(role("admin"));
    expect(
      await run(saveSettings(form({ formulario: "https://forms.gle/x" }))),
    ).toBe("/admin/comercios?guardado=1#invitacion");
    const patch = calls.find((c) => c.init.method === "PATCH")!;
    expect(JSON.parse(patch.init.body as string)).toEqual({
      business_form_url: "https://forms.gle/x",
      business_invite: false,
    });
    expect(updateTag).toHaveBeenCalledWith("settings");
  });
});

describe("listNotices", () => {
  it("descarta avisos vencidos aunque vengan de la caché", async () => {
    stubFetch(() =>
      Response.json([
        {
          id: "1",
          title: "Vigente",
          body: null,
          link_url: null,
          ends_at: "2099-01-01T00:00:00Z",
        },
        {
          id: "2",
          title: "Vencido",
          body: null,
          link_url: null,
          ends_at: "2000-01-01T00:00:00Z",
        },
      ]),
    );
    expect((await listNotices()).map((n) => n.title)).toEqual(["Vigente"]);
    expect(calls[0]!.url).toContain("place_id=is.null");
  });
});
