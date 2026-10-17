import { getTranslations } from "next-intl/server";
import { SPONSOR } from "@/content/catalog";
import type { Locale } from "@/i18n/routing";

/** Crédito discreto al pie: "Desarrollado por Matichoc". */
export async function PoweredBy({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <footer className="text-muted px-4 pt-6 pb-4 text-center text-xs print:hidden">
      <a
        href={SPONSOR.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={SPONSOR.tagline[locale]}
        className="hover:text-foreground inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 transition"
      >
        {t("poweredBy")}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SPONSOR.logoPath}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          className="size-4 rounded"
        />
        <span className="font-bold">{SPONSOR.name}</span>
      </a>
    </footer>
  );
}
