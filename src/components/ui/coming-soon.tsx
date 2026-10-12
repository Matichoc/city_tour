import { useTranslations } from "next-intl";

export function ComingSoon({
  section,
}: {
  section: "routes" | "trip" | "info";
}) {
  const t = useTranslations("soon");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-20 text-center">
      <p className="text-earth text-sm font-semibold tracking-wide uppercase">
        {t("title")}
      </p>
      <h1 className="font-display text-3xl font-bold">{t(section)}</h1>
      <p className="text-muted max-w-sm">{t("body")}</p>
    </main>
  );
}
