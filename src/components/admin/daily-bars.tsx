/**
 * Barras de interacciones por día (una sola serie, en el azul de la marca).
 * Sin librerías: SVG del servidor. Cada barra muestra su día y su total al
 * pasar el cursor o el dedo (zona de toque de alto completo) y hay una tabla
 * equivalente para lectores de pantalla.
 */
const W = 720;
const H = 180;
const PAD_TOP = 18;
const PAD_BOTTOM = 22;
const GAP = 2;
const R = 4;

const fmtDay = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("es-CL", {
    timeZone: "UTC",
    ...opts,
  });

/** Barra con las puntas de arriba redondeadas, apoyada en la base. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(R, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function DailyBars({
  series,
  label,
  unit,
}: {
  series: { day: string; n: number }[];
  label: string;
  unit: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.n));
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const slot = W / series.length;
  const barW = Math.max(1, slot - GAP);
  const base = PAD_TOP + plotH;
  const peak = series.reduce((a, b) => (b.n > a.n ? b : a), series[0]!);
  const short = { day: "numeric", month: "short" } as const;

  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={label}
      >
        <line
          x1={0}
          x2={W}
          y1={base}
          y2={base}
          className="stroke-border"
          strokeWidth={1}
        />
        {series.map((s, i) => {
          const h = (s.n / max) * plotH;
          const x = i * slot + GAP / 2;
          return (
            <g key={s.day} className="group">
              <title>{`${fmtDay(s.day, { weekday: "short", ...short })}: ${s.n.toLocaleString("es-CL")} ${unit}`}</title>
              {/* Zona de toque: todo el alto, más ancha que la barra. */}
              <rect
                x={i * slot}
                y={0}
                width={slot}
                height={base}
                fill="transparent"
              />
              {s.n > 0 ? (
                <path
                  d={barPath(x, base - h, barW, h)}
                  className="fill-sea group-hover:fill-sea-deep"
                />
              ) : null}
            </g>
          );
        })}
        {peak.n > 0 ? (
          <text
            x={Math.min(
              W - 4,
              Math.max(4, series.indexOf(peak) * slot + slot / 2),
            )}
            y={Math.max(12, base - (peak.n / max) * plotH - 5)}
            textAnchor="middle"
            className="fill-foreground text-[12px] font-bold"
          >
            {peak.n.toLocaleString("es-CL")}
          </text>
        ) : null}
        <text x={0} y={H - 5} className="fill-muted text-[12px]">
          {fmtDay(series[0]!.day, short)}
        </text>
        <text
          x={W}
          y={H - 5}
          textAnchor="end"
          className="fill-muted text-[12px]"
        >
          {fmtDay(series.at(-1)!.day, short)}
        </text>
      </svg>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {series.map((s) => (
            <tr key={s.day}>
              <th scope="row">{fmtDay(s.day, short)}</th>
              <td>{s.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
