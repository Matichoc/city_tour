/**
 * Detector de desnudos en el navegador (NSFW.js, modelo MobileNetV2, gratis y
 * sin enviar nada a terceros). Se carga solo cuando alguien elige un archivo.
 * No reemplaza la revisión del personal: quien sepa puede saltárselo, por eso
 * todo queda pendiente hasta que se aprueba en /admin.
 */
import { MAX_VIDEO_SECONDS, worst, type Scores } from "@/lib/media-policy";

type Classifier = {
  classify(
    img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  ): Promise<{ className: string; probability: number }[]>;
};

let model: Promise<Classifier> | null = null;

function loadModel(): Promise<Classifier> {
  model ??= (async () => {
    const [tf, { load }, { MobileNetV2Model }] = await Promise.all([
      import("@tensorflow/tfjs"),
      import("nsfwjs/core"),
      import("nsfwjs/models/mobilenet_v2"),
    ]);
    tf.enableProdMode();
    return load("MobileNetV2", { modelDefinitions: [MobileNetV2Model] });
  })();
  model.catch(() => (model = null));
  return model;
}

const toScores = (preds: { className: string; probability: number }[]) =>
  Object.fromEntries(preds.map((p) => [p.className, p.probability])) as Scores;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagen ilegible"));
    img.src = url;
  });
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadeddata = () => resolve(v);
    v.onerror = () => reject(new Error("video ilegible"));
    v.src = url;
  });
}

const seek = (v: HTMLVideoElement, t: number) =>
  new Promise<void>((resolve) => {
    v.onseeked = () => resolve();
    v.currentTime = t;
  });

export type CheckResult =
  | { ok: true; scores: Scores }
  | { ok: false; reason: "unreadable" | "tooLong" };

/** Revisa una foto o un video (8 cuadros repartidos en su duración). */
export async function checkFile(file: File): Promise<CheckResult> {
  const url = URL.createObjectURL(file);
  try {
    const nsfw = await loadModel();
    if (file.type.startsWith("image/")) {
      const img = await loadImage(url).catch(() => null);
      if (!img) return { ok: false, reason: "unreadable" };
      return { ok: true, scores: toScores(await nsfw.classify(img)) };
    }
    const video = await loadVideo(url).catch(() => null);
    if (!video || !Number.isFinite(video.duration) || !video.videoWidth)
      return { ok: false, reason: "unreadable" };
    if (video.duration > MAX_VIDEO_SECONDS)
      return { ok: false, reason: "tooLong" };
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      448 / Math.max(video.videoWidth, video.videoHeight),
    );
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, reason: "unreadable" };
    const frames: Scores[] = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      await seek(video, (video.duration * (i + 0.5)) / n);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(toScores(await nsfw.classify(canvas)));
    }
    return { ok: true, scores: worst(frames) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Sube un archivo con el enlace firmado que entregó el servidor. */
export async function uploadFile(url: string, file: File): Promise<boolean> {
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);
  const res = await fetch(url, {
    method: "PUT",
    body,
    headers: { "x-upsert": "false" },
  }).catch(() => null);
  return Boolean(res?.ok);
}
