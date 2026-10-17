"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { submitReview, type SubmitState } from "@/lib/reviews-actions";
import type { ReviewEntity } from "@/lib/reviews";
import { StarShape } from "@/components/ui/stars";

const MESSAGE: Record<Exclude<SubmitState["status"], "idle" | "ok">, string> = {
  rating: "errorRating",
  text: "errorText",
  profanity: "errorProfanity",
  rate: "errorRate",
  error: "errorGeneric",
};

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
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitReview,
    { status: "idle" },
  );
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
      {state.status !== "idle" && state.status !== "ok" ? (
        <p role="alert" className="text-sm font-bold text-[#a22f18]">
          {t(MESSAGE[state.status])}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-coral text-coral-ink min-h-12 self-start rounded-full px-6 font-extrabold shadow-sm active:scale-95 disabled:opacity-60"
      >
        {pending ? t("sending") : t("submit")}
      </button>
      {state.status === "ok" ? (
        <p role="status" className="text-sea-deep text-sm font-bold">
          {t("published")}
        </p>
      ) : null}
    </form>
  );
}
