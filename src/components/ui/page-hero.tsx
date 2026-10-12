import type { ReactNode } from "react";
import { Wave } from "@/components/ui/wave";

export function PageHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#07495a_0%,#0b7285_100%)] px-4 pt-7 pb-14 text-white">
      <div
        className="sun-glow absolute -top-8 right-4 size-24 rounded-full bg-[radial-gradient(circle,#ffe3a8_0%,rgb(255_180_84_/_0.55)_45%,transparent_72%)]"
        aria-hidden="true"
      />
      <Wave className="wave-b" fill="#1fb6c9" opacity={0.5} height={52} />
      <Wave className="wave-a" fill="#fdf8ee" height={34} />
      <div className="relative mx-auto max-w-3xl">
        <h1 className="font-display text-3xl leading-tight font-extrabold">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-white/90">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
