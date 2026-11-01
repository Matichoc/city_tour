import { describe, expect, it } from "vitest";
import {
  isObscene,
  kindOf,
  MAX_BYTES,
  needsAttention,
  parseMediaMeta,
  worst,
} from "@/lib/media-policy";

describe("filtro de fotos y videos", () => {
  it("bloquea el desnudo explícito, no un traje de baño", () => {
    expect(isObscene({ Porn: 0.7 })).toBe(true);
    expect(isObscene({ Hentai: 0.55 })).toBe(true);
    expect(isObscene({ Porn: 0.35, Hentai: 0.3 })).toBe(true);
    expect(isObscene({ Sexy: 0.95, Neutral: 0.05 })).toBe(false);
    expect(needsAttention({ Sexy: 0.95 })).toBe(true);
    expect(needsAttention({ Neutral: 0.98 })).toBe(false);
    expect(needsAttention(null)).toBe(true);
  });
  it("en un video manda el peor cuadro", () => {
    expect(worst([{ Porn: 0.1, Neutral: 0.9 }, { Porn: 0.8 }])).toEqual({
      Porn: 0.8,
      Neutral: 0.9,
    });
  });
  it("solo formatos web", () => {
    expect(kindOf("image/jpeg")).toBe("image");
    expect(kindOf("video/quicktime")).toBe("video");
    expect(kindOf("image/gif")).toBeNull();
  });
  it("valida lo que manda el formulario", () => {
    expect(parseMediaMeta("")).toEqual([]);
    expect(parseMediaMeta("no-json")).toBeNull();
    const ok = [
      { mime: "image/png", size: 10, scores: { Neutral: 0.9, x: 3 } },
    ];
    expect(parseMediaMeta(JSON.stringify(ok))).toEqual([
      { mime: "image/png", size: 10, scores: { Neutral: 0.9 } },
    ]);
    const two = (m: string) => ({ mime: m, size: 10, scores: {} });
    expect(parseMediaMeta([two("video/mp4"), two("video/webm")])).toBeNull();
    expect(parseMediaMeta(Array(5).fill(two("image/png")))).toBeNull();
    expect(
      parseMediaMeta([{ mime: "image/png", size: MAX_BYTES + 1 }]),
    ).toBeNull();
    expect(
      parseMediaMeta([{ mime: "image/png", size: 10, scores: { Porn: 0.9 } }]),
    ).toBeNull();
  });
});
