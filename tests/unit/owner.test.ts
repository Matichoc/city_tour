// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("next-intl/middleware", () => ({
  default: () => () => NextResponse.redirect("https://x.vercel.app/es/local"),
}));

import {
  changedFields,
  getOwnerSession,
  isOwnerToken,
  readOwnerForm,
  submitOwnerProposal,
  type OwnerValues,
} from "@/lib/owner/access";
import proxy from "@/proxy";
import { GET as enter } from "@/app/local/entrar/route";

const TOKEN = "a".repeat(48);
const CURRENT: OwnerValues = {
  short_description: "Churrascos y más.",
  full_description: "Local de comida en Las Salinas.",
  hours_text: "Fines de semana",
  address: "Las Salinas",
  cta_kind: "whatsapp",
  cta_value: "+56 9 1234 5678",
  instagram: "https://www.instagram.com/roots.salinas/",
  website: null,
};
const form = (data: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
};
const full = (patch: Partial<Record<keyof OwnerValues, string>> = {}) =>
  form({
    ...Object.fromEntries(
      Object.entries(CURRENT).map(([k, v]) => [k, v ?? ""]),
    ),
    ...patch,
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Mi local: formulario del locatario", () => {
  it("el enlace son 48 caracteres hexadecimales", () => {
    expect(isOwnerToken(TOKEN)).toBe(true);
    expect(isOwnerToken("abc")).toBe(false);
    expect(isOwnerToken("Z".repeat(48))).toBe(false);
    expect(isOwnerToken(undefined)).toBe(false);
  });

  it("solo manda lo que cambió", () => {
    const { values, errors } = readOwnerForm(
      full({ hours_text: "Todos los días, 12:00 a 22:00" }),
    );
    expect(errors).toEqual([]);
    expect(changedFields(CURRENT, values)).toEqual({
      hours_text: "Todos los días, 12:00 a 22:00",
    });
  });

  it("sin cambios no hay nada que mandar", () => {
    const { values } = readOwnerForm(full());
    expect(changedFields(CURRENT, values)).toEqual({});
  });

  it("el botón viaja con su valor, aunque cambie solo uno", () => {
    const { values } = readOwnerForm(full({ cta_value: "+56 9 8765 4321" }));
    expect(changedFields(CURRENT, values)).toEqual({
      cta_kind: "whatsapp",
      cta_value: "+56 9 8765 4321",
    });
  });

  it("quitar el botón borra también su valor", () => {
    const { values } = readOwnerForm(full({ cta_kind: "" }));
    expect(changedFields(CURRENT, values)).toEqual({
      cta_kind: null,
      cta_value: null,
    });
  });

  it("revisa formatos: número de WhatsApp y enlaces con https", () => {
    expect(readOwnerForm(full({ cta_value: "123" })).errors).toContain(
      "ctaValue",
    );
    expect(
      readOwnerForm(full({ cta_kind: "menu", cta_value: "carta.pdf" })).errors,
    ).toContain("ctaValue");
    expect(readOwnerForm(full({ website: "ejemplo.cl" })).errors).toContain(
      "website",
    );
    expect(
      readOwnerForm(full({ instagram: "javascript:alert(1)" })).errors,
    ).toContain("instagram");
    expect(readOwnerForm(full({ cta_kind: "fax" })).errors).toContain("cta");
  });

  it("recorta los textos al largo máximo y limpia espacios", () => {
    const { values } = readOwnerForm(
      full({ short_description: `  ${"x".repeat(250)}  ` }),
    );
    expect(values.short_description).toHaveLength(200);
  });
});

describe("Mi local: conversación con la base", () => {
  it("sin un enlace con forma válida no consulta nada", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await getOwnerSession("abc")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("traduce los errores de la base", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    for (const [code, expected] of [
      ["28000", "expired"],
      ["22023", "invalid"],
      ["54000", "limit"],
      ["XX000", "error"],
    ] as const) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json({ code }, { status: 400 })),
      );
      expect(
        await submitOwnerProposal(TOKEN, { address: "x" }, "Ana", null),
      ).toBe(expected);
    }
  });
});

describe("Mi local: entrada y proxy", () => {
  it("/local no lleva idioma ni pide el enlace del equipo", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "clave");
    const res = await proxy(new NextRequest("https://x.vercel.app/local"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("un enlace inválido vuelve a /local con aviso, sin cookie", async () => {
    const res = await enter(
      new NextRequest("https://x.vercel.app/local/entrar?llave=nada"),
    );
    expect(res.headers.get("location")).toBe(
      "https://x.vercel.app/local?error=enlace",
    );
    expect(res.cookies.get("ml_llave")).toBeUndefined();
  });

  it("un enlace válido queda en una cookie solo para /local y se limpia la dirección", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          place_id: "p",
          slug: "roots-salinas",
          name: "Roots Salinas",
          published: true,
          current: CURRENT,
          last: null,
        }),
      ),
    );
    const res = await enter(
      new NextRequest(`https://x.vercel.app/local/entrar?llave=${TOKEN}`),
    );
    expect(res.headers.get("location")).toBe("https://x.vercel.app/local");
    const cookie = res.cookies.get("ml_llave");
    expect(cookie?.value).toBe(TOKEN);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe("/local");
  });
});
