import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { buildPageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";

/** Pasos de la guía para visitantes, con el enlace a cada parte. */
const STEPS = [
  { key: "open", href: "/" },
  { key: "doors", href: "/" },
  { key: "explore", href: "/explorar" },
  { key: "place", href: "/explorar" },
  { key: "listen", href: "/rutas" },
  { key: "routes", href: "/rutas" },
  { key: "trip", href: "/recorrido" },
  { key: "camera", href: "/recorrido" },
  { key: "events", href: "/eventos" },
  { key: "languages", href: "/" },
  { key: "privacy", href: "/informacion" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "howTo" });
  return buildPageMetadata({
    locale,
    href: "/como-usar",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function HowToPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("howTo");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <ol className="flex flex-col gap-4 px-4 pb-10">
        {STEPS.map(({ key, href }, i) => (
          <li
            key={key}
            className="border-border bg-surface flex gap-4 rounded-3xl border p-5"
          >
            <span className="bg-coral grid size-10 shrink-0 place-items-center rounded-full font-extrabold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold">
                {t(`steps.${key}.title`)}
              </h2>
              <p className="text-muted mt-1">{t(`steps.${key}.body`)}</p>
              <Link
                href={href}
                className="text-sea-deep mt-2 inline-flex min-h-11 items-center font-bold underline"
              >
                {t(`steps.${key}.cta`)}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
