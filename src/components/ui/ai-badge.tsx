import { useTranslations } from "next-intl";

/**
 * Rótulo discreto sobre imágenes hechas con IA: son ilustraciones, no fotos.
 * Pequeño y translúcido, pero siempre visible y legible por lectores de pantalla.
 */
export function AiBadge({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span
      data-ai-badge=""
      className={`text-[10px] font-medium tracking-wide text-white/65 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.55)] ${className}`}
    >
      {t("aiIllustration")}
    </span>
  );
}
