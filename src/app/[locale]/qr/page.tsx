import QRCode from "qrcode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { getData } from "@/lib/data";
import { resolveLocale } from "@/i18n/utils";
import { getSiteUrl, localizedUrl } from "@/lib/seo";
import { PrintButton } from "@/components/ui/print-button";
import { toOrigin } from "@/lib/qr";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function QrPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ origen?: string; nombre?: string; lugar?: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("qr");
  const name = (sp.nombre ?? "").trim().slice(0, 60);
  const origin = toOrigin(sp.origen || name);
  // QR para señalética (PLADETUR A1.3): lleva directo a la ficha del lugar.
  const data = await getData();
  const place = sp.lugar ? data.getPlace(sp.lugar, locale) : undefined;
  const places = data.listPlaces(locale);
  const url = place
    ? `${localizedUrl(locale, { pathname: "/lugares/[slug]", params: { slug: place.slug } })}?origen=hito-${place.slug.slice(0, 40)}${origin ? `-${origin}` : ""}`
    : `${getSiteUrl()}${getPathname({ locale, href: "/" })}${origin ? `?origen=${origin}` : ""}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#155656", light: "#ffffff" },
  });

  return (
    <main className="flex flex-col gap-6 px-4 py-6">
      <form className="border-border bg-surface flex flex-col gap-2 rounded-2xl border p-4 print:hidden">
        <label htmlFor="nombre" className="font-bold">
          {t("nameLabel")}
        </label>
        <label htmlFor="lugar" className="font-bold">
          {t("placeLabel")}
        </label>
        <select
          id="lugar"
          name="lugar"
          defaultValue={place?.slug ?? ""}
          className="border-border bg-background min-h-12 rounded-full border px-4"
        >
          <option value="">{t("placeNone")}</option>
          {places.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            id="nombre"
            name="nombre"
            defaultValue={name}
            placeholder={t("namePlaceholder")}
            className="border-border bg-background min-h-12 min-w-0 flex-1 rounded-full border px-5"
          />
          <button
            type="submit"
            className="bg-sea min-h-12 shrink-0 rounded-full px-5 font-bold text-white"
          >
            {t("generate")}
          </button>
        </div>
        <p className="text-muted text-xs">{t("help")}</p>
      </form>

      <section
        aria-label={t("poster")}
        className="border-sea mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border-4 bg-white p-6 text-center"
      >
        <p className="text-sea text-sm font-bold tracking-widest uppercase">
          Papudo en tu Mano
        </p>
        <h1 className="font-display text-sea-deep text-3xl leading-tight font-extrabold">
          {place ? t("forPlace", { name: place.name }) : t("headline")}
        </h1>
        <div
          className="w-64"
          role="img"
          aria-label={t("qrAlt")}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="text-muted text-sm">{t("scan")}</p>
        {name ? (
          <p className="text-foreground font-bold">{t("from", { name })}</p>
        ) : null}
        <p className="text-muted text-xs break-all">{url}</p>
      </section>

      <div className="flex justify-center print:hidden">
        <PrintButton label={t("print")} />
      </div>
    </main>
  );
}
