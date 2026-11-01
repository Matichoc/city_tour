"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { track } from "@/lib/analytics";
import { SPEECH_RATES, pickVoice, splitIntoChunks } from "@/lib/speech";

type Status = "idle" | "playing" | "paused";

const noop = () => () => {};
const isSupported = () =>
  "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/**
 * Lee en voz alta una ficha con la voz del dispositivo. Nunca suena sola: hay
 * que tocar el botón (WCAG 1.4.2). No reemplaza al lector de pantalla; es para
 * quien prefiere escuchar (baja visión, adultos mayores, dislexia, o con el
 * teléfono en la mano caminando). Sin soporte en el navegador no se muestra.
 */
export function ListenButton({
  segments,
  lang,
  name,
  slug,
}: {
  /** Textos en el orden en que se leen (título, descripción, horario…). */
  segments: string[];
  /** BCP 47, p. ej. "es-CL" (ver `SPEECH_LANG`). */
  lang: string;
  name: string;
  slug: string;
}) {
  const t = useTranslations("listen");
  const supported = useSyncExternalStore(noop, isSupported, () => false);
  const [status, setStatus] = useState<Status>("idle");
  const [rate, setRate] = useState<number>(SPEECH_RATES[0]);
  const [noVoice, setNoVoice] = useState(false);
  const [announce, setAnnounce] = useState("");
  const chunks = useRef<string[]>([]);
  const index = useRef(0);
  // Cada lectura tiene su número: los avisos de fin de una lectura cancelada
  // (algunos navegadores los disparan al cancelar) se ignoran.
  const session = useRef(0);
  const played = useRef(false);

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
      if (n >= chunks.current.length) {
        index.current = 0;
        setStatus("idle");
        setAnnounce(t("done"));
        return;
      }
      index.current = n;
      // Se elige en cada trozo: la lista puede llegar con la lectura empezada.
      const voice = pickVoice(synth.getVoices(), lang);
      const u = new SpeechSynthesisUtterance(chunks.current[n]);
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
    setAnnounce(t("playing"));
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
      chunks.current = segments.flatMap((s) => splitIntoChunks(s));
      index.current = 0;
      if (!played.current) {
        played.current = true;
        track("listen_play", { slug });
      }
    }
    speakFrom(index.current, rate);
  }

  function stop() {
    session.current++;
    window.speechSynthesis.cancel();
    index.current = 0;
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

  return (
    <div className="bg-sea-soft/60 flex flex-wrap items-center gap-2 rounded-2xl p-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={status === "idle" ? t("playLabel", { name }) : undefined}
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
      {status !== "idle" ? (
        <button
          type="button"
          onClick={stop}
          className="border-sea text-sea-deep hover:bg-sea-soft inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold transition active:scale-95"
        >
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
      {/* aria-live y no role="status": no compite con los avisos de la página. */}
      <span aria-live="polite" className="sr-only">
        {announce}
      </span>
    </div>
  );
}
