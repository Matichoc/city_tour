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
    case "finger": {
      // Guante de dibujos animados: primero el contorno, luego el relleno.
      const parts = (
        <>
          <rect x="30" y="4" width="17" height="60" rx="8.5" />
          <rect x="24" y="46" width="52" height="42" rx="18" />
          <circle cx="55" cy="52" r="9" />
          <circle cx="68" cy="58" r="9" />
          <ellipse
            cx="22"
            cy="68"
            rx="9"
            ry="13"
            transform="rotate(-25 22 68)"
          />
        </>
      );
      return (
        <>
          <g
            fill="#1b1c40"
            stroke="#1b1c40"
            strokeWidth="9"
            strokeLinejoin="round"
          >
            {parts}
            <rect x="28" y="86" width="44" height="10" rx="4" />
          </g>
          <g fill="#ffffff">{parts}</g>
          <rect x="30" y="85" width="40" height="9" rx="3" fill="#e98bbd" />
          <path
            d="M44 66h26M44 76h26"
            stroke="#b8c7cb"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
    }
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
              fill="#e98bbd"
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
            stroke="#1b1c40"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M50 8c5 12 7 26 5 46l-5 38-5-38c-2-20 0-34 5-46Z"
            fill="#ffffff"
            stroke="#1b1c40"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M46 14l4-12 4 12Z"
            fill="#ff9f1c"
            stroke="#1b1c40"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="47" cy="24" r="1.8" fill="#1b1c40" />
          <circle cx="53" cy="24" r="1.8" fill="#1b1c40" />
        </>
      );
    case "boat":
      return (
        <>
          <path
            d="M50 4c20 24 22 58 13 92H37C28 62 30 28 50 4Z"
            fill="#e98bbd"
            {...OUTLINE}
          />
          <path
            d="M50 30c20 10 20 30 2 44Z"
            fill="#ffffff"
            stroke="#1b1c40"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="40" r="3" fill="#1b1c40" />
        </>
      );
    default:
      return (
        <path
          d="M50 6 L86 82 L50 66 L14 82 Z"
          fill="#e98bbd"
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
