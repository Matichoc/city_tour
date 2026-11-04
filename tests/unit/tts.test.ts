import { describe, expect, it } from "vitest";
import { azureConfig, sentences, ssml, STYLE, VOICES } from "@/lib/tts/azure";
import { audioPath, publicAudioUrl } from "@/lib/tts/store";

describe("voz natural de «Escuchar»", () => {
  it("usa Catalina para el español de Chile, pausada y con pausas entre frases", () => {
    expect(VOICES.es.voice).toBe("es-CL-CatalinaNeural");
    expect(ssml("Playa Chica. Arena fina.", "es")).toBe(
      '<speak version="1.0" xml:lang="es-CL"><voice name="es-CL-CatalinaNeural">' +
        `<prosody rate="${STYLE.rate}">Playa Chica. <break time="${STYLE.pauseMs}ms"/> Arena fina.</prosody>` +
        "</voice></speak>",
    );
  });

  it("separa en frases sin perder texto", () => {
    expect(
      sentences("Roots Salinas. ¿Abre hoy? Sí… Churrasco salinero"),
    ).toEqual(["Roots Salinas.", "¿Abre hoy?", "Sí…", "Churrasco salinero"]);
  });

  it("escapa el texto para que no rompa el SSML", () => {
    expect(ssml(`Café & mar <"Roots">`, "es")).toContain(
      "Café &amp; mar &lt;&quot;Roots&quot;&gt;",
    );
  });

  it("sin clave o región de Azure no hay voz (nunca la del dispositivo)", () => {
    expect(azureConfig({})).toBe(null);
    expect(azureConfig({ AZURE_SPEECH_KEY: "k" })).toBe(null);
    expect(
      azureConfig({
        AZURE_SPEECH_KEY: " k ",
        AZURE_SPEECH_REGION: "brazilsouth",
      }),
    ).toEqual({ key: "k", region: "brazilsouth" });
  });
});

describe("archivos de audio", () => {
  const secret = "s".repeat(40);

  it("el mismo texto y voz dan siempre el mismo archivo, con su firma", () => {
    const a = audioPath("Playa Chica.", "es", secret);
    expect(audioPath("Playa Chica.", "es", secret)).toBe(a);
    expect(a).toMatch(/^es\/[0-9a-f]{32}\.[A-Za-z0-9_-]{43}\.mp3$/);
  });

  it("un texto editado o en otro idioma da un archivo nuevo", () => {
    const a = audioPath("Playa Chica.", "es", secret);
    expect(audioPath("Playa Chica, resguardada.", "es", secret)).not.toBe(a);
    expect(audioPath("Playa Chica.", "en", secret)).not.toBe(a);
  });

  it("sin el secreto no se puede adivinar la firma", () => {
    const a = audioPath("Playa Chica.", "es", secret);
    const b = audioPath("Playa Chica.", "es", "otro".repeat(10));
    expect(a.split(".")[0]).toBe(b.split(".")[0]);
    expect(a).not.toBe(b);
  });

  it("la URL pública apunta al bucket de audio", () => {
    expect(publicAudioUrl("https://x.supabase.co", "es/abc.mp3")).toBe(
      "https://x.supabase.co/storage/v1/object/public/listen-audio/es/abc.mp3",
    );
  });
});
