import { describe, expect, it } from "vitest";
import { pickVoice, splitIntoChunks } from "@/lib/speech";

describe("trozos de lectura en voz alta", () => {
  it("separa por oraciones y limpia espacios", () => {
    expect(
      splitIntoChunks("Playa de arena.  Aguas calmas!\n¿Hay baños? Sí…"),
    ).toEqual(["Playa de arena.", "Aguas calmas!", "¿Hay baños?", "Sí…"]);
  });

  it("conserva el texto final sin punto", () => {
    expect(splitIntoChunks("Roots Salinas. Local de comida")).toEqual([
      "Roots Salinas.",
      "Local de comida",
    ]);
  });

  it("corta las oraciones largas por comas sin pasarse del máximo", () => {
    const long =
      "Su carta tiene churrascos y hamburguesas, completos, pizzas y fajitas, empanadas, chorrillanas y salchipapas, además de helados y churros.";
    const chunks = splitIntoChunks(long, 60);
    expect(chunks.every((c) => c.length <= 60)).toBe(true);
    expect(chunks.join(" ")).toBe(long);
    expect(chunks[0].endsWith(",")).toBe(true);
  });

  it("corta por espacio una oración larga sin comas", () => {
    const long = "palabra ".repeat(40).trim() + ".";
    const chunks = splitIntoChunks(long, 50);
    expect(chunks.every((c) => c.length <= 50)).toBe(true);
    expect(chunks.join(" ")).toBe(long);
  });

  it("devuelve nada para texto vacío", () => {
    expect(splitIntoChunks("   ")).toEqual([]);
  });
});

describe("elección de voz", () => {
  const voices = [
    { lang: "en-US", name: "Samantha" },
    { lang: "es-ES", name: "Mónica" },
    { lang: "es-MX", name: "Paulina" },
    { lang: "es-US", name: "Google español de Estados Unidos" },
    { lang: "pt-BR", name: "Luciana" },
  ];

  it("prefiere la del país pedido", () => {
    expect(
      pickVoice([...voices, { lang: "es-CL", name: "Catalina" }], "es-CL")
        ?.name,
    ).toBe("Catalina");
  });

  it("sin voz chilena, prefiere una latinoamericana natural antes que la de España", () => {
    expect(pickVoice(voices, "es-CL")?.name).toBe(
      "Google español de Estados Unidos",
    );
  });

  it("acepta códigos con guion bajo (Android)", () => {
    expect(pickVoice([{ lang: "pt_BR", name: "x" }], "pt-BR")?.name).toBe("x");
  });

  it("no devuelve una voz de otro idioma", () => {
    expect(pickVoice([{ lang: "en-US", name: "Samantha" }], "es-CL")).toBe(
      null,
    );
  });
});
