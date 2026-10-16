"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AiBadge } from "@/components/ui/ai-badge";
import { Stars } from "@/components/ui/stars";

export type FeaturedSlide = {
  slug: string;
  name: string;
  shortDescription: string;
  categoryName: string;
  localityName: string | null;
  whenLabel: string;
  monthShort: string | null;
  day: number | null;
  demo: boolean;
  ratingAverage: number | null;
  ratingCount: number;
  picture: { src: string; alt: string; width: number; height: number };
};

const AUTOPLAY_MS = 5500;

/**
 * Banner de eventos destacados: se desliza solo (con botón de pausa y sin
 * movimiento si el visitante pidió reducirlo), con flechas y puntos.
 */
export function FeaturedCarousel({ slides }: { slides: FeaturedSlide[] }) {
  const t = useTranslations("events");
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovering, setHovering] = useState(false);
  const total = slides.length;

  // Autoplay solo si el visitante no pidió reducir el movimiento.
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    queueMicrotask(() => setPlaying(!reduce && total > 1));
  }, [total]);

  const goTo = useCallback((i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!playing || hovering || total < 2) return;
    const id = window.setInterval(() => goTo((index + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, hovering, index, total, goTo]);

  if (total === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("featuredTitle")}
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto rounded-3xl [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <article
            key={s.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={t("slideOf", { n: i + 1, total })}
            className="relative isolate h-[23rem] w-full shrink-0 snap-center overflow-hidden text-white sm:h-[26rem]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.picture.src}
              alt=""
              width={s.picture.width}
              height={s.picture.height}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 -z-10 size-full object-cover"
            />
            <div
              className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_43_54_/_0.25)_0%,rgb(7_43_54_/_0.55)_45%,rgb(7_30_40_/_0.92)_100%)]"
              aria-hidden="true"
            />
            <AiBadge className="absolute right-3 bottom-1.5" />

            <div className="flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="bg-sun text-coral-ink inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide uppercase">
                  <span aria-hidden="true">★</span> {t("featured")}
                </span>
                {s.monthShort ? (
                  <span
                    className="flex w-16 flex-col items-center rounded-2xl bg-white py-2 text-center text-[#07495a] shadow-lg"
                    aria-hidden="true"
                  >
                    {s.day ? (
                      <>
                        <span className="text-xs font-extrabold uppercase">
                          {s.monthShort}
                        </span>
                        <span className="font-display text-2xl leading-none font-extrabold">
                          {s.day}
                        </span>
                      </>
                    ) : (
                      <span className="font-display text-2xl font-extrabold uppercase">
                        {s.monthShort}
                      </span>
                    )}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 pb-5">
                <p className="text-sm font-bold text-[#ffe3a8]">
                  {s.categoryName}
                  {s.localityName ? ` · ${s.localityName}` : ""}
                  {s.demo ? ` · ${t("demoBadge")}` : ""}
                </p>
                <h2 className="font-display text-3xl leading-[1.05] font-extrabold drop-shadow sm:text-4xl">
                  {s.name}
                </h2>
                <p className="text-sm font-bold">{s.whenLabel}</p>
                <p className="line-clamp-2 max-w-xl text-sm text-white/90">
                  {s.shortDescription}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <Link
                    href={{
                      pathname: "/eventos/[slug]",
                      params: { slug: s.slug },
                    }}
                    className="bg-coral text-coral-ink inline-flex min-h-12 items-center rounded-full px-6 font-extrabold shadow-lg active:scale-95"
                  >
                    {t("viewDetails")}
                  </Link>
                  <span className="flex items-center gap-1.5 text-sm">
                    <Stars
                      value={s.ratingAverage ?? 0}
                      className="size-4"
                      tone="light"
                    />
                    {s.ratingAverage !== null ? (
                      <span>
                        <b>{s.ratingAverage.toFixed(1)}</b> ({s.ratingCount})
                      </span>
                    ) : (
                      <span className="text-white/85">{t("noRatings")}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {total > 1 ? (
        <>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goTo((index - 1 + total) % total)}
              aria-label={t("prev")}
              className="border-border bg-surface grid size-11 place-items-center rounded-full border text-xl font-extrabold"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
              aria-label={playing ? t("pause") : t("play")}
              className="border-border bg-surface grid size-11 place-items-center rounded-full border text-sm font-bold"
            >
              <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
            </button>
            <ul className="flex items-center">
              {slides.map((s, i) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={t("goToSlide", { n: i + 1 })}
                    aria-current={i === index ? "true" : undefined}
                    className="grid size-11 place-items-center"
                  >
                    <span
                      className={`block h-2.5 rounded-full transition-all ${
                        i === index ? "bg-sea w-8" : "bg-sea/30 w-2.5"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => goTo((index + 1) % total)}
              aria-label={t("next")}
              className="border-border bg-surface grid size-11 place-items-center rounded-full border text-xl font-extrabold"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
