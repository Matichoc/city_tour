import type { ReactNode } from "react";
import { AiBadge } from "@/components/ui/ai-badge";
import { Wave } from "@/components/ui/wave";

export function PageHero({
  title,
  subtitle,
  children,
  image,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Ilustración de fondo (se rotula como hecha con IA). */
  image?: { src: string; alt: string };
}) {
  return (
    <header className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#07495a_0%,#0b7285_100%)] px-4 pt-7 pb-14 text-white">
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            width={1448}
            height={1086}
            fetchPriority="high"
            className="absolute inset-0 -z-10 size-full object-cover"
          />
          <div
            className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_73_90_/_0.86)_0%,rgb(7_73_90_/_0.62)_60%,rgb(7_73_90_/_0.3)_100%)]"
            aria-hidden="true"
          />
          <AiBadge className="absolute right-3 bottom-2 z-10" />
        </>
      ) : null}
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
