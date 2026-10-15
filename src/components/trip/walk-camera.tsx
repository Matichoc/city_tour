"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  bearingDegrees,
  distanceMeters,
  formatMeters,
  headingFromOrientation,
  isArrived,
  relativeBearing,
} from "@/lib/live-nav";

export type LivePosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
  /** Dirección de movimiento según el GPS (grados), si se está moviendo. */
  course: number | null;
};

type OrientationEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const CARDINALS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;

/**
 * Guía a pie con la cámara: video de la cámara trasera y, encima, una flecha
 * que apunta a la próxima parada según la brújula y el GPS. No es realidad
 * aumentada anclada al suelo (Safari no la soporta en la web), pero funciona
 * en iPhone y Android. Sin cámara o sin brújula sigue funcionando con menos.
 */
export function WalkCamera({
  target,
  position,
  onClose,
}: {
  target: { name: string; latitude: number; longitude: number };
  position: LivePosition | null;
  onClose: () => void;
}) {
  const t = useTranslations("live");
  const locale = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [camera, setCamera] = useState<"starting" | "on" | "off">("starting");
  const [compass, setCompass] = useState<number | null>(null);
  const [needsCompassPermission, setNeedsCompassPermission] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof (window.DeviceOrientationEvent as OrientationEventCtor | undefined)
        ?.requestPermission === "function",
  );

  // Cámara trasera; se apaga al cerrar.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setCamera("off"));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((tr) => tr.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => undefined);
        }
        setCamera("on");
      })
      .catch(() => setCamera("off"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  // Brújula (Android directo; iOS después del permiso).
  useEffect(() => {
    if (needsCompassPermission) return;
    const onOrientation = (e: DeviceOrientationEvent) => {
      const h = headingFromOrientation(
        e as DeviceOrientationEvent & { webkitCompassHeading?: number },
        window.screen.orientation?.angle ?? 0,
      );
      if (h !== null) setCompass(Math.round(h));
    };
    const absolute = "ondeviceorientationabsolute" in window;
    const name = absolute ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(name, onOrientation as EventListener);
    return () =>
      window.removeEventListener(name, onOrientation as EventListener);
  }, [needsCompassPermission]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function askCompass() {
    const ctor = window.DeviceOrientationEvent as OrientationEventCtor;
    try {
      await ctor.requestPermission?.();
    } catch {
      /* rechazado: se usa la dirección del GPS */
    }
    setNeedsCompassPermission(false);
  }

  const distance = position ? distanceMeters(position, target) : null;
  const bearing = position ? bearingDegrees(position, target) : null;
  const heading = compass ?? position?.course ?? null;
  const rotation =
    bearing !== null && heading !== null
      ? relativeBearing(bearing, heading)
      : null;
  const arrived =
    distance !== null && isArrived(distance, position?.accuracy ?? 0);
  const cardinal =
    bearing !== null ? CARDINALS[Math.round(bearing / 45) % 8]! : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="walk-camera-title"
      className="fixed inset-0 z-[70] flex flex-col bg-[#062a33] text-white"
    >
      <video
        ref={videoRef}
        muted
        playsInline
        aria-hidden="true"
        className={`absolute inset-0 size-full object-cover ${
          camera === "on" ? "" : "hidden"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />

      <header className="relative flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-white/80 uppercase">
            {t("cameraKicker")}
          </p>
          <h2
            id="walk-camera-title"
            className="font-display truncate text-2xl font-extrabold"
          >
            {target.name}
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="min-h-11 shrink-0 rounded-full bg-white px-4 text-sm font-extrabold text-[#062a33]"
        >
          {t("cameraClose")}
        </button>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        {arrived ? (
          <p className="font-display rounded-3xl bg-white/95 px-6 py-4 text-2xl font-extrabold text-[#062a33] shadow-xl">
            🎉 {t("arrived", { name: target.name })}
          </p>
        ) : rotation !== null ? (
          <svg
            viewBox="0 0 100 100"
            className="size-48 drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `rotate(${rotation}deg)` }}
            role="img"
            aria-label={t("arrowLabel", { name: target.name })}
          >
            <path
              d="M50 6 L86 82 L50 66 L14 82 Z"
              fill="#ff7a59"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <p className="max-w-xs rounded-2xl bg-black/45 p-4 text-base font-bold">
            {position
              ? t("noCompass", { direction: t(`cardinal.${cardinal!}`) })
              : t("waitingGps")}
          </p>
        )}
        {distance !== null && !arrived ? (
          <p className="font-display text-5xl font-extrabold drop-shadow-lg">
            {formatMeters(distance, locale)}
          </p>
        ) : null}
        {needsCompassPermission ? (
          <button
            type="button"
            onClick={askCompass}
            className="bg-coral text-coral-ink min-h-12 rounded-full px-6 font-extrabold shadow-lg"
          >
            {t("enableCompass")}
          </button>
        ) : null}
      </div>

      <p className="relative p-4 text-center text-xs text-white/85">
        {camera === "off" ? `${t("cameraOff")} ` : null}
        {t("cameraSafety")}
      </p>
    </div>
  );
}
