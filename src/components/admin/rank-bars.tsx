/**
 * Barras horizontales para los rankings de Métricas (rutas, eventos, QR,
 * búsquedas, idiomas, lugares). Sin librerías: SVG del servidor, con el
 * nombre a la izquierda, la barra y el número. Hay una lista equivalente
 * para lectores de pantalla. Se puede bajar como imagen con <PngButton>.
 *
 * `compact` es para las tarjetas angostas (media columna): el dibujo es más
 * angosto, así el texto no queda diminuto al encogerse.
 */
const SIZES = {
  wide: { W: 640, ROW: 30, LABEL_W: 250, NUM_W: 56, MAX_CHARS: 34 },
  compact: { W: 420, ROW: 28, LABEL_W: 170, NUM_W: 48, MAX_CHARS: 24 },
} as const;

export function RankBars({
  rows,
  label,
  empty,
  compact = false,
}: {
  rows: { key: string; label: string; n: number }[];
  label: string;
  empty: string;
  compact?: boolean;
}) {
  if (rows.length === 0) return <p className="text-muted mt-2">{empty}</p>;
  const { W, ROW, LABEL_W, NUM_W, MAX_CHARS } = compact
    ? SIZES.compact
    : SIZES.wide;
  const BAR_X = LABEL_W + 10;
  const BAR_MAX = W - BAR_X - NUM_W;
  const cut = (s: string) =>
    s.length > MAX_CHARS ? `${s.slice(0, MAX_CHARS - 1).trimEnd()}…` : s;
  const max = Math.max(1, ...rows.map((r) => r.n));
  const H = rows.length * ROW + 6;
  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={label}
      >
        {rows.map((r, i) => {
          const y = i * ROW + 4;
          const w = Math.max(2, (r.n / max) * BAR_MAX);
          return (
            <g key={r.key}>
              <title>{`${r.label}: ${r.n.toLocaleString("es-CL")}`}</title>
              <text
                x={0}
                y={y + 17}
                className="fill-foreground text-[13px] font-semibold"
              >
                {cut(r.label)}
              </text>
              <rect
                x={BAR_X}
                y={y + 4}
                width={w}
                height={ROW - 10}
                rx={4}
                className="fill-sea"
              />
              <text
                x={BAR_X + w + 6}
                y={y + 17}
                className="fill-foreground text-[13px] font-bold"
              >
                {r.n.toLocaleString("es-CL")}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="sr-only">
        {rows.map((r) => (
          <li key={r.key}>
            {r.label}: {r.n}
          </li>
        ))}
      </ol>
    </figure>
  );
}
