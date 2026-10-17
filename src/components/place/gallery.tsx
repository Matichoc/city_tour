"use client";

import { useRef, useState } from "react";

export type GalleryItem = {
  src: string;
  alt: string;
  kind: "photo" | "menu" | "promo" | "logo" | "video";
  width: number;
  height: number;
  /** Etiqueta del tipo ya traducida (Foto, Carta…). */
  kindLabel: string;
  /** Crédito ya traducido, si lo hay. */
  credit: string | null;
};

type Labels = { prev: string; next: string; count: string; region: string };

const arrow =
  "border-border bg-surface/90 text-foreground absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border text-xl shadow-sm backdrop-blur transition hover:bg-surface disabled:pointer-events-none disabled:opacity-0";

/**
 * Una foto a la vez, con flechas a los lados. En el celular también se
 * desliza con el dedo; la barra de desplazamiento no se muestra.
 */
export function Gallery({
  items,
  labels,
}: {
  items: GalleryItem[];
  labels: Labels;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [at, setAt] = useState(0);
  const last = items.length - 1;

  function go(to: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({
      left: Math.max(0, Math.min(last, to)) * el.clientWidth,
      behavior: "smooth",
    });
  }

  function onScroll() {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    setAt(Math.round(el.scrollLeft / el.clientWidth));
  }

  const current = items[at] ?? items[0]!;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="flex flex-col gap-2"
    >
      <div className="border-border bg-surface relative overflow-hidden rounded-2xl border">
        <ul
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          {items.map((g, i) => (
            <li
              key={g.src}
              aria-label={labels.count
                .replace("{current}", String(i + 1))
                .replace("{total}", String(items.length))}
              className="bg-sea-soft/40 grid aspect-[4/3] w-full shrink-0 snap-center place-items-center"
            >
              {g.kind === "video" ? (
                <video
                  src={g.src}
                  width={g.width}
                  height={g.height}
                  aria-label={g.alt}
                  controls
                  playsInline
                  preload="metadata"
                  className="size-full bg-black object-contain"
                />
              ) : (
                <a
                  href={g.src}
                  target="_blank"
                  rel="noopener"
                  className="size-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- archivo local, se abre en tamaño completo */}
                  <img
                    src={g.src}
                    width={g.width}
                    height={g.height}
                    alt={g.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="size-full object-contain"
                  />
                </a>
              )}
            </li>
          ))}
        </ul>
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(at - 1)}
              disabled={at === 0}
              aria-label={labels.prev}
              className={`${arrow} left-2`}
            >
              <span aria-hidden>‹</span>
            </button>
            <button
              type="button"
              onClick={() => go(at + 1)}
              disabled={at === last}
              aria-label={labels.next}
              className={`${arrow} right-2`}
            >
              <span aria-hidden>›</span>
            </button>
            <p
              aria-live="polite"
              className="absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white"
            >
              {labels.count
                .replace("{current}", String(at + 1))
                .replace("{total}", String(items.length))}
            </p>
          </>
        )}
      </div>
      <p className="text-muted flex justify-between gap-2 px-1 text-xs">
        <b className="text-foreground">{current.kindLabel}</b>
        {current.credit ? <span>{current.credit}</span> : null}
      </p>
    </div>
  );
}
