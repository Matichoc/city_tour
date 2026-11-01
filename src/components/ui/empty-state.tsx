import type { ReactNode } from "react";
import type { Picture } from "@/lib/data";
import { IllustratedImage } from "@/components/ui/illustrated-image";

export function EmptyState({
  title,
  children,
  picture,
  as: Title = "p",
}: {
  title: string;
  children?: ReactNode;
  picture?: Picture;
  /** `h1` cuando el aviso es todo el contenido de la página (p. ej. el 404). */
  as?: "p" | "h1";
}) {
  return (
    <div className="border-border bg-surface/60 overflow-hidden rounded-2xl border border-dashed text-center">
      {picture ? <IllustratedImage picture={picture} className="h-44" /> : null}
      <div className="p-6">
        <Title className="font-display text-lg font-bold">{title}</Title>
        {children ? (
          <div className="text-muted mt-2 text-sm">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
