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

type Labels = { prev: string; next: string; region: string };

const arrow =
  "border-border bg-surface/90 text-foreground absolute top-[40%] z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border text-xl shadow-sm backdrop-blur transition hover:bg-surface disabled:pointer-events-none disabled:opacity-0";

/**
 * Fila de fotos con flechas a los lados (sin barra de desplazamiento). Se ve
 * una foto completa y un pedazo de la siguiente; en el celular también se
 * desliza con el dedo.
 */
export function Gallery({
  items,
  labels,
}: {
  items: GalleryItem[];
  labels: Labels;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  function measure() {
    const el = track.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft < 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }

  function go(dir: 1 | -1) {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: "smooth" });
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="relative"
    >
      <ul
        ref={track}
        onScroll={measure}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {items.map((g, i) => (
          <li
            key={g.src}
            className="w-[85%] max-w-md shrink-0 snap-start sm:w-[60%]"
          >
            <figure className="border-border bg-surface overflow-hidden rounded-2xl border">
              {g.kind === "video" ? (
                <video
                  src={g.src}
                  width={g.width}
                  height={g.height}
                  aria-label={g.alt}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-auto w-full bg-black"
                />
              ) : (
                <a href={g.src} target="_blank" rel="noopener">
                  {/* eslint-disable-next-line @next/next/no-img-element -- archivo local, se abre en tamaño completo */}
                  <img
                    src={g.src}
                    width={g.width}
                    height={g.height}
                    alt={g.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-auto w-full bg-white"
                  />
                </a>
              )}
              <figcaption className="text-muted flex justify-between gap-2 px-3 py-2 text-xs">
                <b className="text-foreground">{g.kindLabel}</b>
                {g.credit ? <span>{g.credit}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={edge.start}
        aria-label={labels.prev}
        className={`${arrow} left-2`}
      >
        <span aria-hidden>‹</span>
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={edge.end}
        aria-label={labels.next}
        className={`${arrow} right-2`}
      >
        <span aria-hidden>›</span>
      </button>
    </div>
  );
}
