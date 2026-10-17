import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

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

import {
  applyImport,
  createPlaceAction,
  moveImageAction,
  prepareVideoUpload,
  previewImport,
  publishPlaceAction,
  registerVideo,
  removePlaceImageAction,
  saveHoursAction,
  updateImageAction,
  updatePlaceAction,
  uploadPlaceImage,
} from "@/app/admin/places-actions";
import { applyPlan, loadImportContext } from "@/lib/admin/places";
import { parseCsv } from "@/lib/import/csv";
import {
  planImport,
  readTable,
  snapshotOf,
  toRecord,
} from "@/lib/import/places-sheet";

type Call = {
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
};
let calls: Call[];
let role = "editor";
const ID = "607acc63-6f6e-4bb4-b1ba-a1cc0e783f40";
const NEW_ID = "11111111-2222-3333-4444-555555555555";

/** Supabase simulado: responde lo justo para crear, editar e importar. */
function stub(
  extra: (url: string, method: string) => Response | null = () => null,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const raw = init.body;
      calls.push({
        url,
        method,
        headers: (init.headers ?? {}) as Record<string, string>,
        body: typeof raw === "string" ? JSON.parse(raw) : raw,
      });
      const hit = extra(url, method);
      if (hit) return hit;
      if (url.includes("current_app_role")) return Response.json(role);
      if (url.includes("/categories?")) return Response.json([{ id: "cat-1" }]);
      if (url.includes("/localities?select=id&"))
        return Response.json([{ id: "loc-1" }]);
      if (url.includes("/localities?select=id,slug"))
        return Response.json([
          {
            id: "loc-1",
            slug: "las-salinas-papudo",
            translations: [{ locale: "es", name: "Las Salinas" }],
          },
        ]);
      if (url.includes("/places?select=id&slug=")) return Response.json([]);
      if (method === "POST" && url.endsWith("/rest/v1/places"))
        return Response.json([{ id: NEW_ID }], { status: 201 });
      return new Response(null, { status: 204 });
    }),
  );
}
const login = () =>
  jar.set(
    "adm_at",
    `x.${btoa(JSON.stringify({ sub: "571fa05b-3e1a-4c56-bfb1-8928608f82b0", exp: 9e9 })).replace(/=+$/, "")}.y`,
  );
const form = (d: Record<string, string | File>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(d)) f.set(k, v);
  return f;
};
const run = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e) => (e instanceof Redirect ? e.to : Promise.reject(e)),
  );
const find = (method: string, part: string) =>
  calls.filter((c) => c.method === method && c.url.includes(part));

beforeEach(() => {
  calls = [];
  role = "editor";
  jar.clear();
  updateTag.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const valid = {
  nombre: "Casa del Mar",
  categoria: "alojamiento",
  localidad: "las-salinas-papudo",
  direccion: "Av. Costanera 123",
  frase: "Cabañas frente al mar",
  horario: "Todos los días 9 a 20",
  boton_tipo: "whatsapp",
  boton_valor: "+56 9 1234 5678",
  instagram: "@casadelmar",
  contacto_correo: "dueno@ejemplo.cl",
  contacto_nombre: "Ana",
};

describe("crear un comercio", () => {
  it("valida lo que llega del formulario", async () => {
    login();
    stub();
    expect(await run(createPlaceAction(form({ ...valid, nombre: "ab" })))).toBe(
      "/admin/comercios/nuevo?error=name",
    );
    expect(
      await run(createPlaceAction(form({ ...valid, categoria: "otra" }))),
    ).toBe("/admin/comercios/nuevo?error=category");
    expect(
      await run(createPlaceAction(form({ ...valid, boton_valor: "hola" }))),
    ).toBe("/admin/comercios/nuevo?error=button");
    expect(
      await run(createPlaceAction(form({ ...valid, maps: "http://x.cl" }))),
    ).toBe("/admin/comercios/nuevo?error=link");
    expect(
      await run(
        createPlaceAction(form({ ...valid, sernatur_numero: "93605" })),
      ),
    ).toBe("/admin/comercios/nuevo?error=sernatur");
    expect(
      await run(
        createPlaceAction(form({ ...valid, contacto_correo: "no-es-correo" })),
      ),
    ).toBe("/admin/comercios/nuevo?error=email");
    expect(find("POST", "/rest/v1/places")).toHaveLength(0);
  });

  it("un editor crea una ficha en borrador y queda administrada desde el panel", async () => {
    login();
    stub();
    expect(
      await run(createPlaceAction(form({ ...valid, publicar: "on" }))),
    ).toBe(`/admin/comercios/${NEW_ID}?creado=1#fotos`);
    const [place] = find("POST", "/rest/v1/places");
    expect(place!.body).toMatchObject({
      slug: "casa-del-mar",
      publication_status: "draft",
      managed_in_panel: true,
      is_business: true,
      cta_kind: "whatsapp",
      instagram: "https://www.instagram.com/casadelmar/",
    });
    // Un editor no publica, aunque marque la casilla.
    expect(find("PATCH", "places?id=")).toHaveLength(0);
    // El contacto interno va aparte, no en la ficha pública.
    expect(find("POST", "place_contacts")[0]!.body).toMatchObject({
      place_id: NEW_ID,
      email: "dueno@ejemplo.cl",
    });
    expect(find("POST", "place_translations")[0]!.body).toMatchObject({
      locale: "es",
      name: "Casa del Mar",
      short_description: "Cabañas frente al mar",
    });
    expect(updateTag).toHaveBeenCalledWith("content");
  });

  it("un administrador puede publicarla al crearla", async () => {
    login();
    role = "admin";
    stub();
    await run(createPlaceAction(form({ ...valid, publicar: "on" })));
    const publish = find("PATCH", `places?id=eq.${NEW_ID}`);
    expect(publish[0]!.body).toEqual({ publication_status: "published" });
  });

  it("solo administración publica o despublica una ficha existente", async () => {
    login();
    stub();
    expect(
      await run(publishPlaceAction(form({ id: ID, accion: "publicar" }))),
    ).toBe(`/admin/comercios/${ID}?error=publish`);
    role = "admin";
    expect(
      await run(publishPlaceAction(form({ id: ID, accion: "publicar" }))),
    ).toBe(`/admin/comercios/${ID}?guardado=1`);
  });

  it("un verificador no crea fichas", async () => {
    login();
    role = "verifier";
    stub();
    expect(await run(createPlaceAction(form(valid)))).toBe(
      "/admin/comercios/nuevo?error=save",
    );
  });
});

describe("imágenes del comercio", () => {
  const png = async (w = 3000, h = 2000) =>
    sharp({ create: { width: w, height: h, channels: 3, background: "#3b7" } })
      .withMetadata({ exif: { IFD0: { Copyright: "secreto" } } })
      .png()
      .toBuffer();
  const place = {
    id: ID,
    slug: "casa",
    publication_status: "draft",
    address: null,
    category: { slug: "alojamiento" },
    locality: null,
    translations: [
      {
        locale: "es",
        name: "Casa del Mar",
        short_description: null,
        full_description: null,
      },
    ],
    contacts: [],
    images: [],
    hours: [],
    owner_validated: false,
  };
  const withPlace = (url: string, method: string) =>
    url.includes("/places?select=id,slug,publication_status")
      ? Response.json([place])
      : url.includes("/place_images?select=position")
        ? Response.json([])
        : url.includes("/storage/v1/object/place-images/") && method === "POST"
          ? new Response("{}", { status: 200 })
          : null;

  it("achica a WebP, sin metadatos, y la registra con su texto alternativo", async () => {
    login();
    stub(withPlace);
    const file = new File([new Uint8Array(await png())], "foto.png", {
      type: "image/png",
    });
    const res = await uploadPlaceImage(
      form({ id: ID, tipo: "photo", archivo: file, credito: "Roots" }),
    );
    expect(res).toEqual({ ok: true });
    const up = find("POST", "/storage/v1/object/place-images/")[0]!;
    expect(up.url).toMatch(
      new RegExp(`place-images/${ID}/[0-9a-f-]{36}\\.webp$`),
    );
    expect(up.headers["content-type"]).toBe("image/webp");
    const out = sharp(Buffer.from(up.body as Uint8Array));
    const meta = await out.metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1600); // se achicó
    expect(meta.exif).toBeUndefined(); // sin metadatos ocultos
    const [row] = find("POST", "/rest/v1/place_images");
    expect(row!.body).toMatchObject({
      place_id: ID,
      kind: "photo",
      width: 1600,
      height: 1067,
      alt_text: "Foto de Casa del Mar",
      credit: "Roots",
      position: 0,
    });
    expect((row!.body as { storage_path: string }).storage_path).toMatch(
      /^https:\/\/demo\.supabase\.co\/storage\/v1\/object\/public\/place-images\//,
    );
    expect(updateTag).toHaveBeenCalledWith("content");
  });

  it("el logo queda pequeño", async () => {
    login();
    stub(withPlace);
    const file = new File([new Uint8Array(await png(2000, 2000))], "l.png", {
      type: "image/png",
    });
    await uploadPlaceImage(form({ id: ID, tipo: "logo", archivo: file }));
    const up = find("POST", "/storage/v1/object/place-images/")[0]!;
    expect(
      (await sharp(Buffer.from(up.body as Uint8Array)).metadata()).width,
    ).toBe(512);
  });

  it("rechaza formatos, tamaños y permisos que no corresponden", async () => {
    login();
    stub(withPlace);
    const gif = new File([new Uint8Array([71, 73, 70])], "a.gif", {
      type: "image/gif",
    });
    expect(
      await uploadPlaceImage(form({ id: ID, tipo: "photo", archivo: gif })),
    ).toEqual({ ok: false, error: "type" });
    const big = new File([new Uint8Array(5 * 1024 * 1024)], "a.png", {
      type: "image/png",
    });
    expect(
      await uploadPlaceImage(form({ id: ID, tipo: "photo", archivo: big })),
    ).toEqual({ ok: false, error: "size" });
    const bad = new File([new Uint8Array(500)], "a.png", { type: "image/png" });
    expect(
      await uploadPlaceImage(form({ id: ID, tipo: "photo", archivo: bad })),
    ).toEqual({ ok: false, error: "read" });
    expect(
      await uploadPlaceImage(form({ id: ID, tipo: "otra", archivo: bad })),
    ).toEqual({ ok: false, error: "kind" });
    expect(find("POST", "/storage/v1/")).toHaveLength(0);
    role = "verifier";
    const ok = new File([new Uint8Array(await png(50, 50))], "a.png", {
      type: "image/png",
    });
    expect(
      await uploadPlaceImage(form({ id: ID, tipo: "photo", archivo: ok })),
    ).toEqual({ ok: false, error: "denied" });
  });

  it("al quitar una imagen se borra también el archivo del bucket", async () => {
    login();
    const IMG = "99999999-aaaa-bbbb-cccc-dddddddddddd";
    stub((url) =>
      url.includes("/place_images?select=storage_path")
        ? Response.json([
            {
              storage_path: `https://demo.supabase.co/storage/v1/object/public/place-images/${ID}/a.webp`,
            },
          ])
        : null,
    );
    expect(
      await run(removePlaceImageAction(form({ lugar: ID, id: IMG }))),
    ).toBe(`/admin/comercios/${ID}?guardado=1#fotos`);
    const del = find("DELETE", "/storage/v1/object/place-images")[0]!;
    expect(del.body).toEqual({ prefixes: [`${ID}/a.webp`] });
    expect(find("DELETE", `/rest/v1/place_images?id=eq.${IMG}`)).toHaveLength(
      1,
    );
  });
});

// ── Importación ───────────────────────────────────────────────────────────
const HEAD = [
  "Marca temporal",
  "¿Cómo se llama tu negocio?",
  "¿Qué ofreces?",
  "¿Dónde está?",
  "Dirección o cómo llegar",
  "Cuéntanos en una frase qué te hace especial",
  "¿Qué días y a qué hora atiendes?",
  "WhatsApp o teléfono del negocio",
  "Instagram, Facebook o página web",
  "Enlace de Google Maps",
  "¿Cómo nos mandas tus fotos?",
  "¿Quién tomó las fotos?",
  "Tu nombre",
  "Tu correo",
  "Autorización",
];
const row = (o: Partial<Record<number, string>> = {}) => {
  const base = [
    "17/10/2026 0:53:04",
    "Casa del Mar",
    "Alojamiento (cabañas)",
    "Las Salinas",
    "Costanera 1",
    "Frente al mar",
    "Todos los días 10-20",
    "+56 9 1234 5678",
    "@casadelmar",
    "https://maps.app.goo.gl/x",
    "Prefiero que las tomen ustedes",
    "",
    "Ana",
    "ana@ejemplo.cl",
    "Autorizo",
  ];
  for (const [i, v] of Object.entries(o)) base[Number(i)] = v!;
  return base;
};
const csv = (...rows: string[][]) =>
  [HEAD, ...rows]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
const LOCS = [{ slug: "las-salinas-papudo", names: ["Las Salinas"] }];
const plan = (
  text: string,
  existing = [] as Parameters<typeof planImport>[1],
) => planImport(readTable(parseCsv(text)), existing, LOCS).items;
const file = (text: string) =>
  form({ archivo: new File([text], "r.csv", { type: "text/csv" }) });

describe("importar desde la planilla", () => {
  it("la vista previa no guarda nada", async () => {
    login();
    stub((url) =>
      url.includes("/places?select=id,slug,import_key")
        ? Response.json([])
        : null,
    );
    const res = await previewImport({ status: "idle" }, file(csv(row())));
    expect(res.status).toBe("ready");
    if (res.status === "ready") {
      expect(res.items[0]).toMatchObject({
        name: "Casa del Mar",
        status: "new",
        category: "alojamiento",
      });
      expect("csv" in res.source).toBe(true);
    }
    expect(
      calls.filter(
        (c) => c.method !== "GET" && !c.url.includes("current_app_role"),
      ),
    ).toHaveLength(0);
  });

  it("rechaza enlaces que no son de Google Sheets y planillas que no se pueden leer", async () => {
    login();
    stub();
    expect(
      await previewImport(
        { status: "idle" },
        form({ planilla: "https://evil.com/x" }),
      ),
    ).toEqual({
      status: "error",
      error: "badUrl",
    });
    const id = "1cR1ThHr70lOzbxuKF04zqujO_09AN1UVXJfJxSmlOR0";
    stub((url) =>
      url.startsWith("https://docs.google.com/")
        ? new Response("<html>ingresa</html>", {
            headers: { "content-type": "text/html" },
          })
        : null,
    );
    expect(
      await previewImport(
        { status: "idle" },
        form({ planilla: `https://docs.google.com/spreadsheets/d/${id}/edit` }),
      ),
    ).toEqual({ status: "error", error: "fetch" });
  });

  it("lee la planilla de Google y la guarda para la próxima vez (solo admin)", async () => {
    login();
    role = "admin";
    const id = "1cR1ThHr70lOzbxuKF04zqujO_09AN1UVXJfJxSmlOR0";
    stub((url) => {
      if (url.startsWith("https://docs.google.com/"))
        return new Response(csv(row()), {
          headers: { "content-type": "text/csv; charset=utf-8" },
        });
      if (url.includes("/places?select=id,slug,import_key"))
        return Response.json([]);
      return null;
    });
    const res = await previewImport(
      { status: "idle" },
      form({
        planilla: `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`,
      }),
    );
    expect(res.status).toBe("ready");
    expect(
      calls.some(
        (c) =>
          c.url ===
          `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`,
      ),
    ).toBe(true);
    expect(find("PATCH", "site_settings")[0]!.body).toEqual({
      import_sheet_url: `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`,
    });
  });

  it("crea los comercios nuevos con su snapshot y el contacto aparte", async () => {
    login();
    stub((url) =>
      url.includes("/places?select=id,slug,import_key")
        ? Response.json([])
        : null,
    );
    const res = await applyImport(
      { status: "idle" },
      (() => {
        const f = file(csv(row()));
        f.append("incluir", "casa-del-mar");
        return f;
      })(),
    );
    expect(res).toMatchObject({
      status: "done",
      result: { created: 1, updated: 0, errors: [] },
    });
    const [place] = find("POST", "/rest/v1/places");
    expect(place!.body).toMatchObject({
      slug: "casa-del-mar",
      import_key: "casa-del-mar",
      publication_status: "draft",
      cta_value: "+56912345678",
      info_updated_at: "2026-10-17T03:53:04.000Z",
    });
    expect(
      (place!.body as { import_snapshot: object }).import_snapshot,
    ).toMatchObject({
      name: "Casa del Mar",
      phrase: "Frente al mar",
    });
    expect(find("POST", "place_contacts")[0]!.body).toMatchObject({
      email: "ana@ejemplo.cl",
    });
  });

  it("un comercio sin rubro reconocible espera que se elija la categoría", async () => {
    login();
    stub((url) =>
      url.includes("/places?select=id,slug,import_key")
        ? Response.json([])
        : null,
    );
    const text = csv(row({ 2: "Otra cosa" }));
    const sin = file(text);
    sin.append("incluir", "casa-del-mar");
    expect(await applyImport({ status: "idle" }, sin)).toMatchObject({
      result: { created: 0, skipped: 1 },
    });
    const con = file(text);
    con.append("incluir", "casa-del-mar");
    con.append("cat_casa-del-mar", "recreacion");
    expect(await applyImport({ status: "idle" }, con)).toMatchObject({
      result: { created: 1 },
    });
  });

  it("solo carga lo que no está marcado como incluido", async () => {
    login();
    stub((url) =>
      url.includes("/places?select=id,slug,import_key")
        ? Response.json([])
        : null,
    );
    const res = await applyImport({ status: "idle" }, file(csv(row())));
    expect(res).toMatchObject({ result: { created: 0 } });
    expect(find("POST", "/rest/v1/places")).toHaveLength(0);
  });

  it("si cambió un dato, actualiza solo ese dato y conserva lo editado a mano", async () => {
    login();
    const rec = toRecord(
      readTable(parseCsv(csv(row()))).rows[0]!,
      LOCS,
    ).record!;
    const existing = [
      {
        id: ID,
        slug: "casa-del-mar",
        name: "Casa del Mar",
        importKey: rec.key,
        snapshot: snapshotOf(rec),
        infoUpdatedAt: "2026-10-17T03:53:04.000Z",
      },
    ];
    const items = plan(
      csv(row({ 6: "Lunes a viernes 9-18", 0: "20/10/2026 9:00:00" })),
      existing,
    );
    expect(items[0]).toMatchObject({
      status: "update",
      changed: ["hoursText"],
    });
    stub();
    const res = await applyPlan(
      { token: "t", userId: "u", role: "editor" },
      items,
      { publish: false, categories: {} },
    );
    expect(res).toMatchObject({ updated: 1, errors: [] });
    const patches = find("PATCH", `places?id=eq.${ID}`);
    expect(patches).toHaveLength(1);
    const body = patches[0]!.body as Record<string, unknown>;
    expect(body.hours_text).toBe("Lunes a viernes 9-18");
    expect(body.managed_in_panel).toBe(true);
    expect(body.info_updated_at).toBe("2026-10-20T12:00:00.000Z");
    // No se tocó nada más: ni dirección, ni teléfono, ni textos.
    expect(body).not.toHaveProperty("address");
    expect(body).not.toHaveProperty("cta_value");
    expect(find("POST", "place_translations")).toHaveLength(0);
    expect(find("PATCH", "place_translations")).toHaveLength(0);
  });

  it("sin cambios no escribe nada", async () => {
    const rec = toRecord(
      readTable(parseCsv(csv(row()))).rows[0]!,
      LOCS,
    ).record!;
    const items = plan(csv(row()), [
      {
        id: ID,
        slug: "casa-del-mar",
        name: "Casa del Mar",
        importKey: rec.key,
        snapshot: snapshotOf(rec),
        infoUpdatedAt: "2026-10-17T03:53:04.000Z",
      },
    ]);
    stub();
    const res = await applyPlan(
      { token: "t", userId: "u", role: "admin" },
      items,
      { publish: true, categories: {} },
    );
    expect(res).toMatchObject({ same: 1, created: 0, updated: 0 });
    expect(calls).toHaveLength(0);
  });

  it("una ficha que ya estaba en la guía solo se vincula, sin pisar sus datos", async () => {
    const items = plan(csv(row()), [
      {
        id: ID,
        slug: "casa-del-mar",
        name: "Casa del Mar",
        importKey: null,
        snapshot: null,
        infoUpdatedAt: "2026-10-17T03:53:04.000Z",
      },
    ]);
    expect(items[0]!.status).toBe("link");
    stub();
    await applyPlan({ token: "t", userId: "u", role: "editor" }, items, {
      publish: false,
      categories: {},
    });
    const body = find("PATCH", `places?id=eq.${ID}`)[0]!.body as Record<
      string,
      unknown
    >;
    expect(Object.keys(body).sort()).toEqual([
      "import_key",
      "import_snapshot",
      "imported_at",
    ]);
  });
});

// ── Videos, textos de imágenes, orden y horarios ─────────────────────────
describe("edición completa de un local", () => {
  const place = {
    id: ID,
    slug: "roots-salinas",
    publication_status: "published",
    address: null,
    category: { slug: "gastronomia" },
    locality: null,
    translations: [
      {
        locale: "es",
        name: "Roots Salinas",
        short_description: null,
        full_description: null,
      },
    ],
    contacts: [],
    images: [],
    hours: [],
    owner_validated: true,
  };
  const withPlace = (url: string) =>
    url.includes("/places?select=id,slug,publication_status")
      ? Response.json([place])
      : null;

  it("la ficha guarda si la validó el representante del local", async () => {
    login();
    stub();
    expect(
      await run(createPlaceAction(form({ ...valid, validada: "on" }))),
    ).toBe(`/admin/comercios/${NEW_ID}?creado=1#fotos`);
    expect(find("POST", "/rest/v1/places")[0]!.body).toMatchObject({
      owner_validated: true,
    });
    calls = [];
    await run(createPlaceAction(form(valid)));
    expect(find("POST", "/rest/v1/places")[0]!.body).toMatchObject({
      owner_validated: false,
    });
    // Ya no se guarda una fuente con el texto del formulario.
    expect(find("POST", "/rest/v1/sources")).toHaveLength(0);
    calls = [];
    await run(updatePlaceAction(form({ ...valid, id: ID, validada: "on" })));
    expect(find("PATCH", `places?id=eq.${ID}`)[0]!.body).toMatchObject({
      owner_validated: true,
      managed_in_panel: true,
    });
  });

  it("autoriza la subida de un video directo a Storage con el token del personal", async () => {
    login();
    stub((url, method) => {
      if (
        url.includes("/storage/v1/object/upload/sign/place-videos/") &&
        method === "POST"
      )
        return Response.json({
          url: "/object/upload/sign/place-videos/x?token=t",
        });
      return withPlace(url);
    });
    const res = await prepareVideoUpload(
      form({ id: ID, mime: "video/mp4", size: "9000000" }),
    );
    expect(res).toMatchObject({ ok: true });
    if (res.ok) {
      expect(res.path).toMatch(new RegExp(`^${ID}/[0-9a-f-]{36}\\.mp4$`));
      expect(res.uploadUrl).toBe(
        "https://demo.supabase.co/storage/v1/object/upload/sign/place-videos/x?token=t",
      );
    }
    const sign = find("POST", "/upload/sign/place-videos/")[0]!;
    expect(sign.headers.authorization).toMatch(/^Bearer x\./);
  });

  it("no autoriza videos que no corresponden", async () => {
    login();
    stub(withPlace);
    expect(
      await prepareVideoUpload(
        form({ id: ID, mime: "video/x-msvideo", size: "10" }),
      ),
    ).toEqual({ ok: false, error: "type" });
    expect(
      await prepareVideoUpload(
        form({ id: ID, mime: "video/mp4", size: String(51 * 1024 * 1024) }),
      ),
    ).toEqual({ ok: false, error: "size" });
    expect(
      await prepareVideoUpload(form({ id: ID, mime: "video/mp4", size: "0" })),
    ).toEqual({ ok: false, error: "size" });
    expect(
      await prepareVideoUpload(
        form({ id: "x", mime: "video/mp4", size: "10" }),
      ),
    ).toEqual({ ok: false, error: "kind" });
    expect(find("POST", "/upload/sign/")).toHaveLength(0);
    role = "verifier";
    expect(
      await prepareVideoUpload(form({ id: ID, mime: "video/mp4", size: "10" })),
    ).toEqual({ ok: false, error: "denied" });
  });

  it("registra el video en la ficha solo si el archivo existe en nuestro bucket", async () => {
    login();
    const path = `${ID}/99999999-aaaa-bbbb-cccc-dddddddddddd.mp4`;
    const pub = `https://demo.supabase.co/storage/v1/object/public/place-videos/${path}`;
    stub((url, method) => {
      if (url === pub && method === "HEAD")
        return new Response(null, { status: 200 });
      if (url.includes("/place_images?select=position"))
        return Response.json([{ position: 3 }]);
      return withPlace(url);
    });
    const ok = await registerVideo(
      form({ id: ID, path, ancho: "1280", alto: "720", credito: "Roots" }),
    );
    expect(ok).toEqual({ ok: true });
    expect(find("POST", "/rest/v1/place_images")[0]!.body).toMatchObject({
      place_id: ID,
      storage_path: pub,
      kind: "video",
      width: 1280,
      height: 720,
      alt_text: "Video de Roots Salinas",
      credit: "Roots",
      position: 4,
    });
    expect(updateTag).toHaveBeenCalledWith("content");
    // Una ruta de otra ficha, o con forma rara, se rechaza sin tocar la base.
    calls = [];
    for (const bad of [
      `otra/${path.split("/")[1]}`,
      `${ID}/../x.mp4`,
      `${ID}/a.mp4`,
    ])
      expect(
        await registerVideo(
          form({ id: ID, path: bad, ancho: "10", alto: "10" }),
        ),
      ).toEqual({ ok: false, error: "kind" });
    expect(find("POST", "/rest/v1/place_images")).toHaveLength(0);
  });

  it("si el video no llegó a Storage, no lo registra", async () => {
    login();
    const path = `${ID}/99999999-aaaa-bbbb-cccc-dddddddddddd.mp4`;
    stub((url, method) =>
      method === "HEAD" ? new Response(null, { status: 404 }) : withPlace(url),
    );
    expect(
      await registerVideo(form({ id: ID, path, ancho: "10", alto: "10" })),
    ).toEqual({ ok: false, error: "save" });
    expect(find("POST", "/rest/v1/place_images")).toHaveLength(0);
  });

  it("al quitar un video se borra también del bucket de videos", async () => {
    login();
    const IMG = "99999999-aaaa-bbbb-cccc-dddddddddddd";
    stub((url) =>
      url.includes("/place_images?select=storage_path")
        ? Response.json([
            {
              storage_path: `https://demo.supabase.co/storage/v1/object/public/place-videos/${ID}/v.mp4`,
            },
          ])
        : null,
    );
    await run(removePlaceImageAction(form({ lugar: ID, id: IMG })));
    const del = find("DELETE", "/storage/v1/object/place-videos")[0]!;
    expect(del.body).toEqual({ prefixes: [`${ID}/v.mp4`] });
  });

  it("editar el texto de una imagen borra sus traducciones viejas", async () => {
    login();
    const IMG = "99999999-aaaa-bbbb-cccc-dddddddddddd";
    stub((url) =>
      url.includes("/place_images?select=alt_text")
        ? Response.json([{ alt_text: "Carta" }])
        : null,
    );
    expect(
      await run(
        updateImageAction(
          form({
            lugar: ID,
            id: IMG,
            alt: "Carta de verano",
            credito: "Roots",
          }),
        ),
      ),
    ).toBe(`/admin/comercios/${ID}?guardado=1#fotos`);
    expect(find("PATCH", `place_images?id=eq.${IMG}`)[0]!.body).toEqual({
      alt_text: "Carta de verano",
      credit: "Roots",
      alt_text_en: null,
      alt_text_pt: null,
    });
    // Si solo cambia el crédito, las traducciones se conservan.
    calls = [];
    await run(
      updateImageAction(
        form({ lugar: ID, id: IMG, alt: "Carta", credito: "Otro" }),
      ),
    );
    expect(find("PATCH", `place_images?id=eq.${IMG}`)[0]!.body).toEqual({
      alt_text: "Carta",
      credit: "Otro",
    });
    // Un texto muy corto se rechaza.
    expect(
      await run(updateImageAction(form({ lugar: ID, id: IMG, alt: "ab" }))),
    ).toBe(`/admin/comercios/${ID}?error=imageText#fotos`);
  });

  it("sube o baja una imagen intercambiando posiciones", async () => {
    login();
    const A = "aaaaaaaa-0000-4000-8000-000000000001";
    const B = "aaaaaaaa-0000-4000-8000-000000000002";
    const C = "aaaaaaaa-0000-4000-8000-000000000003";
    stub((url) =>
      url.includes("/place_images?select=id,position")
        ? Response.json([
            { id: A, position: -2 },
            { id: B, position: 0 },
            { id: C, position: 5 },
          ])
        : null,
    );
    await run(moveImageAction("up", form({ lugar: ID, id: C })));
    const patches = find("PATCH", "place_images?id=eq.");
    // Orden nuevo: A, C, B → posiciones 0, 1, 2.
    expect(
      Object.fromEntries(
        patches.map((p) => [
          p.url.split("eq.")[1],
          (p.body as { position: number }).position,
        ]),
      ),
    ).toEqual({
      [A]: 0,
      [C]: 1,
      [B]: 2,
    });
    // La primera no sube más: no escribe nada.
    calls = [];
    await run(moveImageAction("up", form({ lugar: ID, id: A })));
    expect(find("PATCH", "place_images?id=eq.")).toHaveLength(0);
    expect(
      await run(
        moveImageAction("sideways" as "up", form({ lugar: ID, id: A })),
      ),
    ).toBe(`/admin/comercios/${ID}?error=save#fotos`);
  });

  const hoursForm = (rows: Record<string, string>[]) => {
    const f = form({ id: ID, n: String(rows.length) });
    rows.forEach((r, i) =>
      Object.entries(r).forEach(([k, v]) => f.set(`h${i}_${k}`, v)),
    );
    return f;
  };

  it("guarda los horarios por temporada: agrega los nuevos y recién después quita los viejos", async () => {
    login();
    stub((url) =>
      url.includes("/place_hours?select=id")
        ? Response.json([{ id: "old-1" }, { id: "old-2" }])
        : null,
    );
    const res = await run(
      saveHoursAction(
        hoursForm([
          {
            de: "1",
            a: "2",
            abre: "09:00",
            cierra: "22:00",
            d0: "on",
            d1: "on",
            d2: "on",
            d3: "on",
            d4: "on",
            d5: "on",
            d6: "on",
          },
          {
            de: "3",
            a: "12",
            abre: "10:00",
            cierra: "19:00",
            d6: "on",
            d0: "on",
            fest: "on",
          },
          {
            de: "6",
            a: "7",
            abre: "10:00",
            cierra: "12:00",
            d1: "on",
            quitar: "on",
          },
          {}, // fila vacía: se ignora
        ]),
      ),
    );
    expect(res).toBe(`/admin/comercios/${ID}?guardado=1#horarios`);
    const insert = find("POST", "/rest/v1/place_hours")[0]!;
    const rows = insert.body as {
      day_of_week: number;
      from_month: number;
      to_month: number;
      holidays: boolean;
      opens_at: string;
    }[];
    expect(rows).toHaveLength(9); // 7 días en verano + sáb y dom el resto
    expect(
      rows
        .filter((r) => r.from_month === 3 && r.holidays)
        .map((r) => r.day_of_week)
        .sort(),
    ).toEqual([0, 6]);
    expect(rows.some((r) => r.from_month === 6)).toBe(false); // la fila quitada no se guarda
    expect(find("PATCH", `places?id=eq.${ID}`)[0]!.body).toEqual({
      managed_in_panel: true,
    });
    // Orden: primero se inserta, después se borra.
    const order = calls.map(
      (c) => `${c.method} ${c.url.split("/rest/v1/")[1]?.split("?")[0]}`,
    );
    expect(order.indexOf("POST place_hours")).toBeLessThan(
      order.indexOf("DELETE place_hours"),
    );
    expect(find("DELETE", "place_hours?id=in.(old-1,old-2)")).toHaveLength(1);
  });

  it("rechaza horarios incompletos o inválidos sin tocar nada", async () => {
    login();
    stub();
    const base = { de: "1", a: "2", abre: "09:00", cierra: "22:00", d1: "on" };
    for (const bad of [
      { ...base, d1: "" }, // sin días
      { ...base, de: "13" }, // mes inexistente
      { ...base, abre: "25:00" }, // hora inexistente
      { ...base, cierra: "" }, // sin hora de cierre
    ])
      expect(await run(saveHoursAction(hoursForm([bad])))).toBe(
        `/admin/comercios/${ID}?error=hours#horarios`,
      );
    expect(find("POST", "/rest/v1/place_hours")).toHaveLength(0);
    expect(find("DELETE", "place_hours")).toHaveLength(0);
  });

  it("sin cambios en una planilla importada, una respuesta reconfirmada también deja la ficha validada", async () => {
    // El plan «update» marca validada por el representante.
    const items = plan(csv(row({ 6: "Lunes a viernes 9-18" })), [
      {
        id: ID,
        slug: "casa-del-mar",
        name: "Casa del Mar",
        importKey: "casa-del-mar",
        snapshot: snapshotOf(
          toRecord(readTable(parseCsv(csv(row()))).rows[0]!, LOCS).record!,
        ),
        infoUpdatedAt: "2026-10-17T03:53:04.000Z",
      },
    ]);
    stub();
    await applyPlan({ token: "t", userId: "u", role: "editor" }, items, {
      publish: false,
      categories: {},
    });
    expect(find("PATCH", `places?id=eq.${ID}`)[0]!.body).toMatchObject({
      owner_validated: true,
    });
  });
});

// ── PRIV-01: el contacto no se guarda en el snapshot público ─────────────
describe("snapshot de importación y datos personales", () => {
  const rec = () =>
    toRecord(readTable(parseCsv(csv(row()))).rows[0]!, LOCS).record!;
  const noContact = (body: unknown) => {
    const snap = (body as { import_snapshot: object }).import_snapshot;
    expect(Object.keys(snap)).not.toContain("contactName");
    expect(Object.keys(snap)).not.toContain("contactEmail");
    expect(JSON.stringify(body)).not.toContain("ana@ejemplo.cl");
  };

  it("un comercio nuevo no escribe el contacto en places.import_snapshot", async () => {
    const items = plan(csv(row()));
    stub();
    await applyPlan({ token: "t", userId: "u", role: "editor" }, items, {
      publish: false,
      categories: {},
    });
    noContact(find("POST", "/rest/v1/places")[0]!.body);
    // Queda aparte, solo para el personal.
    const priv = find("POST", "place_import_private");
    expect(priv).toHaveLength(1);
    expect(priv[0]!.body).toMatchObject({
      place_id: NEW_ID,
      contact: { contactName: "Ana", contactEmail: "ana@ejemplo.cl" },
    });
  });

  it("al actualizar, guarda primero el contacto privado y deja el snapshot público sin él", async () => {
    const r = rec();
    const items = plan(
      csv(row({ 13: "otra@ejemplo.cl", 0: "20/10/2026 9:00:00" })),
      [
        {
          id: ID,
          slug: "casa-del-mar",
          name: "Casa del Mar",
          importKey: r.key,
          snapshot: snapshotOf(r),
          contactSnapshot: {
            contactName: "Ana",
            contactEmail: "ana@ejemplo.cl",
          },
          infoUpdatedAt: "2026-10-17T03:53:04.000Z",
        },
      ],
    );
    expect(items[0]!.changed).toEqual(["contactEmail"]);
    stub();
    await applyPlan({ token: "t", userId: "u", role: "editor" }, items, {
      publish: false,
      categories: {},
    });
    const patch = find("PATCH", `places?id=eq.${ID}`)[0]!;
    noContact(patch.body);
    expect(JSON.stringify(patch.body)).not.toContain("otra@ejemplo.cl");
    const priv = find("POST", "place_import_private")[0]!;
    expect(priv.body).toMatchObject({
      place_id: ID,
      contact: { contactEmail: "otra@ejemplo.cl" },
    });
    expect(calls.indexOf(priv)).toBeLessThan(calls.indexOf(patch));
  });

  it("al vincular una ficha existente también guarda el contacto aparte", async () => {
    const items = plan(csv(row()), [
      {
        id: ID,
        slug: "casa-del-mar",
        name: "Casa del Mar",
        importKey: null,
        snapshot: null,
        infoUpdatedAt: "2026-10-17T03:53:04.000Z",
      },
    ]);
    stub();
    await applyPlan({ token: "t", userId: "u", role: "editor" }, items, {
      publish: false,
      categories: {},
    });
    noContact(find("PATCH", `places?id=eq.${ID}`)[0]!.body);
    expect(find("POST", "place_import_private")[0]!.body).toMatchObject({
      place_id: ID,
    });
  });

  it("la importación lee el contacto privado junto a cada ficha", async () => {
    stub((url) =>
      url.includes("/places?select=id,slug,import_key")
        ? Response.json([
            {
              id: ID,
              slug: "casa-del-mar",
              import_key: "casa-del-mar",
              import_snapshot: { name: "Casa del Mar" },
              info_updated_at: null,
              translations: [{ locale: "es", name: "Casa del Mar" }],
              place_import_private: {
                contact: { contactName: "Ana", contactEmail: "ana@ejemplo.cl" },
              },
            },
          ])
        : null,
    );
    const { existing } = await loadImportContext("t");
    expect(existing[0]!.contactSnapshot).toEqual({
      contactName: "Ana",
      contactEmail: "ana@ejemplo.cl",
    });
    expect(
      calls.find((c) => c.url.includes("/places?select=id,slug,import_key"))!
        .url,
    ).toContain("place_import_private(contact)");
  });
});
