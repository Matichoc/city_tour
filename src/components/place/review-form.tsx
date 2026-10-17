"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  finishReviewMedia,
  submitReview,
  type SubmitState,
} from "@/lib/reviews-actions";
import {
  ACCEPT,
  isObscene,
  kindOf,
  MAX_BYTES,
  MAX_FILES,
  MAX_VIDEOS,
  type Scores,
} from "@/lib/media-policy";
import type { ReviewEntity } from "@/lib/reviews";
import { StarShape } from "@/components/ui/stars";

const MESSAGE: Record<Exclude<SubmitState["status"], "idle" | "ok">, string> = {
  rating: "errorRating",
  text: "errorText",
  profanity: "errorProfanity",
  rate: "errorRate",
  media: "errorMedia",
  error: "errorGeneric",
};

type Picked = {
  id: number;
  file: File;
  preview: string;
  scores: Scores | null;
};

type FormState = SubmitState & { mediaPending?: number };

/** Formulario de opinión real: se publica al enviarlo (con filtro y límite). */
export function ReviewForm({
  entity,
  slug,
  entityName,
}: {
  entity: ReviewEntity;
  slug: string;
  entityName: string;
}) {
  const t = useTranslations("reviews");
  // Archivos elegidos: también en una ref, para leerlos al terminar el envío.
  const [files, setFilesState] = useState<Picked[]>([]);
  const filesRef = useRef<Picked[]>([]);
  const setFiles = (next: Picked[]) => {
    filesRef.current = next;
    setFilesState(next);
  };
  const nextId = useRef(0);
  const [notice, setNotice] = useState<string | null>(null);
  const checking = files.some((f) => f.scores === null);

  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result: FormState = await submitReview(prev, formData);
      if (result.status !== "ok") return result;
      const picked = filesRef.current;
      for (const f of picked) URL.revokeObjectURL(f.preview);
      setFiles([]);
      if (!result.uploads || !result.reviewId) return result;
      // El texto ya está publicado: se suben los archivos y quedan en revisión.
      const { uploadFile } = await import("@/lib/media-check");
      const sent = await Promise.all(
        result.uploads.map((url, i) =>
          picked[i] ? uploadFile(url, picked[i].file) : false,
        ),
      );
      const pendingCount = sent.some(Boolean)
        ? await finishReviewMedia(result.reviewId)
        : 0;
      return {
        ...result,
        mediaPending: pendingCount,
        mediaFailed: pendingCount === 0,
      };
    },
    { status: "idle" },
  );

  async function pick(list: FileList | null) {
    setNotice(null);
    if (!list?.length) return;
    let current = filesRef.current;
    for (const file of Array.from(list)) {
      const kind = kindOf(file.type);
      const videos = current.filter((f) => kindOf(f.file.type) === "video");
      if (!kind) {
        setNotice(t("badType", { name: file.name }));
        continue;
      }
      if (file.size > MAX_BYTES) {
        setNotice(t("tooBig", { name: file.name }));
        continue;
      }
      if (
        current.length >= MAX_FILES ||
        (kind === "video" && videos.length >= MAX_VIDEOS)
      ) {
        setNotice(t("tooMany"));
        break;
      }
      const item: Picked = {
        id: nextId.current++,
        file,
        preview: URL.createObjectURL(file),
        scores: null,
      };
      current = [...current, item];
      setFiles(current);
    }
    // Revisión en el navegador, de a uno (el modelo usa la GPU).
    const { checkFile } = await import("@/lib/media-check");
    for (const item of current.filter((f) => f.scores === null)) {
      const result = await checkFile(item.file).catch(
        () => ({ ok: false, reason: "unreadable" }) as const,
      );
      const name = item.file.name;
      if (!result.ok || isObscene(result.scores)) {
        URL.revokeObjectURL(item.preview);
        setNotice(
          !result.ok ? t(result.reason, { name }) : t("blocked", { name }),
        );
        setFiles(filesRef.current.filter((f) => f.id !== item.id));
      } else {
        setFiles(
          filesRef.current.map((f) =>
            f.id === item.id ? { ...f, scores: result.scores } : f,
          ),
        );
      }
    }
  }

  function remove(id: number) {
    const item = filesRef.current.find((f) => f.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    setFiles(filesRef.current.filter((f) => f.id !== id));
  }
  // Campos controlados: React limpia el formulario tras cada envío, y ante un
  // error no se debe perder lo escrito. Se vacían solo al publicar.
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [lastOk, setLastOk] = useState<SubmitState | null>(null);
  if (state.status === "ok" && state !== lastOk) {
    setLastOk(state);
    setRating(0);
    setText("");
    setName("");
  }
  const meta = JSON.stringify(
    files
      .filter((f) => f.scores)
      .map((f) => ({ mime: f.file.type, size: f.file.size, scores: f.scores })),
  );

  return (
    <form
      action={action}
      className="bg-sea-soft mt-5 flex flex-col gap-3 rounded-2xl p-4"
    >
      <h3 className="font-display text-xl font-extrabold">
        {t("writeTitle", { name: entityName })}
      </h3>
      <input type="hidden" name="entidad" value={entity} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="anonimo" value={t("anonymous")} />
      <input type="hidden" name="estrellas" value={rating || ""} />
      <input type="hidden" name="archivos" value={files.length ? meta : ""} />
      {/* Campo trampa para robots: oculto para las personas. */}
      <input
        type="text"
        name="sitio"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-bold">{t("ratingLegend")}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="focus-within:outline-sea relative grid size-12 cursor-pointer place-items-center rounded-xl focus-within:outline-3"
            >
              <input
                type="radio"
                name="estrellas-opcion"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <span className="sr-only">{t("starOption", { n })}</span>
              <StarShape
                filled={n <= rating}
                className="size-9 transition peer-checked:scale-110"
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm font-bold">
        {t("textLabel")}
        <textarea
          name="texto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          minLength={5}
          maxLength={500}
          rows={3}
          placeholder={t("textPlaceholder")}
          className="border-border bg-background min-h-24 rounded-xl border px-3 py-2 font-normal"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-bold">
        {t("nameLabel")}
        <input
          name="nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder={t("namePlaceholder")}
          className="border-border bg-background min-h-12 rounded-xl border px-3 font-normal"
        />
      </label>
      <div className="flex flex-col gap-2 text-sm font-bold">
        <label htmlFor={`${slug}-archivos`}>{t("mediaLabel")}</label>
        <input
          id={`${slug}-archivos`}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={pending || files.length >= MAX_FILES}
          onChange={(e) => {
            void pick(e.target.files);
            e.target.value = "";
          }}
          className="file:bg-surface file:border-border text-sm font-normal file:mr-3 file:min-h-11 file:rounded-full file:border file:px-4 file:font-bold"
        />
        <p className="text-muted text-xs font-normal">{t("mediaHelp")}</p>
        {files.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="border-border relative size-20 overflow-hidden rounded-xl border bg-white"
              >
                {kindOf(f.file.type) === "video" ? (
                  <video
                    src={f.preview}
                    muted
                    className="size-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
                  <img
                    src={f.preview}
                    alt=""
                    className="size-full object-cover"
                  />
                )}
                {f.scores === null ? (
                  <span className="bg-sea-deep/70 absolute inset-0 grid place-items-center text-[11px] text-white">
                    {t("checking")}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  aria-label={t("remove", { name: f.file.name })}
                  className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-white/90 text-base leading-none shadow"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {notice ? (
          <p role="alert" className="text-sm font-bold text-[#a22f18]">
            {notice}
          </p>
        ) : null}
      </div>
      {state.status !== "idle" && state.status !== "ok" ? (
        <p role="alert" className="text-sm font-bold text-[#a22f18]">
          {t(MESSAGE[state.status])}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || checking}
        className="bg-coral text-coral-ink min-h-12 self-start rounded-full px-6 font-extrabold shadow-sm active:scale-95 disabled:opacity-60"
      >
        {pending
          ? files.length
            ? t("uploading")
            : t("sending")
          : checking
            ? t("checking")
            : t("submit")}
      </button>
      {state.status === "ok" ? (
        <p role="status" className="text-sea-deep text-sm font-bold">
          {t("published")}
          {state.mediaPending ? <> {t("mediaPending")}</> : null}
        </p>
      ) : null}
      {state.status === "ok" && state.mediaFailed ? (
        <p role="alert" className="text-sm font-bold text-[#a22f18]">
          {t("mediaFailed")}
        </p>
      ) : null}
    </form>
  );
}
