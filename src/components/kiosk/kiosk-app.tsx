"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategorySlug } from "@/content/types";
import type { Picture } from "@/lib/data";
import {
  CategoryCardFace,
  CATEGORY_BG,
  FeatureCardFace,
  categoryCardClass,
} from "@/components/ui/category-card";
import { IllustratedImage } from "@/components/ui/illustrated-image";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

export type KioskCategory = { slug: CategorySlug; name: string; count: number };

export type KioskPlace = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: CategorySlug;
  categoryName: string;
  localityName: string | null;
  address: string | null;
  picture: Picture;
  qrSvg: string;
  demo: boolean;
};

export type KioskEvent = {
  slug: string;
  name: string;
  shortDescription: string;
  when: string;
  categoryName: string;
  monthShort: string | null;
  day: number | null;
  categorySlug: CategorySlug;
  demo: boolean;
};

export type KioskRoute = {
  slug: string;
  name: string;
  description: string;
  stops: string[];
  qrSvg: string;
};

type View =
  | { kind: "home" }
  | { kind: "category"; slug: CategorySlug }
  | { kind: "place"; slug: string; from: CategorySlug | "route" }
  | { kind: "events" }
  | { kind: "routes" }
  | { kind: "route"; slug: string };

/** Segundos sin tocar la pantalla antes de avisar, y de cuenta regresiva. */
const IDLE_SECONDS = 75;
const COUNTDOWN_SECONDS = 15;

const tile =
  "card-lift border-border bg-surface flex min-h-32 flex-col items-start justify-between gap-3 rounded-3xl border p-5 text-left shadow-sm active:scale-[0.98]";
const back =
  "border-sea text-sea-deep min-h-14 self-start rounded-full border-2 px-6 text-lg font-extrabold";

/**
 * Modo quiosco para tablet (PLADETUR A1.6, oficinas de información): botones
 * grandes, sin cuenta ni datos personales, y vuelve solo al inicio cuando
 * nadie lo usa. Cada ficha trae un QR para seguir en el celular.
 */
export function KioskApp({
  categories,
  places,
  events,
  routes,
  homeQrSvg,
  eventsQrSvg,
}: {
  categories: KioskCategory[];
  places: KioskPlace[];
  events: KioskEvent[];
  routes: KioskRoute[];
  homeQrSvg: string;
  eventsQrSvg: string;
}) {
  const t = useTranslations("kiosk");
  const [view, setView] = useState<View>({ kind: "home" });
  const [idle, setIdle] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const atHome = view.kind === "home";
  // En la tablet de la oficina se abre con ?oficina=1 y no se muestra "Salir".
  const [office, setOffice] = useState(false);
  useEffect(() => {
    const flag =
      new URLSearchParams(window.location.search).get("oficina") === "1";
    queueMicrotask(() => setOffice(flag));
  }, []);

  const go = useCallback((next: View) => {
    setView(next);
    setIdle(false);
    scroller.current?.scrollTo({ top: 0 });
  }, []);

  // Inactividad: avisa y luego vuelve al inicio (solo si no está ya en él).
  useEffect(() => {
    if (atHome) return;
    const arm = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setSeconds(COUNTDOWN_SECONDS);
        setIdle(true);
      }, IDLE_SECONDS * 1000);
    };
    const onActivity = () => {
      setIdle(false);
      arm();
    };
    arm();
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const e of events)
      window.addEventListener(e, onActivity, { passive: true });
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      for (const e of events) window.removeEventListener(e, onActivity);
    };
  }, [atHome, view]);

  useEffect(() => {
    if (!idle) return;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          queueMicrotask(() => go({ kind: "home" }));
          return COUNTDOWN_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [idle, go]);

  const place =
    view.kind === "place" ? places.find((p) => p.slug === view.slug) : null;
  const route =
    view.kind === "route" ? routes.find((r) => r.slug === view.slug) : null;
  const category =
    view.kind === "category"
      ? categories.find((c) => c.slug === view.slug)
      : null;

  return (
    <div
      ref={scroller}
      className="bg-background fixed inset-0 z-[80] flex flex-col overflow-y-auto"
    >
      <header className="border-border bg-surface sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-4">
        <button
          type="button"
          onClick={() => go({ kind: "home" })}
          className="font-display text-sea-deep min-h-14 text-left text-2xl font-extrabold"
        >
          Papudo en tu mano
          <span className="text-muted block text-sm font-semibold">
            {t("subtitle")}
          </span>
        </button>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {office ? null : (
            <Link
              href="/"
              className="border-border text-sea-deep hover:border-sea inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-extrabold"
            >
              {t("exit")}
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
        {view.kind === "home" ? (
          <>
            <section className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#155656_0%,#1b7070_55%,#e9a3c6_130%)] p-8 text-white shadow-lg">
              <span
                aria-hidden="true"
                className="sun-glow absolute -top-10 -right-8 -z-10 size-52 rounded-full bg-[radial-gradient(circle,#fff3c4_0%,#f4d36e_40%,rgb(233_139_189_/_0)_72%)]"
              />
              <p className="font-script text-3xl text-[#fbeab0]">
                {t("kicker")}
              </p>
              <h1 className="font-display mt-1 text-5xl leading-[1.05] font-extrabold">
                {t("headline")}
              </h1>
              <p className="mt-3 max-w-xl text-xl text-white/90">{t("lead")}</p>
            </section>

            <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {categories.map((c, i) => (
                <li
                  key={c.slug}
                  className="rise-in"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <button
                    type="button"
                    disabled={c.count === 0}
                    onClick={() => go({ kind: "category", slug: c.slug })}
                    className={`${categoryCardClass} h-72 disabled:opacity-50`}
                  >
                    <CategoryCardFace
                      category={c.slug}
                      name={c.name}
                      index={i}
                      countLabel={
                        c.count === 0
                          ? t("soon")
                          : t("count", { count: c.count })
                      }
                    />
                  </button>
                </li>
              ))}
              <li
                className="rise-in col-span-2 md:col-span-1"
                style={{ "--i": 7 } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => go({ kind: "events" })}
                  className={`${categoryCardClass} h-72`}
                >
                  <FeatureCardFace
                    gradient="from-[#ffd27a] via-[#f59e0b] to-[#9a4a06]"
                    title={t("events")}
                    countLabel={t("count", { count: events.length })}
                    glyph="★"
                  />
                </button>
              </li>
              <li
                className="rise-in col-span-2 md:col-span-1"
                style={{ "--i": 8 } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => go({ kind: "routes" })}
                  className={`${categoryCardClass} h-72`}
                >
                  <FeatureCardFace
                    gradient="from-[#7dd3fc] via-[#0284c7] to-[#0c3a63]"
                    title={t("routes")}
                    countLabel={t("count", { count: routes.length })}
                    glyph="➜"
                  />
                </button>
              </li>
            </ul>

            <section className="border-border bg-surface flex items-center gap-6 rounded-3xl border p-5">
              <div
                className="w-36 shrink-0"
                role="img"
                aria-label={t("qrAlt")}
                dangerouslySetInnerHTML={{ __html: homeQrSvg }}
              />
              <p className="font-display text-2xl font-extrabold">
                {t("takeWithYou")}
              </p>
            </section>
          </>
        ) : null}

        {category ? (
          <>
            <button
              type="button"
              onClick={() => go({ kind: "home" })}
              className={back}
            >
              ← {t("back")}
            </button>
            <h1 className="font-display text-4xl font-extrabold">
              {category.name}
            </h1>
            <ul className="grid gap-4 md:grid-cols-2">
              {places
                .filter((p) => p.categorySlug === category.slug)
                .map((p) => (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() =>
                        go({ kind: "place", slug: p.slug, from: category.slug })
                      }
                      className={`${tile} w-full`}
                    >
                      <span className="font-display text-2xl font-extrabold">
                        {p.name}
                      </span>
                      <span className="text-muted text-lg">
                        {p.shortDescription}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </>
        ) : null}

        {place && view.kind === "place" ? (
          <>
            <button
              type="button"
              onClick={() =>
                go(
                  view.from === "route"
                    ? { kind: "routes" }
                    : { kind: "category", slug: view.from },
                )
              }
              className={back}
            >
              ← {t("back")}
            </button>
            <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
              <div className="flex flex-col gap-4">
                <IllustratedImage
                  picture={place.picture}
                  className="h-56 rounded-3xl"
                />
                <p className="text-field text-sm font-bold tracking-wide uppercase">
                  {place.categoryName}
                  {place.localityName ? ` · ${place.localityName}` : ""}
                </p>
                <h1 className="font-display text-4xl leading-tight font-extrabold">
                  {place.name}
                </h1>
                <p className="text-xl leading-relaxed">{place.description}</p>
                {place.address ? (
                  <p className="text-muted text-lg">{place.address}</p>
                ) : null}
                <p
                  className={`rounded-xl p-3 text-base ${place.demo ? "bg-sun/30 text-earth font-bold" : "bg-earth-soft text-earth"}`}
                >
                  {place.demo ? t("demoPlace") : t("pending")}
                </p>
              </div>
              <aside className="border-border bg-surface flex flex-col items-center gap-3 self-start rounded-3xl border p-5 text-center">
                <div
                  className="w-64"
                  role="img"
                  aria-label={t("qrAlt")}
                  dangerouslySetInnerHTML={{ __html: place.qrSvg }}
                />
                <p className="text-lg font-bold">{t("scan")}</p>
              </aside>
            </div>
          </>
        ) : null}

        {view.kind === "events" ? (
          <>
            <button
              type="button"
              onClick={() => go({ kind: "home" })}
              className={back}
            >
              ← {t("back")}
            </button>
            <h1 className="font-display text-4xl font-extrabold">
              {t("events")}
            </h1>
            <p className="bg-earth-soft text-earth rounded-xl p-3 text-base">
              {t("eventsNote")}
            </p>
            <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
              <ul className="flex flex-col gap-3">
                {events.map((e) => (
                  <li
                    key={e.slug}
                    className="border-border bg-surface flex overflow-hidden rounded-2xl border"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-b p-2 text-center text-white ${CATEGORY_BG[e.categorySlug]}`}
                    >
                      {e.monthShort ? (
                        <>
                          {e.day ? (
                            <>
                              <span className="text-sm font-extrabold uppercase">
                                {e.monthShort}
                              </span>
                              <span className="font-display text-4xl leading-none font-extrabold">
                                {e.day}
                              </span>
                            </>
                          ) : (
                            <span className="font-display text-3xl font-extrabold uppercase">
                              {e.monthShort}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-3xl">☀</span>
                      )}
                    </span>
                    <span className="flex flex-col gap-1 p-4">
                      <span className="text-field text-sm font-bold tracking-wide uppercase">
                        {e.categoryName}
                        {e.demo ? ` · ${t("example")}` : ""}
                      </span>
                      <span className="font-display text-2xl font-extrabold">
                        {e.name}
                      </span>
                      <span className="text-sea-deep text-lg font-bold">
                        {e.when}
                      </span>
                      <span className="text-lg">{e.shortDescription}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <aside className="border-border bg-surface flex flex-col items-center gap-3 self-start rounded-3xl border p-5 text-center">
                <div
                  className="w-48"
                  role="img"
                  aria-label={t("qrAlt")}
                  dangerouslySetInnerHTML={{ __html: eventsQrSvg }}
                />
                <p className="text-lg font-bold">{t("scan")}</p>
              </aside>
            </div>
          </>
        ) : null}

        {view.kind === "routes" ? (
          <>
            <button
              type="button"
              onClick={() => go({ kind: "home" })}
              className={back}
            >
              ← {t("back")}
            </button>
            <h1 className="font-display text-4xl font-extrabold">
              {t("routes")}
            </h1>
            <ul className="grid gap-4 md:grid-cols-2">
              {routes.map((r) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => go({ kind: "route", slug: r.slug })}
                    className={`${tile} w-full`}
                  >
                    <span className="font-display text-2xl font-extrabold">
                      {r.name}
                    </span>
                    <span className="text-muted text-lg">
                      {t("stops", { count: r.stops.length })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {route && view.kind === "route" ? (
          <>
            <button
              type="button"
              onClick={() => go({ kind: "routes" })}
              className={back}
            >
              ← {t("back")}
            </button>
            <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
              <div className="flex flex-col gap-4">
                <h1 className="font-display text-4xl leading-tight font-extrabold">
                  {route.name}
                </h1>
                <p className="text-xl leading-relaxed">{route.description}</p>
                <ol className="flex flex-col gap-2">
                  {route.stops.map((s, i) => (
                    <li key={s + i} className="flex items-center gap-3 text-xl">
                      <span className="bg-sea grid size-10 shrink-0 place-items-center rounded-full font-extrabold text-white">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <aside className="border-border bg-surface flex flex-col items-center gap-3 self-start rounded-3xl border p-5 text-center">
                <div
                  className="w-64"
                  role="img"
                  aria-label={t("qrAlt")}
                  dangerouslySetInnerHTML={{ __html: route.qrSvg }}
                />
                <p className="text-lg font-bold">{t("scanRoute")}</p>
              </aside>
            </div>
          </>
        ) : null}
      </div>

      {idle ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="kiosk-idle"
          className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-6"
        >
          <div className="bg-surface flex max-w-md flex-col gap-4 rounded-3xl p-8 text-center">
            <h2
              id="kiosk-idle"
              className="font-display text-3xl font-extrabold"
            >
              {t("idleTitle")}
            </h2>
            <p className="text-xl">{t("idleBody", { seconds })}</p>
            <button
              type="button"
              autoFocus
              onClick={() => setIdle(false)}
              className="bg-sea min-h-16 rounded-full px-8 text-xl font-extrabold text-white"
            >
              {t("idleStay")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
