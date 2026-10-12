import type { ReactNode } from "react";
import { Wave } from "@/components/ui/wave";

// Destellos sobre el mar (zona baja de la escena, lejos del texto).
const GLINTS = [
  { left: "10%", bottom: "9%", delay: "0s" },
  { left: "26%", bottom: "13%", delay: "1.1s" },
  { left: "43%", bottom: "8%", delay: "2.2s" },
  { left: "61%", bottom: "14%", delay: "0.6s" },
  { left: "77%", bottom: "9%", delay: "1.8s" },
  { left: "91%", bottom: "12%", delay: "2.7s" },
];

function Gull({ className, top }: { className: string; top: string }) {
  return (
    <svg
      viewBox="0 0 40 16"
      className={`absolute left-0 w-7 text-white/80 ${className}`}
      style={{ top }}
      aria-hidden="true"
    >
      <path
        d="M2 12 Q10 0 20 10 Q30 0 38 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Escena de portada: atardecer en la playa con campo al fondo. Solo CSS/SVG
 * (sin imágenes que cargar); las animaciones respetan prefers-reduced-motion.
 */
export function HeroScene({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#07495a_0%,#0b7285_46%,#f0a368_88%)] px-4 pt-9 pb-24 text-white">
      {/* Sol */}
      <div
        className="sun-glow absolute -top-6 right-[8%] size-36 rounded-full bg-[radial-gradient(circle,#fff3c4_0%,#ffb454_38%,rgb(255_122_89_/_0)_72%)]"
        aria-hidden="true"
      />
      <Gull className="gull" top="3%" />
      <Gull className="gull gull-2" top="7%" />
      <Gull className="gull gull-3" top="1%" />

      {/* Campo: lomas al fondo */}
      <svg
        viewBox="0 0 800 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-10 h-24 w-full"
        aria-hidden="true"
      >
        <path
          d="M0 120 V70 Q110 18 250 62 T520 52 T800 70 V120Z"
          fill="#2f5233"
          fillOpacity="0.9"
        />
        <path
          d="M0 120 V92 Q160 50 320 88 T800 84 V120Z"
          fill="#4a7a37"
          fillOpacity="0.95"
        />
      </svg>

      <Wave className="wave-c" fill="#1fb6c9" opacity={0.55} height={92} />
      <Wave className="wave-b" fill="#0b7285" opacity={0.85} height={74} />
      <Wave className="wave-a" fill="#fdf8ee" height={52} />

      {GLINTS.map((g, i) => (
        <span
          key={i}
          className="glint absolute size-1.5 rounded-full bg-white"
          style={{ left: g.left, bottom: g.bottom, animationDelay: g.delay }}
          aria-hidden="true"
        />
      ))}

      <div className="relative mx-auto max-w-3xl">{children}</div>
    </section>
  );
}
