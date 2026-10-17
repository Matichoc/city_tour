import type { Picture } from "@/lib/data";
import { AiBadge } from "@/components/ui/ai-badge";

/** Ilustración (IA) con su rótulo discreto; recorta con object-cover. */
export function IllustratedImage({
  picture,
  className = "h-40",
  priority = false,
  children,
}: {
  picture: Picture;
  className?: string;
  priority?: boolean;
  /** Elementos superpuestos (p. ej. el ícono de categoría). */
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={picture.src}
        alt={picture.alt}
        width={picture.width}
        height={picture.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="size-full object-cover"
      />
      <AiBadge className="absolute right-2 bottom-1" />
      {children}
    </div>
  );
}
