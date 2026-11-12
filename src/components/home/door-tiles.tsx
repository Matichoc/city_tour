import { Link } from "@/i18n/navigation";
import type { Picture } from "@/lib/data";
import type { DoorKey } from "@/lib/doors";
import { AiBadge } from "@/components/ui/ai-badge";

/** Color de cada cuadro y del texto encima (contrastes AA en MARCA-REFERENCIA). */
const TONE: Record<DoorKey, { tile: string; text: string }> = {
  mar: { tile: "bg-cuadro-mar", text: "text-foreground" },
  campo: { tile: "bg-cuadro-campo", text: "text-cuadro-campo-on" },
  patrimonio: { tile: "bg-cuadro-patri", text: "text-white" },
  paseos: { tile: "bg-cuadro-paseo", text: "text-white" },
};

export type DoorTile = {
  key: DoorKey;
  name: string;
  countLabel: string;
  picture: Picture;
};

/**
 * Los cuatro cuadros del logo municipal como puertas de entrada: el doble
 * marco del logo, la imagen teñida del color de la puerta y el nombre sobre
 * una franja sólida (se lee siempre, sin depender de la imagen).
 */
export function DoorTiles({ doors }: { doors: DoorTile[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4">
      {doors.map((d) => (
        <li key={d.key}>
          <Link
            href={{ pathname: "/explorar", query: { puerta: d.key } }}
            className={`group block aspect-square rounded-[1.6rem] p-1.5 transition active:scale-[0.98] ${TONE[d.key].tile}`}
          >
            <span className="flex h-full flex-col overflow-hidden rounded-[1.3rem] border-[3px] border-white/90 bg-inherit">
              <span className="relative block h-[62%] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.picture.src}
                  alt=""
                  width={d.picture.width}
                  height={d.picture.height}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover mix-blend-multiply saturate-[.25] transition duration-300 group-hover:saturate-100"
                />
                {d.picture.kind ? null : (
                  <AiBadge className="absolute right-2 bottom-1" />
                )}
              </span>
              <span
                className={`flex flex-1 flex-col justify-center px-3 sm:px-4 ${TONE[d.key].text}`}
              >
                <span className="font-display text-lg leading-none font-extrabold sm:text-2xl">
                  {d.name}
                </span>
                <span className="mt-1 text-xs font-semibold sm:text-sm">
                  {d.countLabel}
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
