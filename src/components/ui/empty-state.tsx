import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-border bg-surface/60 rounded-2xl border border-dashed p-6 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {children ? (
        <div className="text-muted mt-2 text-sm">{children}</div>
      ) : null}
    </div>
  );
}
