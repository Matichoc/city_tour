import QRCode from "qrcode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/utils";
import { getData } from "@/lib/data";
import { eventWhen, monthName } from "@/lib/event-format";
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

export default async function KioskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const te = await getTranslations("events");

  const data = await getData();
  const places = await Promise.all(
    data.listPlaces(locale).map(async (p) => ({
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      categorySlug: p.categorySlug,
      categoryName: p.categoryName,
      localityName: p.localityName,
      address: p.address,
      picture: p.picture,
      demo: p.demo,
      qrSvg: await qr(
        localizedUrl(locale, {
          pathname: "/lugares/[slug]",
          params: { slug: p.slug },
        }),
      ),
    })),
  );

  const routes = await Promise.all(
    data.listRoutes(locale).map(async (r) => ({
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

  const events = data.listEvents(locale).map((e) => ({
    slug: e.slug,
    name: e.name,
    shortDescription: e.shortDescription,
    categoryName: e.categoryName,
    categorySlug: e.categorySlug,
    demo: e.demo,
    monthShort: e.month ? monthName(locale, e.month, "short") : null,
    day: e.day,
    when: eventWhen(te, locale, e),
  }));

  return (
    <main>
      <KioskApp
        categories={data.listCategories(locale)}
        places={places}
        events={events}
        routes={routes}
        homeQrSvg={await qr(localizedUrl(locale, "/"))}
        eventsQrSvg={await qr(localizedUrl(locale, "/eventos"))}
      />
    </main>
  );
}
