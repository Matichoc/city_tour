"use client";

import { useTranslations } from "next-intl";
import { toggleSaved, useSaved } from "@/lib/saved-store";
import { track } from "@/lib/analytics";

export function SaveButton({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const t = useTranslations("saved");
  const saved = useSaved().includes(slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => {
        if (toggleSaved(slug)) track("save_place", { slug });
      }}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-5 text-sm font-bold transition active:scale-95 ${
        saved
          ? "border-coral bg-coral/15 text-coral-ink"
          : "border-sea text-sea-deep hover:bg-sea-soft"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5"
        fill={saved ? "#c94a48" : "none"}
        stroke={saved ? "#c94a48" : "currentColor"}
        strokeWidth="2"
      >
        <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
      </svg>
      {saved ? t("saved") : t("save")}
    </button>
  );
}
