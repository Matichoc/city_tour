// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  inviteState,
  isInviteToken,
  signUp,
  type StaffInvite,
} from "@/lib/admin/team";

const base: StaffInvite = {
  id: "i",
  note: null,
  createdAt: "2026-11-01T00:00:00Z",
  expiresAt: "2026-11-08T00:00:00Z",
  claimedEmail: null,
  usedAt: null,
  revokedAt: null,
};
const NOW = Date.parse("2026-11-05T00:00:00Z");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Equipo: invitaciones al municipio", () => {
  it("el enlace son 48 caracteres hexadecimales", () => {
    expect(isInviteToken("ab".repeat(24))).toBe(true);
    expect(isInviteToken("x".repeat(48))).toBe(false);
    expect(isInviteToken(null)).toBe(false);
  });

  it("muestra el estado de cada invitación", () => {
    expect(inviteState(base, NOW)).toBe("open");
    expect(inviteState({ ...base, claimedEmail: "a@b.cl" }, NOW)).toBe(
      "claimed",
    );
    expect(inviteState({ ...base, usedAt: "2026-11-02T00:00:00Z" }, NOW)).toBe(
      "used",
    );
    expect(
      inviteState({ ...base, revokedAt: "2026-11-02T00:00:00Z" }, NOW),
    ).toBe("revoked");
    expect(inviteState(base, Date.parse("2026-11-09T00:00:00Z"))).toBe(
      "expired",
    );
  });

  it("crea la cuenta en Supabase con el nombre y la vuelta al panel", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const fetch = vi.fn(async () => Response.json({ id: "u" }));
    vi.stubGlobal("fetch", fetch);
    expect(
      await signUp(
        "ana@muni.cl",
        "una-clave-larga",
        "Ana",
        "https://p.cl/admin/ingresar?confirmado=1",
      ),
    ).toBe("ok");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://x.supabase.co/auth/v1/signup?redirect_to=" +
        encodeURIComponent("https://p.cl/admin/ingresar?confirmado=1"),
    );
    expect(JSON.parse(String(init.body))).toEqual({
      email: "ana@muni.cl",
      password: "una-clave-larga",
      data: { full_name: "Ana" },
    });
  });

  it("traduce los errores de Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    for (const [status, body, expected] of [
      [422, { error_code: "weak_password" }, "weak"],
      [429, { error_code: "over_email_send_rate_limit" }, "limit"],
      [500, {}, "error"],
    ] as const) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json(body, { status })),
      );
      expect(await signUp("a@b.cl", "x".repeat(12), "A", "https://p.cl")).toBe(
        expected,
      );
    }
  });
});
