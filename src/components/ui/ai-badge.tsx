import { useTranslations } from "next-intl";

/** Rótulo obligatorio sobre imágenes hechas con IA: son ilustraciones, no fotos. */
export function AiBadge({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span
      className={`rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm ${className}`}
    >
      {t("aiIllustration")}
    </span>
  );
}
