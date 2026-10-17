/** Ola repetible (periodo 1200): se anima desplazándola -50% (ver globals.css). */
const WAVE =
  "M0 60 Q150 10 300 60 T600 60 T900 60 T1200 60 T1500 60 T1800 60 T2100 60 T2400 60 V120 H0 Z";

export function Wave({
  className = "",
  fill,
  opacity = 1,
  height = 64,
}: {
  className?: string;
  fill: string;
  opacity?: number;
  height?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 2400 120"
        preserveAspectRatio="none"
        className={`h-full w-[200%] ${className}`}
      >
        <path d={WAVE} fill={fill} fillOpacity={opacity} />
      </svg>
    </div>
  );
}
