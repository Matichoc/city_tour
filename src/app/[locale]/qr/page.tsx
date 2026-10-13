import QRCode from "qrcode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { getSiteUrl } from "@/lib/seo";
import { PrintButton } from "@/components/ui/print-button";
import { toOrigin } from "@/lib/qr";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function QrPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ origen?: string; nombre?: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("qr");
  const name = (sp.nombre ?? "").trim().slice(0, 60);
  const origin = toOrigin(sp.origen || name);
  const url = `${getSiteUrl()}${getPathname({ locale, href: "/" })}${origin ? `?origen=${origin}` : ""}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#07495a", light: "#ffffff" },
  });

  return (
    <main className="flex flex-col gap-6 px-4 py-6">
      <form className="border-border bg-surface flex flex-col gap-2 rounded-2xl border p-4 print:hidden">
        <label htmlFor="nombre" className="font-bold">
          {t("nameLabel")}
        </label>
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
          Papudo en tu mano
        </p>
        <h1 className="font-display text-sea-deep text-3xl leading-tight font-extrabold">
          {t("headline")}
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
