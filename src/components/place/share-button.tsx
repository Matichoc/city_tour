"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { track } from "@/lib/analytics";

/** Comparte el enlace de la página (Web Share en el celular; si no, copia). */
export function ShareButton({
  title,
  className = "",
  variant = "pill",
}: {
  title: string;
  className?: string;
  /** "tile": ícono con el texto debajo (fila de acciones de la ficha). */
  variant?: "pill" | "tile";
}) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    track("share", { path: window.location.pathname });
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el usuario canceló */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`${
        variant === "tile"
          ? "bg-soft hover:bg-border flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs font-semibold transition active:scale-95"
          : "border-sea text-sea-deep hover:bg-sea-soft min-h-11 rounded-full border-2 px-5 text-sm font-bold transition active:scale-95"
      } ${className}`}
    >
      {variant === "tile" ? (
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
        </svg>
      ) : null}
      {copied ? t("copied") : t("share")}
    </button>
  );
}
