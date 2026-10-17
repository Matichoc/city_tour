import type { Picture } from "@/lib/data";
import { AiBadge } from "@/components/ui/ai-badge";

/**
 * Imagen de una ficha. Ilustración con IA: lleva su rótulo. Foto real: sin
 * rótulo. Logo: entero y centrado, sobre una versión desenfocada de sí mismo.
 */
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
      {picture.kind === "logo" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture.src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl"
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={picture.src}
        alt={picture.alt}
        width={picture.width}
        height={picture.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={
          picture.kind === "logo"
            ? "relative mx-auto h-full w-auto max-w-full object-contain p-3 drop-shadow-lg"
            : "size-full object-cover"
        }
      />
      {picture.kind ? null : <AiBadge className="absolute right-2 bottom-1" />}
      {children}
    </div>
  );
}
