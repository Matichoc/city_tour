import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Pie: Información (en celular no está en la barra) y la marca madre. */
export async function PoweredBy({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "common" });
  const n = await getTranslations({ locale, namespace: "nav" });
  const h = await getTranslations({ locale, namespace: "howTo" });
  return (
    <footer className="text-muted px-4 pt-6 pb-4 text-center text-xs print:hidden">
      <Link
        href="/informacion"
        className="text-foreground mb-2 inline-flex min-h-11 items-center px-3 text-sm font-semibold underline sm:hidden"
      >
        {n("info")}
      </Link>
      <Link
        href="/como-usar"
        className="text-foreground mb-2 inline-flex min-h-11 items-center px-3 text-sm font-semibold underline"
      >
        {h("footer")}
      </Link>
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {t("subApp")}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/turismo-simbolo.webp"
          alt={t("logoParent")}
          width={26}
          height={22}
          loading="lazy"
          className="h-5 w-auto"
        />
      </p>
    </footer>
  );
}
