import { describe, expect, it } from "vitest";
import { hasProfanity } from "@/lib/profanity";

describe("hasProfanity", () => {
  it("detecta groserías aunque las disfracen", () => {
    for (const t of [
      "qué weón el que atiende",
      "WEOOOOON",
      "p.u.t.a la wea",
      "una m1erd4 el servicio",
      "conchetumare",
      "son unos IMBÉCILES",
      "what a shit place",
      "el dueño es un gil",
      "puros giles",
    ]) {
      expect(hasProfanity(t), t).toBe(true);
    }
  });

  it("no marca palabras normales que contienen las letras", () => {
    for (const t of [
      "Muy rica la comida, volvería",
      "La computadora del local",
      "Lindo picnic frente al mar",
      "Excelente atención, recomiendo las empanadas de queso",
      "Gilberto nos atendió muy bien",
      "El pescado estaba fresquísimo",
      "Disputa por estacionamiento, pero bien",
      "El bus llegó retrasado pero el paseo valió la pena",
      "Fuimos con la perrita y la aceptaron",
    ]) {
      expect(hasProfanity(t), t).toBe(false);
    }
  });
});
