"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { track } from "@/lib/analytics";
import {
  SPEECH_RATES,
  buildQueue,
  jumpSection,
  pickVoice,
  type ListenSection,
  type QueueItem,
} from "@/lib/speech";

type Status = "idle" | "playing" | "paused";

const noop = () => () => {};
const isSupported = () =>
  "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/**
 * Lee en voz alta una ficha o una ruta con la voz del dispositivo. Nunca suena
 * sola: hay que tocar el botón (WCAG 1.4.2). No reemplaza al lector de
 * pantalla; es para quien prefiere escuchar (baja visión, adultos mayores,
 * dislexia, o con el teléfono en la mano caminando). Con varias partes (las
 * paradas de una ruta) se puede saltar de una a otra, y la parte en curso se
 * marca en la página con `aria-current="step"`. Sin soporte no se muestra.
 */
export function ListenButton({
  sections,
  lang,
  playLabel,
  slug,
  kind,
}: {
  /** Partes en el orden en que se leen (ver `ListenSection`). */
  sections: ListenSection[];
  /** BCP 47, p. ej. "es-CL" (ver `SPEECH_LANG`). */
  lang: string;
  /** Nombre accesible del botón antes de empezar ("Escuchar la ficha de…"). */
  playLabel: string;
  slug: string;
  kind: "place" | "route";
}) {
  const t = useTranslations("listen");
  const supported = useSyncExternalStore(noop, isSupported, () => false);
  const [status, setStatus] = useState<Status>("idle");
  const [rate, setRate] = useState<number>(SPEECH_RATES[0]);
  const [section, setSection] = useState(0);
  const [noVoice, setNoVoice] = useState(false);
  const [announce, setAnnounce] = useState("");
  const queue = useRef<QueueItem[]>([]);
  const index = useRef(0);
  // Cada lectura tiene su número: los avisos de fin de una lectura cancelada
  // (algunos navegadores los disparan al cancelar) se ignoran.
  const session = useRef(0);
  const played = useRef(false);
  const multi = sections.length > 1;

  useEffect(() => {
    if (!isSupported()) return;
    const synth = window.speechSynthesis;
    // Al salir de la página se corta la lectura, si este botón la empezó (se
    // lee el número de lectura al desmontar, a propósito).
    const started = session;
    // Chrome entrega la lista de voces después: pedirla temprano la carga.
    const load = () => synth.getVoices();
    load();
    synth.addEventListener("voiceschanged", load);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      if (started.current > 0) synth.cancel();
    };
  }, []);

  // Marca en la página la parte que suena (p. ej. la parada de la ruta).
  const targetId = status === "idle" ? undefined : sections[section]?.targetId;
  useEffect(() => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    el?.setAttribute("aria-current", "step");
    return () => el?.removeAttribute("aria-current");
  }, [targetId]);

  if (!supported) return null;

  function speakFrom(i: number, speed: number) {
    const synth = window.speechSynthesis;
    const id = ++session.current;
    synth.cancel();
    const voices = synth.getVoices();
    if (voices.length > 0 && !pickVoice(voices, lang)) {
      setNoVoice(true);
      setStatus("idle");
      setAnnounce(t("noVoice"));
      return;
    }
    const say = (n: number) => {
      if (id !== session.current) return;
      const item = queue.current[n];
      if (!item) {
        index.current = 0;
        setSection(0);
        setStatus("idle");
        setAnnounce(t("done"));
        return;
      }
      index.current = n;
      setSection(item.section);
      // Se elige en cada trozo: la lista puede llegar con la lectura empezada.
      const voice = pickVoice(synth.getVoices(), lang);
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = voice?.lang ?? lang;
      if (voice) u.voice = voice;
      u.rate = speed;
      u.onend = () => say(n + 1);
      u.onerror = (e) => {
        if (e.error === "interrupted" || e.error === "canceled") return;
        if (id === session.current) setStatus("idle");
      };
      synth.speak(u);
    };
    setStatus("playing");
    say(i);
  }

  function toggle() {
    if (status === "playing") {
      session.current++;
      window.speechSynthesis.cancel();
      setStatus("paused");
      setAnnounce(t("paused"));
      return;
    }
    if (status === "idle") {
      queue.current = buildQueue(sections);
      index.current = 0;
      if (!played.current) {
        played.current = true;
        track("listen_play", { slug, kind });
      }
    }
    setAnnounce(t("playing"));
    speakFrom(index.current, rate);
  }

  function jump(dir: -1 | 1) {
    const to = jumpSection(queue.current, index.current, dir);
    if (to < 0) return;
    const label = sections[queue.current[to].section]?.label;
    if (label) setAnnounce(label);
    speakFrom(to, rate);
  }

  function stop() {
    session.current++;
    window.speechSynthesis.cancel();
    index.current = 0;
    setSection(0);
    setStatus("idle");
    setAnnounce(t("stopped"));
  }

  function changeRate() {
    const next =
      SPEECH_RATES[
        (SPEECH_RATES.indexOf(rate as never) + 1) % SPEECH_RATES.length
      ];
    setRate(next);
    if (status === "playing") speakFrom(index.current, next);
  }

  const rateText = `${String(rate).replace(".", ",")}×`;
  const ghost =
    "border-sea text-sea-deep hover:bg-sea-soft inline-flex min-h-11 items-center gap-1 rounded-full border-2 px-4 text-sm font-bold transition active:scale-95";
  const current = status === "idle" ? null : sections[section]?.label;

  return (
    <div className="bg-sea-soft/60 flex flex-col gap-2 rounded-2xl p-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={status === "idle" ? playLabel : undefined}
          className="bg-sea inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-white transition active:scale-95"
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
              : t("play")}
        </button>
        {status !== "idle" && multi ? (
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
        {status !== "idle" ? (
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
          {noVoice ? t("noVoice") : t("deviceVoice")}
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
        {announce}
      </span>
    </div>
  );
}
