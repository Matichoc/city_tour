import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  parseDuration,
  parseHours,
  signAccess,
  verifyAccess,
} from "@/lib/share-link";
import proxy from "@/proxy";
import { GET as createLink } from "@/app/api/enlace/route";

// Lo que se prueba es la puerta de acceso, no las redirecciones de idioma.
vi.mock("next-intl/middleware", () => ({
  default: () => () => NextResponse.next(),
}));

const SECRET = "clave-de-prueba";
const HOUR = 3_600_000;

afterEach(() => vi.unstubAllEnvs());

describe("signAccess / verifyAccess", () => {
  it("acepta un código vigente y devuelve su vencimiento", async () => {
    const exp = Date.now() + 4 * HOUR;
    const token = await signAccess(SECRET, exp);
    expect(await verifyAccess(SECRET, token)).toBe(Math.floor(exp));
  });

  it("rechaza un código vencido", async () => {
    const token = await signAccess(SECRET, Date.now() + HOUR);
    expect(await verifyAccess(SECRET, token, Date.now() + 2 * HOUR)).toBeNull();
  });

  it("rechaza otra clave, un vencimiento alterado y basura", async () => {
    const token = await signAccess(SECRET, Date.now() + HOUR);
    expect(await verifyAccess("otra", token)).toBeNull();
    const [, sig] = token.split(".");
    const later = (Date.now() + 100 * HOUR).toString(36);
    expect(await verifyAccess(SECRET, `${later}.${sig}`)).toBeNull();
    // Mismo valor de firma escrito de otra forma (bits de relleno del último carácter).
    const lastChar = sig!.at(-1)!;
    const alias =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        .split("")
        .find(
          (c, i, all) =>
            c !== lastChar && i >> 2 === all.indexOf(lastChar) >> 2,
        )!;
    const decode = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    expect(decode(`${sig!.slice(0, -1)}${alias}`)).toBe(decode(sig!));
    expect(
      await verifyAccess(SECRET, `${token.slice(0, -1)}${alias}`),
    ).toBeNull();
    for (const bad of [null, "", "abc", "x.y.z", "zz.!!!"]) {
      expect(await verifyAccess(SECRET, bad)).toBeNull();
    }
  });

  it("el enlace del equipo no vence y solo vale con la misma clave", async () => {
    const token = await signAccess(SECRET, Infinity);
    expect(token.startsWith("equipo.")).toBe(true);
    const enCienAnios = Date.now() + 100 * 365 * 24 * HOUR;
    expect(await verifyAccess(SECRET, token, enCienAnios)).toBe(Infinity);
    expect(await verifyAccess("otra", token)).toBeNull();
    // La firma de un enlace por horas no sirve para hacerse pasar por el del equipo.
    const [, sig] = (await signAccess(SECRET, Date.now() + HOUR)).split(".");
    expect(await verifyAccess(SECRET, `equipo.${sig}`)).toBeNull();
  });

  it("acota las horas", () => {
    expect(parseHours(null)).toBe(4);
    expect(parseHours("abc")).toBe(4);
    expect(parseHours("0.2")).toBe(1);
    expect(parseHours("8")).toBe(8);
    expect(parseHours("1000")).toBe(720);
    expect(parseDuration(new URLSearchParams("dias=30"))).toBe(720);
    expect(parseDuration(new URLSearchParams("dias=90"))).toBe(720);
    expect(parseDuration(new URLSearchParams("horas=6&dias=30"))).toBe(6);
    expect(parseDuration(new URLSearchParams("dias=abc"))).toBe(4);
    expect(parseDuration(new URLSearchParams(""))).toBe(4);
  });
});

describe("proxy", () => {
  const req = (url: string, cookie?: string) =>
    new NextRequest(url, cookie ? { headers: { cookie } } : undefined);

  it("sin SHARE_LINK_SECRET el sitio se ve como siempre", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "");
    const res = await proxy(req("https://x.vercel.app/es"));
    expect(res.status).toBe(200);
  });

  it("una vista previa de Vercel sin clave no se abre: falla cerrado", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    const res = await proxy(req("https://x.vercel.app/es"));
    expect(res.status).toBe(403);
  });

  it("la producción de Vercel sin clave sigue abierta (el día que se abra el sitio)", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "production");
    const res = await proxy(req("https://x.vercel.app/es"));
    expect(res.status).toBe(200);
  });

  it("con clave y sin enlace muestra «enlace vencido»", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const res = await proxy(req("https://x.vercel.app/es"));
    expect(res.status).toBe(403);
    expect(await res.text()).toContain("Este enlace venció");
  });

  it("el enlace del equipo deja una cookie de 400 días", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const token = await signAccess(SECRET, Infinity);
    const res = await proxy(req(`https://x.vercel.app/es?acceso=${token}`));
    expect(res.status).toBe(307);
    const cookie = res.cookies.get(ACCESS_COOKIE);
    expect(cookie?.value).toBe(token);
    expect(cookie?.maxAge).toBe(400 * 24 * 3600);
  });

  it("un enlace vigente deja la cookie y limpia la dirección", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const token = await signAccess(SECRET, Date.now() + HOUR);
    const res = await proxy(
      req(
        `https://x.vercel.app/es/explorar?categoria=balneario&acceso=${token}`,
      ),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://x.vercel.app/es/explorar?categoria=balneario",
    );
    const cookie = res.cookies.get(ACCESS_COOKIE);
    expect(cookie?.value).toBe(token);
    expect(cookie?.httpOnly).toBe(true);
  });

  it("con la cookie vigente se navega; vencida, no", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const ok = await signAccess(SECRET, Date.now() + HOUR);
    const res = await proxy(
      req("https://x.vercel.app/es", `${ACCESS_COOKIE}=${ok}`),
    );
    expect(res.status).toBe(200);
    const old = await signAccess(SECRET, Date.now() - 1);
    const res2 = await proxy(
      req("https://x.vercel.app/es", `${ACCESS_COOKIE}=${old}`),
    );
    expect(res2.status).toBe(403);
  });
});

describe("/api/enlace", () => {
  const basic = (password: string) =>
    `Basic ${Buffer.from(`yo:${password}`).toString("base64")}`;

  it("no existe si no hay clave", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", "");
    const res = await createLink(
      new NextRequest("https://x.vercel.app/api/enlace"),
    );
    expect(res.status).toBe(404);
  });

  it("pide la clave y rechaza una equivocada", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const sin = await createLink(
      new NextRequest("https://x.vercel.app/api/enlace"),
    );
    expect(sin.status).toBe(401);
    expect(sin.headers.get("www-authenticate")).toMatch(/^Basic/);
    const mala = await createLink(
      new NextRequest("https://x.vercel.app/api/enlace", {
        headers: { authorization: basic("otra") },
      }),
    );
    expect(mala.status).toBe(401);
  });

  it("con ?para=equipo entrega el enlace permanente", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const res = await createLink(
      new NextRequest("https://x.vercel.app/api/enlace?para=equipo", {
        headers: { authorization: basic(SECRET) },
      }),
    );
    const html = await res.text();
    expect(html).toContain("no vence");
    const token = html.match(/acceso=([^<\s]+)/)![1]!;
    expect(await verifyAccess(SECRET, decodeURIComponent(token))).toBe(
      Infinity,
    );
  });

  it("con la clave entrega un enlace que funciona por las horas pedidas", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const res = await createLink(
      new NextRequest("https://x.vercel.app/api/enlace?horas=2", {
        headers: { authorization: basic(SECRET) },
      }),
    );
    expect(res.status).toBe(200);
    const link = (await res.text()).match(
      /https:\/\/x\.vercel\.app\/es\?acceso=([^<\s]+)/,
    );
    expect(link).not.toBeNull();
    const expiresAt = await verifyAccess(SECRET, decodeURIComponent(link![1]!));
    expect(expiresAt! - Date.now()).toBeGreaterThan(1.9 * HOUR);
    expect(expiresAt! - Date.now()).toBeLessThanOrEqual(2 * HOUR);
  });
});
