import { describe, expect, it } from "vitest";
import { byUrgency, freshness, infoDueDate } from "@/lib/freshness";

const now = new Date("2026-10-17T12:00:00Z");

describe("vigencia de los datos de un comercio", () => {
  it("vence a los 6 meses", () => {
    expect(infoDueDate("2026-04-17T12:00:00Z").toISOString()).toBe(
      "2026-10-17T12:00:00.000Z",
    );
  });
  it("clasifica según la fecha", () => {
    expect(freshness(null, now)).toBe("never");
    expect(freshness("no-es-fecha", now)).toBe("never");
    expect(freshness("2026-09-01T00:00:00Z", now)).toBe("ok");
    expect(freshness("2026-05-01T00:00:00Z", now)).toBe("soon");
    expect(freshness("2026-04-01T00:00:00Z", now)).toBe("overdue");
  });
  it("ordena primero lo urgente", () => {
    expect(
      (["ok", "soon", "never", "overdue"] as const).slice().sort(byUrgency),
    ).toEqual(["never", "overdue", "soon", "ok"]);
  });
});
