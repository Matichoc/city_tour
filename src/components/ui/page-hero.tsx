import type { ReactNode } from "react";
import { AiBadge } from "@/components/ui/ai-badge";

/**
 * Encabezado de las páginas internas: título grande en azul noche sobre
 * blanco y, si hay, la imagen con el doble marco de los cuadros del logo
 * (del color de la puerta, o azul noche por defecto).
 */
export function PageHero({
  title,
  subtitle,
  children,
  image,
  frame = "bg-foreground",
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Ilustración de la página (se rotula como hecha con IA). */
  image?: { src: string; alt: string };
  /** Clase de color del marco de la imagen (`DOOR_STYLE[...].frame`). */
  frame?: string;
}) {
  return (
    <header className="flex flex-col gap-5 px-4 pt-6 pb-6">
      {image ? (
        <div className={`rounded-[1.8rem] p-1.5 ${frame}`}>
          <div className="relative overflow-hidden rounded-[1.45rem] border-[3px] border-white/90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              width={1448}
              height={1086}
              fetchPriority="high"
              className="h-48 w-full object-cover sm:h-72"
            />
            <AiBadge className="absolute right-3 bottom-1.5" />
          </div>
        </div>
      ) : null}
      <div>
        <h1 className="font-display text-4xl leading-[1.05] font-extrabold sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted mt-2 max-w-2xl text-lg">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
