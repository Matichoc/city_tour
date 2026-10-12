import { getTranslations } from "next-intl/server";
import { SPONSOR } from "@/content/catalog";
import type { Locale } from "@/i18n/routing";

/** Banner del auspiciador (Matichoc), con su identidad de marca. */
export async function SponsorBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <aside
      aria-label={t("sponsoredBy")}
      className="border-sponsor-accent bg-sponsor text-sponsor-foreground border-t-4 px-4 py-3"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPONSOR.logoPath}
            alt={SPONSOR.name}
            width={56}
            height={56}
            loading="lazy"
            className="size-14 shrink-0 rounded-lg"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sponsor-accent text-[11px] font-bold tracking-wide uppercase">
              {t("sponsoredBy")}
            </span>
            <span className="font-display text-base font-extrabold">
              {SPONSOR.name}
            </span>
            <span className="text-sponsor-foreground/80 text-xs">
              {SPONSOR.tagline[locale]}
            </span>
          </div>
        </div>
        <a
          href={SPONSOR.websiteUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="bg-sponsor-accent text-sponsor-accent-foreground inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold shadow-sm transition hover:scale-105"
        >
          {t("sponsorCta")}
        </a>
      </div>
    </aside>
  );
}
