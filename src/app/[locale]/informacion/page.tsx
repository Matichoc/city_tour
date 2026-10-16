import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { listLocalities } from "@/lib/data";
import { MUNICIPALITY, SPONSOR } from "@/content/catalog";
import { INFO_BLOCKS } from "@/content/papudo-info";
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

        {(["practical", "history"] as const).map((group) => (
          <section
            key={group}
            aria-labelledby={`info-${group}`}
            className="flex flex-col gap-3"
          >
            <h2
              id={`info-${group}`}
              className="font-display text-2xl font-extrabold"
            >
              {t(group === "practical" ? "practicalTitle" : "historyTitle")}
            </h2>
            {INFO_BLOCKS.filter((b) => b.group === group).map((b) => {
              const text = locale === "en" ? b.en : b.es;
              return (
                <article
                  key={b.id}
                  className="border-border bg-surface rounded-2xl border p-4"
                >
                  <h3 className="font-display text-lg font-extrabold">
                    {text.title}
                  </h3>
                  <p className="mt-1 text-sm">{text.body}</p>
                  <p className="text-muted mt-2 text-xs">
                    {t("source")}:{" "}
                    {b.sources.map((src, i) => (
                      <span key={src.url}>
                        {i > 0 ? " · " : null}
                        <a
                          className="text-sea underline"
                          href={src.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {src.label}
                        </a>
                      </span>
                    ))}
                  </p>
                </article>
              );
            })}
          </section>
        ))}

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
            <li>
              <a
                className="text-sea underline"
                href={`tel:${MUNICIPALITY.links[0].value}`}
              >
                {t("kind.phone")}
              </a>
            </li>
            <li className="text-muted">{MUNICIPALITY.address}</li>
          </ul>
          <p className="text-muted mt-3 text-xs">
            {t("source")}:{" "}
            {MUNICIPALITY.sources.map((src, i) => (
              <span key={src.url}>
                {i > 0 ? " · " : null}
                <a
                  className="text-sea underline"
                  href={src.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {src.label}
                </a>
              </span>
            ))}
          </p>
        </section>

        <section
          aria-labelledby="emergencias"
          className="border-border bg-surface rounded-2xl border p-4"
        >
          <h2 id="emergencias" className="font-display text-2xl font-extrabold">
            {t("emergencyTitle")}
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["131", "ambulance"],
                ["132", "firefighters"],
                ["133", "police"],
                ["137", "maritime"],
              ] as const
            ).map(([number, key]) => (
              <li key={number}>
                <a
                  href={`tel:${number}`}
                  className="bg-sea-soft flex min-h-14 flex-col justify-center rounded-xl px-3 py-2"
                >
                  <span className="font-display text-sea-deep text-xl font-extrabold">
                    {number}
                  </span>
                  <span className="text-xs">{t(`emergency.${key}`)}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-3 text-xs">{t("emergencyNote")}</p>
        </section>

        <section
          aria-labelledby="quiosco"
          className="border-border bg-surface rounded-2xl border p-4"
        >
          <h2 id="quiosco" className="font-display text-2xl font-extrabold">
            {t("kioskTitle")}
          </h2>
          <p className="mt-1 text-sm">{t("kioskBody")}</p>
          <Link
            href="/quiosco"
            className="bg-coral text-coral-ink mt-3 inline-flex min-h-12 items-center rounded-full px-6 font-extrabold shadow-sm"
          >
            {t("kioskOpen")}
          </Link>
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
        <section
          aria-labelledby="autor"
          className="border-border bg-surface rounded-2xl border p-4"
        >
          <h2 id="autor" className="font-display text-xl font-extrabold">
            {t("authorTitle")}
          </h2>
          <p className="mt-2 text-sm font-bold">{t("authorBody")}</p>
          <p className="text-muted mt-2 text-sm">{t("authorNote")}</p>
          <a
            href={SPONSOR.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sea mt-2 inline-flex min-h-11 items-center text-sm font-bold underline"
          >
            {t("authorLink")}
          </a>
        </section>
        <Link
          href="/negocios"
          className="text-sea self-start text-sm font-bold underline"
        >
          {t("forBusiness")}
        </Link>
      </div>
    </main>
  );
}
