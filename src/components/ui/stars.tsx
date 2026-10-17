/** Estrellas de puntuación (admite medias estrellas). Solo decorativas: el valor va en texto. */
export function Stars({
  value,
  className = "size-5",
  tone = "dark",
}: {
  value: number;
  className?: string;
  /** "light" sobre fondos oscuros (banners). */
  tone?: "dark" | "light";
}) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className={`relative inline-block ${className}`}>
            <Star
              className={`${className} ${tone === "light" ? "text-white/60" : "text-[#b45309]/40"}`}
              outline
            />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className={`${className} max-w-none text-[#f59e0b]`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Star({
  className,
  outline,
}: {
  className: string;
  outline?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={outline ? "none" : "currentColor"}
      stroke={outline ? "currentColor" : "#b45309"}
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
    </svg>
  );
}

/** Una sola estrella (para elegir la puntuación). */
export function StarShape({
  filled,
  className = "size-9",
}: {
  filled: boolean;
  className?: string;
}) {
  return filled ? (
    <Star className={`${className} text-[#f59e0b]`} />
  ) : (
    <Star className={`${className} text-[#b45309]/50`} outline />
  );
}
