import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { listLocalities } from "@/lib/data";
import { MUNICIPALITY, SPONSOR } from "@/content/catalog";
import { buildPageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "info" });
  return buildPageMetadata({
    locale,
    href: "/informacion",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("info");
  const localities = listLocalities(locale).filter((l) => l.summary);

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
        <section aria-labelledby="pueblos" className="flex flex-col gap-3">
          <h2 id="pueblos" className="font-display text-2xl font-extrabold">
            {t("localities")}
          </h2>
          {localities.map((l) => (
            <article
              key={l.slug}
              className="border-border bg-surface rounded-2xl border p-4"
            >
              <h3 className="font-display text-lg font-extrabold">
                <Link
                  href={{
                    pathname: "/pueblos/[slug]",
                    params: { slug: l.slug },
                  }}
                  className="hover:underline"
                >
                  {l.name}
                </Link>
              </h3>
              <p className="mt-1 text-sm">{l.summary}</p>
              {l.source ? (
                <p className="text-muted mt-2 text-xs">
                  {t("source")}:{" "}
                  <a
                    className="text-sea underline"
                    href={l.source.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {l.source.label}
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </section>

        <section
          aria-labelledby="muni"
          className="border-border bg-surface rounded-2xl border p-4"
        >
          <h2 id="muni" className="font-display text-2xl font-extrabold">
            {MUNICIPALITY.name}
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a
                className="text-sea font-bold underline"
                href={MUNICIPALITY.website}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("website")}
              </a>
            </li>
            {MUNICIPALITY.links.map((l) => (
              <li key={l.kind}>
                <a
                  className="text-sea underline"
                  href={
                    l.kind === "phone"
                      ? `tel:${l.value}`
                      : l.kind === "email"
                        ? `mailto:${l.value}`
                        : l.value
                  }
                  rel="noopener noreferrer"
                  target={
                    l.kind === "phone" || l.kind === "email"
                      ? undefined
                      : "_blank"
                  }
                >
                  {t(`kind.${l.kind}`)}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-3 text-xs">{t("contactPending")}</p>
        </section>

        <section
          aria-labelledby="auspicio"
          className="bg-sponsor text-sponsor-foreground rounded-2xl p-4"
        >
          <h2 id="auspicio" className="font-display text-xl font-extrabold">
            {t("sponsorTitle")}
          </h2>
          <p className="mt-2 text-sm">{t("sponsorBody")}</p>
          <a
            className="text-sponsor-accent mt-3 inline-block font-bold underline"
            href={SPONSOR.websiteUrl}
            rel="noopener noreferrer sponsored"
            target="_blank"
          >
            matichoc.cl
          </a>
        </section>

        <section
          aria-labelledby="datos"
          className="bg-earth-soft text-earth rounded-2xl p-4"
        >
          <h2 id="datos" className="font-display text-xl font-extrabold">
            {t("dataTitle")}
          </h2>
          <p className="mt-2 text-sm">{t("dataBody")}</p>
        </section>
      </div>
    </main>
  );
}
