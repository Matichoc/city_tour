import QRCode from "qrcode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/utils";
import { listCategories, listEvents, listPlaces, listRoutes } from "@/lib/data";
import { localizedUrl } from "@/lib/seo";
import { KioskApp } from "@/components/kiosk/kiosk-app";

// Pantalla para las oficinas de información: no se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const qr = (url: string) =>
  QRCode.toString(`${url}?origen=quiosco`, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#07495a", light: "#ffffff" },
  });

const monthName = (locale: string, month: number, style: "long" | "short") =>
  new Intl.DateTimeFormat(locale, { month: style, timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, month - 1, 1)),
  );

export default async function KioskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const te = await getTranslations("events");

  const places = await Promise.all(
    listPlaces(locale).map(async (p) => ({
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      categorySlug: p.categorySlug,
      categoryName: p.categoryName,
      localityName: p.localityName,
      address: p.address,
      picture: p.picture,
      qrSvg: await qr(
        localizedUrl(locale, {
          pathname: "/lugares/[slug]",
          params: { slug: p.slug },
        }),
      ),
    })),
  );

  const routes = await Promise.all(
    listRoutes(locale).map(async (r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description,
      stops: r.stops.map((s) => s.place.name),
      qrSvg: await qr(
        localizedUrl(locale, {
          pathname: "/rutas/[slug]",
          params: { slug: r.slug },
        }),
      ),
    })),
  );

  const events = listEvents(locale).map((e) => ({
    slug: e.slug,
    name: e.name,
    shortDescription: e.shortDescription,
    categoryName: e.categoryName,
    when:
      e.month && e.day
        ? te("onDate", {
            day: e.day,
            month: monthName(locale, e.month, "long"),
          })
        : e.month
          ? te("inMonth", { month: monthName(locale, e.month, "long") })
          : e.season === "summer"
            ? te("summer")
            : te("toConfirm"),
  }));

  return (
    <main>
      <KioskApp
        categories={listCategories(locale)}
        places={places}
        events={events}
        routes={routes}
        homeQrSvg={await qr(localizedUrl(locale, "/"))}
        eventsQrSvg={await qr(localizedUrl(locale, "/eventos"))}
      />
    </main>
  );
}
