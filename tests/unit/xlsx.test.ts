// @vitest-environment node
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { crc32, sheetName, xlsx } from "@/lib/xlsx";
import { metricsSheets } from "@/lib/admin/metrics-excel";
import type { MetricsReport } from "@/lib/metrics";

/** Lee un ZIP (directorio central) y devuelve sus archivos en texto. */
function unzip(buf: Buffer): Record<string, string> {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  const out: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    expect(buf.readUInt32LE(p)).toBe(0x02014b50);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lnameLen = buf.readUInt16LE(local + 26);
    const data = buf.subarray(
      local + 30 + lnameLen,
      local + 30 + lnameLen + size,
    );
    const raw = method === 8 ? inflateRawSync(data) : data;
    expect(crc32(raw)).toBe(crc);
    out[name] = raw.toString("utf8");
    p += 46 + nameLen;
  }
  return out;
}

describe("Excel (.xlsx) sin librerías", () => {
  it("arma un libro válido con sus hojas, números y textos", () => {
    const buf = xlsx([
      {
        name: "Resumen",
        rows: [
          ["Indicador", "Total"],
          ["Vistas «playa» & más", 12],
        ],
      },
      {
        name: "Por día",
        rows: [
          ["Fecha", "N"],
          ["2026-11-18", 3],
        ],
      },
    ]);
    expect(buf.subarray(0, 2).toString()).toBe("PK");
    const files = unzip(buf);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining([
        "[Content_Types].xml",
        "xl/workbook.xml",
        "xl/worksheets/sheet1.xml",
        "xl/worksheets/sheet2.xml",
        "xl/styles.xml",
      ]),
    );
    expect(files["xl/workbook.xml"]).toContain('name="Resumen"');
    const s1 = files["xl/worksheets/sheet1.xml"];
    expect(s1).toContain('<c r="B2"><v>12</v></c>');
    expect(s1).toContain("Vistas «playa» &amp; más");
  });

  it("los nombres de hoja respetan las reglas de Excel", () => {
    expect(sheetName("Búsquedas sin resultado: [todas]")).toBe(
      "Búsquedas sin resultado   todas",
    );
    expect(sheetName("x".repeat(40))).toHaveLength(31);
  });

  it("Métricas: una hoja por tema con los nombres de los lugares", () => {
    const report: MetricsReport = {
      days: 7,
      today: "2026-11-18",
      totals: [
        { name: "place_view", n: 10, prev: 5 },
        { name: "qr_visit", n: 2, prev: 0 },
      ],
      daily: [{ day: "2026-11-18", name: "place_view", n: 10 }],
      top: [{ name: "place_view", subject: "playa-chica-papudo", n: 10 }],
      details: [
        {
          name: "qr_visit",
          subject: "playa-chica-papudo",
          detail: "hostal",
          n: 2,
        },
      ],
      locales: [{ locale: "es", n: 12 }],
    };
    const sheets = metricsSheets(
      report,
      {
        place: (s) => (s === "playa-chica-papudo" ? "Playa Chica" : undefined),
        route: () => undefined,
        event: () => undefined,
        any: (s) => (s === "playa-chica-papudo" ? "Playa Chica" : s),
      },
      (k, v) => (v ? `${k}:${JSON.stringify(v)}` : k),
      (n) => n,
    );
    expect(sheets).toHaveLength(9);
    const places = sheets.find((s) => s.name === "xlsx.placesSheet")!;
    expect(places.rows[1][0]).toBe("Playa Chica");
    expect(places.rows[1].at(-1)).toBe(10);
    const summary = sheets[0];
    const vistas = summary.rows.find((r) => r[0] === "kpi.placeViews")!;
    expect(vistas.slice(1)).toEqual([10, 5, 100]);
    const qr = sheets.find((s) => s.name === "qrTitle")!;
    expect(qr.rows[1]).toEqual(["hostal", "Playa Chica", 2]);
    // Y el libro completo se puede abrir.
    expect(Object.keys(unzip(xlsx(sheets)))).toHaveLength(5 + sheets.length);
  });
});
