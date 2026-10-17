"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { addMyReview, removeMyReview, useMyReviews } from "@/lib/reviews-store";
import { StarShape, Stars } from "@/components/ui/stars";

export type SeededReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  ownerReply: string | null;
};

function stats(ratings: number[]) {
  const count = ratings.length;
  const average = count ? ratings.reduce((a, b) => a + b, 0) / count : null;
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: ratings.filter((r) => r === n).length,
  }));
  return { count, average, dist };
}

/** Resumen de estrellas para el encabezado de una ficha de ejemplo (incluye la opinión del visitante). */
export function RatingSummary({
  slug,
  seededRatings,
}: {
  slug: string;
  seededRatings: number[];
}) {
  const t = useTranslations("reviews");
  const mine = useMyReviews(slug);
  const { count, average } = stats([
    ...seededRatings,
    ...mine.map((r) => r.rating),
  ]);
  return (
    <a
      href="#opiniones"
      className="text-muted mt-2 inline-flex items-center gap-2 text-sm hover:underline"
    >
      <Stars value={average ?? 0} className="size-4" />
      {average !== null ? (
        <span>
          <b className="text-foreground">{average.toFixed(1)}</b> ·{" "}
          {t("count", { count })}
        </span>
      ) : (
        t("count", { count: 0 })
      )}
    </a>
  );
}

/**
 * Opiniones de una ficha o evento de EJEMPLO: muestra opiniones simuladas y
 * deja que el visitante escriba la suya para ver cómo funciona. Todo queda en
 * este dispositivo.
 */
export function DemoReviews({
  slug,
  seeded,
  entityName,
}: {
  slug: string;
  seeded: SeededReview[];
  entityName: string;
}) {
  const t = useTranslations("reviews");
  const mine = useMyReviews(slug);
  const uid = useId();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<"rating" | "text" | null>(null);
  const [thanks, setThanks] = useState(false);

  const { count, average, dist } = useMemo(
    () => stats([...seeded.map((r) => r.rating), ...mine.map((r) => r.rating)]),
    [seeded, mine],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return setError("rating");
    if (text.trim().length < 5) return setError("text");
    addMyReview(slug, { rating, text, name });
    setRating(0);
    setText("");
    setName("");
    setError(null);
    setThanks(true);
  }

  return (
    <section
      id="opiniones"
      aria-labelledby="opiniones-title"
      className="border-border bg-surface scroll-mt-32 rounded-2xl border p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="opiniones-title"
          className="font-display text-2xl font-extrabold"
        >
          {t("title")}
        </h2>
        <span className="text-muted text-sm">{t("count", { count })}</span>
      </div>

      <p
        role="note"
        className="bg-sun/25 text-earth mt-3 rounded-xl p-3 text-sm font-semibold"
      >
        {t("demoNote")}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-start gap-1">
          <p className="font-display text-5xl leading-none font-extrabold">
            {average !== null ? average.toFixed(1) : "—"}
          </p>
          <Stars value={average ?? 0} />
          <p className="text-muted text-xs">
            {average !== null ? t("outOf5", { count }) : t("noRating")}
          </p>
        </div>
        <ul className="flex flex-col gap-1" aria-label={t("distribution")}>
          {dist.map(({ n, count: c }) => (
            <li key={n} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0">{t(`level.${n}`)}</span>
              <span className="bg-sea-soft h-2 flex-1 overflow-hidden rounded-full">
                <span
                  className="block h-full rounded-full bg-[#f59e0b]"
                  style={{ width: count ? `${(c / count) * 100}%` : "0%" }}
                />
              </span>
              <span className="text-muted w-4 text-right">{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={submit}
        className="bg-sea-soft mt-5 flex flex-col gap-3 rounded-2xl p-4"
        noValidate
      >
        <h3 className="font-display text-xl font-extrabold">
          {t("writeTitle", { name: entityName })}
        </h3>
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
                  name={`${uid}-rating`}
                  value={n}
                  checked={rating === n}
                  onChange={() => {
                    setRating(n);
                    setError(null);
                  }}
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
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            maxLength={500}
            rows={3}
            placeholder={t("textPlaceholder")}
            className="border-border bg-background min-h-24 rounded-xl border px-3 py-2 font-normal"
          />
          <span className="text-muted text-xs font-normal">
            {text.length}/500
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          {t("nameLabel")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={t("namePlaceholder")}
            className="border-border bg-background min-h-12 rounded-xl border px-3 font-normal"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm font-bold text-[#a22f18]">
            {error === "rating" ? t("errorRating") : t("errorText")}
          </p>
        ) : null}
        <button
          type="submit"
          className="bg-coral text-coral-ink min-h-12 self-start rounded-full px-6 font-extrabold shadow-sm active:scale-95"
        >
          {t("submit")}
        </button>
        {thanks ? (
          <p role="status" className="text-sea-deep text-sm font-bold">
            {t("thanks")}
          </p>
        ) : null}
      </form>

      <ul className="mt-5 flex flex-col gap-3" aria-label={t("list")}>
        {mine.map((r) => (
          <li
            key={r.id}
            className="border-sea rounded-2xl border-2 bg-white p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Stars value={r.rating} className="size-4" />
              <b>{r.name || t("anonymous")}</b>
              <span className="bg-sea rounded-full px-2 py-0.5 text-xs font-bold text-white">
                {t("yourReview")}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-line">{r.text}</p>
            <button
              type="button"
              onClick={() => removeMyReview(slug, r.id)}
              className="text-muted mt-2 min-h-11 text-sm font-bold underline"
            >
              {t("delete")}
            </button>
          </li>
        ))}
        {seeded.map((r) => (
          <li
            key={r.id}
            className="border-border rounded-2xl border bg-white p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Stars value={r.rating} className="size-4" />
              <b>{r.author}</b>
              <span className="bg-sun/30 text-earth rounded-full px-2 py-0.5 text-xs font-bold">
                {t("exampleBadge")}
              </span>
            </div>
            <p className="mt-1 text-sm">{r.text}</p>
            {r.ownerReply ? (
              <div className="bg-sea-soft mt-3 rounded-xl p-3 text-sm">
                <p className="text-sea-deep font-bold">
                  {t("ownerReplyLabel")}
                </p>
                <p>{r.ownerReply}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
