import { describe, expect, it } from "vitest";
import { toOrigin } from "@/lib/qr";

describe("origen del QR", () => {
  it("normaliza nombres de locales a un identificador seguro", () => {
    expect(toOrigin("Hostal Las Gaviotas")).toBe("hostal-las-gaviotas");
    expect(toOrigin("Café Ñandú & Co.")).toBe("cafe-nandu-co");
    expect(toOrigin("  --raro__ ")).toBe("raro");
  });
  it("vacío o ausente queda vacío", () => {
    expect(toOrigin(undefined)).toBe("");
    expect(toOrigin("!!!")).toBe("");
  });
  it("no supera 60 caracteres", () => {
    expect(toOrigin("a".repeat(200)).length).toBe(60);
  });
});
