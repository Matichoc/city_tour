import { describe, expect, it } from "vitest";
import { parseCsv, sheetCsvUrl } from "@/lib/import/csv";
import {
  categoryOf,
  contactSnapshotOf,
  parseLink,
  parsePhone,
  parseTimestamp,
  planImport,
  readTable,
  snapshotOf,
  toRecord,
  type ExistingPlace,
} from "@/lib/import/places-sheet";

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
const ROOTS = [
  "17/10/2026 0:53:04",
  "ROOTS SALINAS",
  "Comida (restaurante, cocinería, café, heladería…)",
  "Las Salinas",
  "Estacionamiento playa Salinas de Pullally",
  '"CHURRASCO SALINERO"',
  "Temporada baja:\nMarzo a Diciembre\nSabados, Domingos y días festivos\n10:00 am  -  19:00 pm",
  "+56 9 7270 2991",
  "https://www.instagram.com/roots.salinas/",
  "https://maps.app.goo.gl/ephntUVKSy3yhpAN7",
  "Prefiero que las tomen ustedes cuando me visiten",
  "roco",
  "MICHAEL",
  "Michael@Example.com",
  "Soy dueño/a o encargado/a del negocio y autorizo publicar",
];
const csv = (...rows: string[][]) =>
  rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
const LOCS = [
  { slug: "papudo", names: ["Papudo"] },
  { slug: "las-salinas-papudo", names: ["Las Salinas"] },
  { slug: "pullally", names: ["Pullally"] },
];

describe("lector de CSV", () => {
  it("entiende comillas, comas y saltos de línea dentro de una celda", () => {
    const rows = parseCsv(csv(HEAD, ROOTS));
    expect(rows).toHaveLength(2);
    expect(rows[1]![5]).toBe('"CHURRASCO SALINERO"');
    expect(rows[1]![6]).toContain("\n");
    expect(parseCsv("﻿a,b\n1,2\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  it("arma el enlace de descarga solo para Google Sheets", () => {
    const id = "1cR1ThHr70lOzbxuKF04zqujO_09AN1UVXJfJxSmlOR0";
    expect(
      sheetCsvUrl(
        `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`,
      ),
    ).toBe(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);
    expect(
      sheetCsvUrl(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=77`),
    ).toContain("&gid=77");
    expect(sheetCsvUrl("https://evil.com/spreadsheets/d/" + id)).toBeNull();
    expect(
      sheetCsvUrl("http://docs.google.com/spreadsheets/d/" + id),
    ).toBeNull();
    expect(sheetCsvUrl("hola")).toBeNull();
  });
});

describe("valores de la planilla", () => {
  it("lee la hora de Chile de la marca temporal", () => {
    expect(parseTimestamp("17/10/2026 0:53:04")).toBe(
      "2026-10-17T03:53:04.000Z",
    );
    expect(parseTimestamp("1/7/2026 12:00:00")).toBe(
      "2026-07-01T16:00:00.000Z",
    );
    expect(parseTimestamp("ayer")).toBeNull();
  });
  it("normaliza teléfonos chilenos", () => {
    expect(parsePhone("+56 9 7270 2991")).toEqual({
      kind: "whatsapp",
      value: "+56972702991",
    });
    expect(parsePhone("972702991")).toEqual({
      kind: "whatsapp",
      value: "+56972702991",
    });
    expect(parsePhone("(33) 271 1234")).toEqual({
      kind: "phone",
      value: "+56332711234",
    });
    expect(parsePhone("hola")).toBeNull();
  });
  it("reconoce la categoría por lo que ofrece", () => {
    expect(
      categoryOf("Comida (restaurante, cocinería, café, heladería…)"),
    ).toBe("gastronomia");
    expect(categoryOf("Alojamiento (cabañas, hostal, camping)")).toBe(
      "alojamiento",
    );
    expect(categoryOf("Excursiones y paseos")).toBe("recreacion");
    expect(categoryOf("Otro")).toBeNull();
  });
  it("separa Instagram de otros enlaces", () => {
    expect(parseLink("@roots.salinas")).toEqual({
      instagram: "https://www.instagram.com/roots.salinas/",
    });
    expect(parseLink("https://www.instagram.com/roots.salinas")).toEqual({
      instagram: "https://www.instagram.com/roots.salinas/",
    });
    expect(parseLink("www.facebook.com/roots")).toEqual({
      website: "https://www.facebook.com/roots",
    });
    expect(parseLink("")).toEqual({});
  });
});

describe("lectura de la tabla", () => {
  it("encuentra las columnas por su nombre y avisa de las nuevas", () => {
    const t = readTable(
      parseCsv(csv([...HEAD, "¿Aceptas tarjeta?"], [...ROOTS, "Sí"])),
    );
    expect(t.unknown).toEqual(["¿Aceptas tarjeta?"]);
    expect(t.rows[0]).toMatchObject({
      name: "ROOTS SALINAS",
      locality: "Las Salinas",
    });
  });
  it("no depende del orden de las columnas", () => {
    const t = readTable([
      ["Tu correo", "¿Cómo se llama tu negocio?"],
      ["a@b.cl", "Casa Mar"],
    ]);
    expect(t.rows[0]).toEqual({ contactEmail: "a@b.cl", name: "Casa Mar" });
  });
  it("arma el registro de Roots Salinas", () => {
    const t = readTable(parseCsv(csv(HEAD, ROOTS)));
    const { record } = toRecord(t.rows[0]!, LOCS);
    expect(record).toMatchObject({
      key: "roots-salinas",
      categorySlug: "gastronomia",
      localitySlug: "las-salinas-papudo",
      phrase: "CHURRASCO SALINERO",
      ctaKind: "whatsapp",
      ctaValue: "+56972702991",
      instagram: "https://www.instagram.com/roots.salinas/",
      mapsUrl: "https://maps.app.goo.gl/ephntUVKSy3yhpAN7",
      contactEmail: "michael@example.com",
      confirmedAt: "2026-10-17T03:53:04.000Z",
    });
    expect(record!.hoursText).toContain("Marzo a Diciembre");
  });
  it("omite filas sin nombre o sin autorización", () => {
    expect(toRecord({ name: "", authorization: "sí" }, LOCS).skip).toBe(
      "noName",
    );
    expect(toRecord({ name: "X", authorization: "" }, LOCS).skip).toBe(
      "noAuthorization",
    );
  });
});

const existing = (o: Partial<ExistingPlace> = {}): ExistingPlace => ({
  id: "1",
  slug: "roots-salinas",
  name: "Roots Salinas",
  importKey: null,
  snapshot: null,
  infoUpdatedAt: "2026-10-17T03:53:04.000Z",
  ...o,
});
const table = (...rows: string[][]) => readTable(parseCsv(csv(HEAD, ...rows)));

describe("plan de importación", () => {
  it("un comercio que no existe se crea", () => {
    const { items } = planImport(table(ROOTS), [], LOCS);
    expect(items[0]).toMatchObject({ status: "new", needsCategory: false });
  });
  it("sin rubro reconocible, pide elegir la categoría", () => {
    const row = [...ROOTS];
    row[2] = "Otra cosa";
    expect(planImport(table(row), [], LOCS).items[0]).toMatchObject({
      status: "new",
      needsCategory: true,
    });
  });
  it("un comercio que ya estaba en la guía se vincula sin tocar sus datos", () => {
    const { items } = planImport(table(ROOTS), [existing()], LOCS);
    expect(items[0]).toMatchObject({ status: "link" });
    expect(items[0]!.existing?.slug).toBe("roots-salinas");
  });
  it("sin cambios desde la última importación, no se carga nada", () => {
    const rec = toRecord(table(ROOTS).rows[0]!, LOCS).record!;
    const ex = existing({ importKey: rec.key, snapshot: snapshotOf(rec) });
    expect(planImport(table(ROOTS), [ex], LOCS).items[0]).toMatchObject({
      status: "same",
      changed: [],
    });
  });
  it("si cambió un dato, solo ese dato se actualiza", () => {
    const rec = toRecord(table(ROOTS).rows[0]!, LOCS).record!;
    const ex = existing({ importKey: rec.key, snapshot: snapshotOf(rec) });
    const row = [...ROOTS];
    row[6] = "Todos los días 10:00 - 20:00";
    const item = planImport(table(row), [ex], LOCS).items[0]!;
    expect(item.status).toBe("update");
    expect(item.changed).toEqual(["hoursText"]);
  });
  it("si volvió a responder con lo mismo, solo se actualiza la fecha", () => {
    const rec = toRecord(table(ROOTS).rows[0]!, LOCS).record!;
    const ex = existing({
      importKey: rec.key,
      snapshot: snapshotOf(rec),
      infoUpdatedAt: "2026-04-01T00:00:00.000Z",
    });
    expect(planImport(table(ROOTS), [ex], LOCS).items[0]!.status).toBe(
      "confirm",
    );
  });
  it("de varias respuestas del mismo comercio manda la más reciente", () => {
    const newer = [...ROOTS];
    newer[0] = "20/10/2026 10:00:00";
    newer[7] = "+56 9 1111 2222";
    const { items } = planImport(table(newer, ROOTS), [], LOCS);
    expect(items).toHaveLength(1);
    expect(items[0]!.duplicates).toBe(1);
    expect(items[0]!.record!.ctaValue).toBe("+56911112222");
  });
  it("las filas sin autorización se avisan y no se importan", () => {
    const row = [...ROOTS];
    row[14] = "";
    const { items } = planImport(table(row), [], LOCS);
    expect(items[0]).toMatchObject({
      status: "skip",
      reason: "noAuthorization",
    });
  });
});

// PRIV-01: el contacto (nombre y correo) no va en el snapshot público.
describe("snapshot sin datos personales", () => {
  const rec = () => toRecord(table(ROOTS).rows[0]!, LOCS).record!;
  const withContact = (name: string, email: string) => {
    const row = [...ROOTS];
    row[12] = name;
    row[13] = email;
    return row;
  };

  it("snapshotOf no incluye nombre ni correo de contacto", () => {
    const snap = snapshotOf(rec());
    expect(Object.keys(snap)).not.toContain("contactName");
    expect(Object.keys(snap)).not.toContain("contactEmail");
    expect(JSON.stringify(snap)).not.toMatch(/@/);
  });

  it("el contacto va en su propio snapshot, aparte", () => {
    const r = toRecord(
      table(withContact("Ana", "ANA@ejemplo.cl")).rows[0]!,
      LOCS,
    ).record!;
    expect(contactSnapshotOf(r)).toEqual({
      contactName: "Ana",
      contactEmail: "ana@ejemplo.cl",
    });
  });

  it("detecta un cambio de contacto comparando con el snapshot privado", () => {
    const r = toRecord(
      table(withContact("Ana", "ana@ejemplo.cl")).rows[0]!,
      LOCS,
    ).record!;
    const ex = existing({
      importKey: r.key,
      snapshot: snapshotOf(r),
      contactSnapshot: { contactName: "Ana", contactEmail: "ana@ejemplo.cl" },
    });
    expect(
      planImport(table(withContact("Ana", "ana@ejemplo.cl")), [ex], LOCS)
        .items[0],
    ).toMatchObject({ status: "same", changed: [] });
    const item = planImport(
      table(withContact("Ana", "otra@ejemplo.cl")),
      [ex],
      LOCS,
    ).items[0]!;
    expect(item).toMatchObject({
      status: "update",
      changed: ["contactEmail"],
    });
  });

  it("filas antiguas, con el contacto aún dentro del snapshot, se siguen comparando", () => {
    const r = toRecord(
      table(withContact("Ana", "ana@ejemplo.cl")).rows[0]!,
      LOCS,
    ).record!;
    const legacy = {
      ...snapshotOf(r),
      contactName: "Ana",
      contactEmail: "ana@ejemplo.cl",
    };
    const ex = existing({ importKey: r.key, snapshot: legacy });
    expect(
      planImport(table(withContact("Ana", "ana@ejemplo.cl")), [ex], LOCS)
        .items[0]!.status,
    ).toBe("same");
    expect(
      planImport(table(withContact("Beto", "ana@ejemplo.cl")), [ex], LOCS)
        .items[0]!.changed,
    ).toEqual(["contactName"]);
  });

  it("sin referencia previa de contacto, no se inventa un cambio", () => {
    const r = rec();
    const ex = existing({ importKey: r.key, snapshot: snapshotOf(r) });
    expect(planImport(table(ROOTS), [ex], LOCS).items[0]!.changed).toEqual([]);
  });
});
