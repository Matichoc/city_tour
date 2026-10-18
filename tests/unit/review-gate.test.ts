import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { gateSecret, reviewBind, signProof } from "@/lib/review-gate";

// Vectores compartidos con tests/db/gate.check.sql: lo que firma Node debe
// validarse igual en Postgres.
const SECRET = "vector-secret-0123456789-0123456789-abcdef";
const VECTOR_PAYLOAD =
  "eyJ2IjoxLCJhY3QiOiJyZXZpZXciLCJzZW5kZXIiOiJzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3NzcyIsImJpbmQiOiJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiIiwiZXhwIjoyMDAwMDAwMDAwLCJub25jZSI6Im5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5uIn0";
const VECTOR_SIG = "ZXsTUO6WxSakahM_zW6O0xpTAmqPY6md4A1YHLq02eI";

describe("prueba firmada de comentarios", () => {
  it("el contenido se resume igual que en la base de datos", () => {
    expect(
      reviewBind({
        entity: "place",
        slug: "playa-papudo",
        author: "Ana",
        rating: 5,
        body: "Muy linda la playa",
      }),
    ).toBe("fb5e5d591d98e2947cecb35aca29782d7d1bd952dc11852032562b502f544cd6");
  });

  it("firma exactamente el mismo token que valida la base", () => {
    const token = signProof({
      act: "review",
      sender: "s".repeat(32),
      bind: "b".repeat(64),
      secret: SECRET,
      ttlSeconds: 120,
      nowMs: (2_000_000_000 - 120) * 1000,
      nonce: "n".repeat(32),
    });
    expect(token).toBe(`${VECTOR_PAYLOAD}.${VECTOR_SIG}`);
  });

  it("la firma depende del secreto y del contenido", () => {
    const base = {
      act: "media" as const,
      sender: "x".repeat(32),
      bind: "y",
      nowMs: 1_700_000_000_000,
      nonce: "0".repeat(32),
    };
    const a = signProof({ ...base, secret: SECRET });
    const b = signProof({ ...base, secret: SECRET + "!" });
    const c = signProof({ ...base, bind: "z", secret: SECRET });
    expect(new Set([a, b, c]).size).toBe(3);
    // Se puede verificar con el secreto, como hace la base.
    const [payload, sig] = a.split(".");
    expect(
      createHmac("sha256", SECRET).update(payload!).digest("base64url"),
    ).toBe(sig);
  });

  it("cada prueba lleva un nonce distinto y vence a los 120 s", () => {
    const [p1] = signProof({
      act: "finish",
      sender: "s",
      bind: "b",
      secret: SECRET,
      nowMs: 1_700_000_000_000,
    }).split(".");
    const [p2] = signProof({
      act: "finish",
      sender: "s",
      bind: "b",
      secret: SECRET,
      nowMs: 1_700_000_000_000,
    }).split(".");
    const one = JSON.parse(Buffer.from(p1!, "base64url").toString());
    const two = JSON.parse(Buffer.from(p2!, "base64url").toString());
    expect(one.nonce).toMatch(/^[0-9a-f]{32}$/);
    expect(one.nonce).not.toBe(two.nonce);
    expect(one.exp).toBe(1_700_000_120);
    expect(one).toMatchObject({ v: 1, act: "finish" });
  });

  it("el secreto debe tener al menos 32 caracteres", () => {
    expect(gateSecret({ REVIEW_GATE_SECRET: "corto" })).toBeNull();
    expect(gateSecret({})).toBeNull();
    expect(gateSecret({ REVIEW_GATE_SECRET: SECRET })).toBe(SECRET);
  });
});
