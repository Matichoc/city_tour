import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/utils";
import { getData } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { RouteCard } from "@/components/route/route-card";

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
  const data = await getData();
  const routes = data.listRoutes(locale);

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <ul className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-10">
        {routes.map((r, i) => (
          <li key={r.slug}>
            <RouteCard route={r} index={i} />
          </li>
        ))}
      </ul>
    </main>
  );
}
