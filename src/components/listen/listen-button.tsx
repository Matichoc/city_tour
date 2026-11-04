"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { track } from "@/lib/analytics";
import { SPEECH_RATES } from "@/lib/speech";

type Status = "idle" | "loading" | "playing" | "paused";

/** Una parte de lo que se lee: su etiqueta y el elemento que se marca. */
export type ListenPart = { label?: string; targetId?: string };

/** Tras unos segundos, «Anterior» vuelve al comienzo de la parte en curso. */
const RESTART_AFTER_S = 3;

/**
 * «Escuchar» con voz natural (Azure, Catalina es-CL): pide al servidor un
 * audio por parte (`/api/escuchar`) y los reproduce en orden. Nunca usa la voz
 * del dispositivo: si el audio no está disponible, lo dice. Nunca suena solo
 * (WCAG 1.4.2). Con un elemento de audio real, sigue sonando con la pantalla
 * bloqueada y se controla desde ahí (Media Session). Con varias partes (las
 * paradas de una ruta) se salta de una a otra y la parte en curso se marca en
 * la página con `aria-current="step"`.
 */
export function ListenButton({
  parts,
  playLabel,
  title,
  slug,
  kind,
}: {
  parts: ListenPart[];
  /** Nombre accesible del botón antes de empezar ("Escuchar la ficha de…"). */
  playLabel: string;
  /** Título para la pantalla de bloqueo (nombre del lugar o la ruta). */
  title: string;
  slug: string;
  kind: "place" | "route";
}) {
  const t = useTranslations("listen");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [rate, setRate] = useState<number>(SPEECH_RATES[0]);
  const [part, setPart] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const urls = useRef<string[]>([]);
  const played = useRef(false);
  // El aviso de fin llega por un evento: lee la parte en curso desde un ref.
  const partRef = useRef(0);
  const multi = parts.length > 1;

  useEffect(() => {
    partRef.current = part;
  }, [part]);

  // Al salir de la página se corta.
  useEffect(() => () => audio.current?.pause(), []);

  // Marca en la página la parte que suena (p. ej. la parada de la ruta).
  const targetId = status === "idle" ? undefined : parts[part]?.targetId;
  useEffect(() => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    el?.setAttribute("aria-current", "step");
    return () => el?.removeAttribute("aria-current");
  }, [targetId]);

  function playPart(i: number) {
    const el = audio.current;
    const src = urls.current[i];
    if (!el || !src) return;
    setPart(i);
    el.src = src;
    el.playbackRate = rate;
    void el.play().then(
      () => setStatus("playing"),
      () => {
        setStatus("idle");
        setProblem(t("error"));
      },
    );
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: parts[i]?.label ?? title,
        artist: "Papudo en tu Mano",
      });
    }
  }

  async function start() {
    // El elemento se crea con el toque: así iPhone deja reproducir.
    if (!audio.current) {
      const el = new Audio();
      el.preload = "auto";
      el.addEventListener("ended", () => {
        const next = partRef.current + 1;
        if (next < urls.current.length) playPart(next);
        else {
          setStatus("idle");
          setPart(0);
          setAnnounce(t("done"));
        }
      });
      audio.current = el;
    }
    setProblem(null);
    if (urls.current.length === 0) {
      setStatus("loading");
      setAnnounce(t("loading"));
      const tipo = kind === "place" ? "lugar" : "ruta";
      try {
        const res = await fetch(
          `/api/escuchar?tipo=${tipo}&slug=${encodeURIComponent(slug)}&locale=${locale}`,
        );
        if (!res.ok) {
          setStatus("idle");
          setProblem(res.status === 503 ? t("unavailable") : t("error"));
          return;
        }
        const body = (await res.json()) as { sections: { url: string }[] };
        urls.current = body.sections.map((s) => s.url);
      } catch {
        setStatus("idle");
        setProblem(t("error"));
        return;
      }
    }
    if (!played.current) {
      played.current = true;
      track("listen_play", { slug, kind });
    }
    setAnnounce(t("playing"));
    playPart(0);
  }

  function toggle() {
    const el = audio.current;
    if (status === "playing" && el) {
      el.pause();
      setStatus("paused");
      setAnnounce(t("paused"));
    } else if (status === "paused" && el) {
      void el.play();
      setStatus("playing");
      setAnnounce(t("playing"));
    } else if (status === "idle") void start();
  }

  function jump(dir: -1 | 1) {
    const el = audio.current;
    if (!el) return;
    if (dir === -1 && el.currentTime > RESTART_AFTER_S) {
      el.currentTime = 0;
      return;
    }
    const to = part + dir;
    if (to < 0 || to >= urls.current.length) return;
    const label = parts[to]?.label;
    if (label) setAnnounce(label);
    playPart(to);
  }

  function stop() {
    const el = audio.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setPart(0);
    setStatus("idle");
    setAnnounce(t("stopped"));
  }

  function changeRate() {
    const next =
      SPEECH_RATES[
        (SPEECH_RATES.indexOf(rate as never) + 1) % SPEECH_RATES.length
      ];
    setRate(next);
    if (audio.current) audio.current.playbackRate = next;
  }

  // Controles de la pantalla de bloqueo y los audífonos.
  const controls = useRef({ toggle, jump });
  useEffect(() => {
    controls.current = { toggle, jump };
  });
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => controls.current.toggle());
    ms.setActionHandler("pause", () => controls.current.toggle());
    if (multi) {
      ms.setActionHandler("previoustrack", () => controls.current.jump(-1));
      ms.setActionHandler("nexttrack", () => controls.current.jump(1));
    }
    return () => {
      for (const a of ["play", "pause", "previoustrack", "nexttrack"] as const)
        ms.setActionHandler(a, null);
    };
  }, [multi]);

  const rateText = `${String(rate).replace(".", ",")}×`;
  const ghost =
    "border-sea text-sea-deep hover:bg-sea-soft inline-flex min-h-11 items-center gap-1 rounded-full border-2 px-4 text-sm font-bold transition active:scale-95";
  const active = status === "playing" || status === "paused";
  const current = active ? parts[part]?.label : null;

  return (
    <div className="bg-sea-soft/60 flex flex-col gap-2 rounded-2xl p-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={status === "loading"}
          aria-label={status === "idle" ? playLabel : undefined}
          className="bg-sea inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-70"
        >
          {status === "playing" ? (
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
            </svg>
          )}
          {status === "playing"
            ? t("pause")
            : status === "paused"
              ? t("resume")
              : status === "loading"
                ? t("loading")
                : t("play")}
        </button>
        {active && multi ? (
          <>
            <button
              type="button"
              onClick={() => jump(-1)}
              aria-label={t("previousLabel")}
              className={ghost}
            >
              <span aria-hidden="true">⏮</span>
              {t("previous")}
            </button>
            <button
              type="button"
              onClick={() => jump(1)}
              aria-label={t("nextLabel")}
              className={ghost}
            >
              {t("next")}
              <span aria-hidden="true">⏭</span>
            </button>
          </>
        ) : null}
        {active ? (
          <button type="button" onClick={stop} className={ghost}>
            {t("stop")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={changeRate}
          aria-label={t("speedLabel", { rate: rateText })}
          className="text-sea-deep hover:bg-sea-soft inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold"
        >
          {rateText}
        </button>
        <span className="text-muted text-xs">
          {problem ?? t("naturalVoice")}
        </span>
      </div>
      {multi && current ? (
        <p className="text-sea-deep px-2 text-sm font-bold">
          <span aria-hidden="true">♪ </span>
          {current}
        </p>
      ) : null}
      {/* aria-live y no role="status": no compite con los avisos de la página. */}
      <span aria-live="polite" className="sr-only">
        {problem ?? announce}
      </span>
    </div>
  );
}
