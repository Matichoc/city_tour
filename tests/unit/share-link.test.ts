import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
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

  it("acota las horas", () => {
    expect(parseHours(null)).toBe(4);
    expect(parseHours("abc")).toBe(4);
    expect(parseHours("0.2")).toBe(1);
    expect(parseHours("8")).toBe(8);
    expect(parseHours("1000")).toBe(72);
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

  it("con clave y sin enlace muestra «enlace vencido»", async () => {
    vi.stubEnv("SHARE_LINK_SECRET", SECRET);
    const res = await proxy(req("https://x.vercel.app/es"));
    expect(res.status).toBe(403);
    expect(await res.text()).toContain("Este enlace venció");
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
