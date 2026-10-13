"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { track } from "@/lib/analytics";

/** Comparte el enlace de la página (Web Share en el celular; si no, copia). */
export function ShareButton({
  title,
  className = "",
}: {
  title: string;
  className?: string;
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
      className={`border-sea text-sea-deep hover:bg-sea-soft min-h-11 rounded-full border-2 px-5 text-sm font-bold transition active:scale-95 ${className}`}
    >
      {copied ? t("copied") : t("share")}
    </button>
  );
}
