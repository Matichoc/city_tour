import { afterEach, describe, expect, it, vi } from "vitest";
import { STATIC_CONTENT } from "@/content";
import { loadContent, supabaseConfig } from "@/lib/db/content-source";

const cfg = { url: "https://demo.supabase.co", key: "clave" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("supabaseConfig", () => {
  it("sin credenciales no hay base", () => {
    expect(supabaseConfig({})).toBeNull();
    expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: cfg.url })).toBeNull();
  });

  it("acepta la URL con /rest/v1/ al final", () => {
    expect(
      supabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co/rest/v1/",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "clave",
      }),
    ).toEqual(cfg);
  });
});

describe("loadContent", () => {
  it("sin base usa el contenido del repo", async () => {
    expect(await loadContent(null)).toBe(STATIC_CONTENT);
  });

  it("si la base falla usa el contenido del repo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("caída", { status: 503 })),
    );
    expect(await loadContent(cfg)).toBe(STATIC_CONTENT);
  });

  it("si la base no tiene lugares usa el contenido del repo", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json([])),
    );
    expect(await loadContent(cfg)).toBe(STATIC_CONTENT);
  });

  it("lee de la base y envía solo la clave publicable", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      Response.json(
        url.includes("/places?")
          ? [
              {
                slug: "playa-de-prueba",
                latitude: -32.5,
                longitude: -71.4,
                address: null,
                is_demo: false,
                is_business: false,
                category: { slug: "balneario" },
                locality: null,
                translations: [
                  {
                    locale: "es",
                    name: "Playa de prueba",
                    short_description: "Corta",
                    full_description: "Larga",
                  },
                ],
                sources: [
                  { sort_order: 0, title: "Fuente", url: "https://ej.cl" },
                ],
              },
            ]
          : [],
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const content = await loadContent(cfg);
    expect(content.places).toEqual([
      {
        slug: "playa-de-prueba",
        localitySlug: null,
        categorySlug: "balneario",
        latitude: -32.5,
        longitude: -71.4,
        es: { name: "Playa de prueba", short: "Corta", description: "Larga" },
        source: { url: "https://ej.cl", label: "Fuente" },
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url.startsWith(`${cfg.url}/rest/v1/`)).toBe(true);
    expect(init.headers).toEqual({ apikey: "clave" });
  });
});
