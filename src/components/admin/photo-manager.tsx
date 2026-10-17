"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  makeCoverAction,
  removePlaceImageAction,
  uploadPlaceImage,
  type UploadResult,
} from "@/app/admin/places-actions";

type Img = {
  id: string;
  path: string;
  kind: "photo" | "menu" | "promo" | "logo";
  alt: string;
  credit: string | null;
};

const KINDS = ["photo", "logo", "menu", "promo"] as const;

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
  const [kind, setKind] = useState<(typeof KINDS)[number]>("photo");
  const [credit, setCredit] = useState("");
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(
    null,
  );
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
      setBusy({ done: i, total: list.length });
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

  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">{t("help")}</p>
      <p className="text-muted text-xs">{t("authNote")}</p>

      {images.length === 0 ? (
        <p className="text-muted text-sm">{t("none")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((i) => (
            <li
              key={i.id}
              className="border-border bg-surface overflow-hidden rounded-xl border"
            >
              <div className="bg-sea-soft aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa de una imagen ya guardada */}
                <img
                  src={i.path}
                  alt={i.alt}
                  loading="lazy"
                  className="size-full object-contain"
                />
              </div>
              <div className="space-y-1 p-2 text-xs">
                <p className="font-bold">{t(`kinds.${i.kind}`)}</p>
                {i.credit && <p className="text-muted">{i.credit}</p>}
                <form className="flex flex-wrap gap-1">
                  <input type="hidden" name="lugar" value={placeId} />
                  <input type="hidden" name="id" value={i.id} />
                  {i.kind === "photo" && (
                    <button
                      formAction={makeCoverAction}
                      className="border-border rounded-full border px-2 py-1 font-semibold"
                    >
                      {t("cover")}
                    </button>
                  )}
                  <button
                    formAction={removePlaceImageAction}
                    className="border-border text-coral-ink rounded-full border px-2 py-1 font-semibold"
                  >
                    {t("remove")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-border grid gap-3 rounded-xl border p-3 sm:grid-cols-3">
        <label className="text-sm font-semibold">
          {t("kind")}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`kinds.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("credit")}
          <input
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            maxLength={120}
            className="border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base"
          />
        </label>
        <div className="text-sm font-semibold">
          <label htmlFor="subir-imagenes">{t("pick")}</label>
          <input
            id="subir-imagenes"
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy !== null}
            onChange={(e) => void upload(e.target.files)}
            className="mt-1 block w-full text-sm font-normal"
          />
        </div>
      </div>

      {busy && (
        <p role="status" className="text-sea-deep text-sm font-bold">
          {t("uploading", busy)}
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
