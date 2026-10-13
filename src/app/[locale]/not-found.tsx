import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-10">
      <EmptyState title={t("notFoundTitle")}>
        <p>{t("notFoundBody")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="bg-sea inline-flex min-h-11 items-center rounded-full px-5 font-bold text-white"
          >
            {t("goHome")}
          </Link>
          <Link
            href="/explorar"
            className="border-sea text-sea-deep inline-flex min-h-11 items-center rounded-full border-2 px-5 font-bold"
          >
            {t("goExplore")}
          </Link>
        </div>
      </EmptyState>
    </main>
  );
}
