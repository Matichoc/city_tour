import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { listRoutes } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { formatDuration } from "@/lib/itinerary-format";
import { PageHero } from "@/components/ui/page-hero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "routes" });
  return buildPageMetadata({
    locale,
    href: "/rutas",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function RoutesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("routes");
  const routes = listRoutes(locale);

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <ul className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-10">
        {routes.map((r, i) => (
          <li key={r.slug}>
            <Link
              href={{ pathname: "/rutas/[slug]", params: { slug: r.slug } }}
              style={{ "--i": i } as React.CSSProperties}
              className="card-lift rise-in block overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#07495a,#0b7285_60%,#4a7a37)] p-6 text-white shadow-md"
            >
              <h2 className="font-display text-2xl font-extrabold">{r.name}</h2>
              <p className="mt-2 text-sm text-white/90">{r.description}</p>
              <p className="mt-3 text-sm font-bold text-[#ffe3a8]">
                {t("stops", { count: r.stops.length })}
                {r.durationMinutes
                  ? ` · ${formatDuration(r.durationMinutes)}`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
