"use client";

import { useEffect, useState } from "react";

/**
 * Figuras que la cámara a pie usa para señalar la próxima parada. Todas
 * apuntan hacia arriba: quien las usa las gira según el rumbo.
 */
export const POINTER_STYLES = [
  "arrow",
  "finger",
  "steps",
  "gull",
  "boat",
] as const;
export type PointerStyle = (typeof POINTER_STYLES)[number];

const STORAGE_KEY = "papudo.pointer-style";

/** Estilo elegido, recordado en este teléfono (nunca sale del dispositivo). */
export function usePointerStyle(): [PointerStyle, (s: PointerStyle) => void] {
  const [style, setStyle] = useState<PointerStyle>("arrow");
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved && (POINTER_STYLES as readonly string[]).includes(saved)) {
          setStyle(saved as PointerStyle);
        }
      } catch {
        /* sin almacenamiento: queda la flecha */
      }
    });
  }, []);
  const choose = (s: PointerStyle) => {
    setStyle(s);
    try {
      window.localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* se usa solo en esta visita */
    }
  };
  return [style, choose];
}

const OUTLINE = {
  stroke: "#ffffff",
  strokeWidth: 4,
  strokeLinejoin: "round",
} as const;

export function PointerShape({ style }: { style: PointerStyle }) {
  switch (style) {
    case "finger":
      return (
        <>
          <rect
            x="43"
            y="4"
            width="14"
            height="62"
            rx="7"
            fill="#f6c19b"
            {...OUTLINE}
          />
          <rect
            x="24"
            y="50"
            width="52"
            height="42"
            rx="18"
            fill="#f6c19b"
            {...OUTLINE}
          />
          <path d="M26 64c-12-6-18 4-10 14l12 10" fill="#f6c19b" {...OUTLINE} />
          <path
            d="M40 64h20M40 74h20"
            stroke="#c98b60"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
    case "steps":
      return (
        <>
          {[
            { x: 34, y: 74, d: 0 },
            { x: 66, y: 52, d: 0.35 },
            { x: 34, y: 30, d: 0.7 },
            { x: 66, y: 8, d: 1.05 },
          ].map((f) => (
            <g
              key={f.d}
              className="step-print motion-reduce:animate-none"
              style={{ animationDelay: `${f.d}s` }}
              fill="#ff7a59"
              {...OUTLINE}
              strokeWidth="3"
            >
              <path
                transform={`translate(${f.x} ${f.y})`}
                d="M-7 -2C-8 -12 8 -12 7 -2C7 4 4 8 4 11C4 15 -4 15 -4 11C-4 8 -7 4 -7 -2Z"
              />
              <g transform={`translate(${f.x} ${f.y})`}>
                <circle cx="-5.5" cy="-12" r="2.6" />
                <circle cx="-1.8" cy="-14" r="2.6" />
                <circle cx="2" cy="-14" r="2.6" />
                <circle cx="5.6" cy="-12" r="2.6" />
              </g>
            </g>
          ))}
        </>
      );
    case "gull":
      return (
        <>
          <path
            d="M50 40C30 32 14 38 4 56c16-5 30-4 46 4 16-8 30-9 46-4C86 38 70 32 50 40Z"
            fill="#ffffff"
            stroke="#062a33"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M50 8c5 12 7 26 5 46l-5 38-5-38c-2-20 0-34 5-46Z"
            fill="#ffffff"
            stroke="#062a33"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M46 14l4-12 4 12Z"
            fill="#ff9f1c"
            stroke="#062a33"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="47" cy="24" r="1.8" fill="#062a33" />
          <circle cx="53" cy="24" r="1.8" fill="#062a33" />
        </>
      );
    case "boat":
      return (
        <>
          <path
            d="M50 4c20 24 22 58 13 92H37C28 62 30 28 50 4Z"
            fill="#ff7a59"
            {...OUTLINE}
          />
          <path
            d="M50 30c20 10 20 30 2 44Z"
            fill="#ffffff"
            stroke="#062a33"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="40" r="3" fill="#062a33" />
        </>
      );
    default:
      return (
        <path
          d="M50 6 L86 82 L50 66 L14 82 Z"
          fill="#ff7a59"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      );
  }
}

/** Fila de botones para elegir la figura (se ve en la cámara). */
export function PointerPicker({
  value,
  onChange,
  label,
  names,
}: {
  value: PointerStyle;
  onChange: (s: PointerStyle) => void;
  label: string;
  names: Record<PointerStyle, string>;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex justify-center gap-2 rounded-full bg-black/45 p-1.5"
    >
      {POINTER_STYLES.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={names[s]}
          title={names[s]}
          onClick={() => onChange(s)}
          className={`grid size-11 place-items-center rounded-full transition ${
            value === s ? "bg-sea" : "bg-white/15 hover:bg-white/30"
          }`}
        >
          <svg viewBox="0 0 100 100" className="size-8" aria-hidden="true">
            <PointerShape style={s} />
          </svg>
        </button>
      ))}
    </div>
  );
}
