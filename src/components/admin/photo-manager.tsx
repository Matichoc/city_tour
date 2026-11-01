"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  makeCoverAction,
  moveImageAction,
  prepareVideoUpload,
  registerVideo,
  removePlaceImageAction,
  updateImageAction,
  uploadPlaceImage,
  type UploadResult,
} from "@/app/admin/places-actions";
import { uploadFile } from "@/lib/media-check";

type Img = {
  id: string;
  path: string;
  kind: "photo" | "menu" | "promo" | "logo" | "video";
  alt: string;
  credit: string | null;
};

const KINDS = ["photo", "logo", "menu", "promo"] as const;
const MAX_VIDEO_MB = 50;
const field =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base";
const chip =
  "border-border rounded-full border px-2 py-1 text-xs font-semibold";

/**
 * Achica la foto en el navegador antes de subirla: las del celular pesan
 * varios MB y el servidor acepta pocos por pedido. El servidor la vuelve a
 * procesar (WebP, sin metadatos).
 */
async function shrink(file: File, max: number): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/webp", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

/** Ancho y alto de un video (el navegador lo lee de sus metadatos). */
function videoSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => {
      const size =
        v.videoWidth && v.videoHeight
          ? { width: v.videoWidth, height: v.videoHeight }
          : null;
      URL.revokeObjectURL(url);
      resolve(size);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    v.src = url;
  });
}

export function PhotoManager({
  placeId,
  images,
}: {
  placeId: string;
  images: Img[];
}) {
  const t = useTranslations("admin.places.photos");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("photo");
  const [credit, setCredit] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [uploaded, setUploaded] = useState(0);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setMessages([]);
    setUploaded(0);
    let ok = 0;
    const problems: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const original = list[i]!;
      setBusy(t("uploading", { done: i, total: list.length }));
      const file = await shrink(original, kind === "logo" ? 512 : 1600);
      const body = new FormData();
      body.set("id", placeId);
      body.set("tipo", kind);
      body.set("credito", credit);
      body.set("archivo", file);
      const res: UploadResult = await uploadPlaceImage(body).catch(
        () => ({ ok: false, error: "save" }) as const,
      );
      if (res.ok) ok++;
      else problems.push(t(`errors.${res.error}`, { name: original.name }));
    }
    setBusy(null);
    setUploaded(ok);
    setMessages(problems);
    if (input.current) input.current.value = "";
    // Vuelve a pedir la lista al servidor (orden y enlaces salen de la base).
    if (ok > 0) router.refresh();
  }

  /** Autoriza en el servidor, sube directo a Storage y registra en la ficha. */
  async function uploadVideos(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setMessages([]);
    setUploaded(0);
    let ok = 0;
    const problems: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i]!;
      const name = file.name;
      setBusy(t("uploadingVideo", { name, done: i + 1, total: list.length }));
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        problems.push(t("errors.videoSize", { name, max: MAX_VIDEO_MB }));
        continue;
      }
      const size = await videoSize(file);
      if (!size) {
        problems.push(t("errors.videoRead", { name }));
        continue;
      }
      const prep = new FormData();
      prep.set("id", placeId);
      prep.set("mime", file.type);
      prep.set("size", String(file.size));
      const prepared = await prepareVideoUpload(prep).catch(
        () => ({ ok: false, error: "save" }) as const,
      );
      if (!prepared.ok) {
        problems.push(
          t(
            prepared.error === "type"
              ? "errors.videoType"
              : prepared.error === "size"
                ? "errors.videoSize"
                : `errors.${prepared.error}`,
            { name, max: MAX_VIDEO_MB },
          ),
        );
        continue;
      }
      if (!(await uploadFile(prepared.uploadUrl, file))) {
        problems.push(t("errors.save", { name }));
        continue;
      }
      const reg = new FormData();
      reg.set("id", placeId);
      reg.set("path", prepared.path);
      reg.set("ancho", String(size.width));
      reg.set("alto", String(size.height));
      reg.set("credito", credit);
      const done = await registerVideo(reg).catch(
        () => ({ ok: false, error: "save" }) as const,
      );
      if (done.ok) ok++;
      else problems.push(t(`errors.${done.error}`, { name }));
    }
    setBusy(null);
    setUploaded(ok);
    setMessages(problems);
    if (videoInput.current) videoInput.current.value = "";
    if (ok > 0) router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">{t("help")}</p>
      <p className="text-muted text-xs">{t("authNote")}</p>

      {images.length === 0 ? (
        <p className="text-muted text-sm">{t("none")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((i, at) => (
            <li
              key={i.id}
              className="border-border bg-surface flex flex-col overflow-hidden rounded-xl border"
            >
              <div className="bg-sea-soft aspect-square">
                {i.kind === "video" ? (
                  <video
                    src={i.path}
                    aria-label={i.alt}
                    controls
                    preload="metadata"
                    playsInline
                    className="size-full bg-black object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- vista previa de una imagen ya guardada
                  <img
                    src={i.path}
                    alt={i.alt}
                    loading="lazy"
                    className="size-full object-contain"
                  />
                )}
              </div>
              <div className="space-y-2 p-2 text-xs">
                <p className="font-bold">{t(`kinds.${i.kind}`)}</p>
                {i.credit && <p className="text-muted">{i.credit}</p>}
                <form className="flex flex-wrap gap-1">
                  <input type="hidden" name="lugar" value={placeId} />
                  <input type="hidden" name="id" value={i.id} />
                  <button
                    type="submit"
                    formAction={moveImageAction.bind(null, "up")}
                    disabled={at === 0}
                    aria-label={t("moveUp")}
                    className={`${chip} disabled:opacity-40`}
                  >
                    ↑
                  </button>
                  <button
                    type="submit"
                    formAction={moveImageAction.bind(null, "down")}
                    disabled={at === images.length - 1}
                    aria-label={t("moveDown")}
                    className={`${chip} disabled:opacity-40`}
                  >
                    ↓
                  </button>
                  {i.kind === "photo" && (
                    <button formAction={makeCoverAction} className={chip}>
                      {t("cover")}
                    </button>
                  )}
                  <button
                    formAction={removePlaceImageAction}
                    className={`${chip} text-coral-ink`}
                  >
                    {t("remove")}
                  </button>
                </form>
                <details>
                  <summary className="cursor-pointer font-semibold">
                    {t("editText")}
                  </summary>
                  <form action={updateImageAction} className="mt-2 space-y-2">
                    <input type="hidden" name="lugar" value={placeId} />
                    <input type="hidden" name="id" value={i.id} />
                    <label className="block font-semibold">
                      {t("alt")}
                      <textarea
                        name="alt"
                        rows={3}
                        required
                        minLength={3}
                        maxLength={300}
                        defaultValue={i.alt}
                        className={field}
                      />
                    </label>
                    <label className="block font-semibold">
                      {t("credit")}
                      <input
                        name="credito"
                        maxLength={120}
                        defaultValue={i.credit ?? ""}
                        className={field}
                      />
                    </label>
                    <button
                      type="submit"
                      className="bg-sea-deep rounded-full px-3 py-1 font-bold text-white"
                    >
                      {t("saveText")}
                    </button>
                  </form>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-border space-y-3 rounded-xl border p-3">
        <label className="block max-w-md text-sm font-semibold">
          {t("credit")}
          <input
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            maxLength={120}
            className={field}
          />
          <span className="text-muted text-xs font-normal">
            {t("creditHelp")}
          </span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold">
              {t("kind")}
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
                className={field}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`kinds.${k}`)}
                  </option>
                ))}
              </select>
            </label>
            <label
              htmlFor="subir-imagenes"
              className="block text-sm font-semibold"
            >
              {t("pick")}
            </label>
            <input
              id="subir-imagenes"
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy !== null}
              onChange={(e) => void upload(e.target.files)}
              className="block w-full text-sm"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("videoTitle")}</p>
            <p className="text-muted text-xs">
              {t("videoHelp", { max: MAX_VIDEO_MB })}
            </p>
            <label
              htmlFor="subir-videos"
              className="block text-sm font-semibold"
            >
              {t("videoPick")}
            </label>
            <input
              id="subir-videos"
              ref={videoInput}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              multiple
              disabled={busy !== null}
              onChange={(e) => void uploadVideos(e.target.files)}
              className="block w-full text-sm"
            />
          </div>
        </div>
      </div>

      {busy && (
        <p role="status" className="text-sea-deep text-sm font-bold">
          {busy}
        </p>
      )}
      {!busy && uploaded > 0 && (
        <p role="status" className="text-field-deep text-sm font-bold">
          {t("uploaded", { count: uploaded })}
        </p>
      )}
      {messages.map((m) => (
        <p key={m} role="alert" className="text-coral-ink text-sm font-bold">
          {m}
        </p>
      ))}
    </div>
  );
}
