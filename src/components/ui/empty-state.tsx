import type { ReactNode } from "react";
import type { Picture } from "@/lib/data";
import { IllustratedImage } from "@/components/ui/illustrated-image";

export function EmptyState({
  title,
  children,
  picture,
}: {
  title: string;
  children?: ReactNode;
  picture?: Picture;
}) {
  return (
    <div className="border-border bg-surface/60 overflow-hidden rounded-2xl border border-dashed text-center">
      {picture ? <IllustratedImage picture={picture} className="h-44" /> : null}
      <div className="p-6">
        <p className="font-display text-lg font-bold">{title}</p>
        {children ? (
          <div className="text-muted mt-2 text-sm">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
