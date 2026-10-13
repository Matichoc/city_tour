import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";
import { buildPageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { IllustratedImage } from "@/components/ui/illustrated-image";
import { TrackedAnchor } from "@/components/analytics/tracked-link";
import { illustrationFor } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "business" });
  return buildPageMetadata({
    locale,
    href: "/negocios",
    title: t("title"),
    description: t("subtitle"),
  });
}

/**
 * Contacto para inscribir negocios: se define con NEXT_PUBLIC_BUSINESS_CONTACT
 * (un "mailto:..." o una URL de formulario). Sin configurar, se deriva a
 * Información (contacto municipal) para no inventar un correo.
 */
function businessContact(): string | null {
  const v = process.env.NEXT_PUBLIC_BUSINESS_CONTACT?.trim();
  return v && (v.startsWith("mailto:") || v.startsWith("https://")) ? v : null;
}

const BENEFITS = [
  "free",
  "verified",
  "routes",
  "directions",
  "qr",
  "stats",
] as const;
const STEPS = ["contact", "verify", "publish"] as const;

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("business");
  const contact = businessContact();

  return (
    <main className="flex flex-col">
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
        <div className="border-border bg-surface overflow-hidden rounded-3xl border shadow-sm">
          <IllustratedImage
            picture={illustrationFor("hostales", locale)}
            className="h-44"
          />
          <div className="p-5">
            <h2 className="font-display text-2xl font-extrabold">
              {t("pitchTitle")}
            </h2>
            <p className="text-muted mt-2">{t("pitchBody")}</p>
          </div>
        </div>

        <section aria-labelledby="beneficios">
          <h2 id="beneficios" className="font-display text-2xl font-extrabold">
            {t("benefitsTitle")}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <li
                key={b}
                className="rise-in border-border bg-surface rounded-2xl border p-4"
                style={{ "--i": i } as React.CSSProperties}
              >
                <p className="font-bold">{t(`benefit.${b}.title`)}</p>
                <p className="text-muted mt-1 text-sm">
                  {t(`benefit.${b}.body`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pasos">
          <h2 id="pasos" className="font-display text-2xl font-extrabold">
            {t("stepsTitle")}
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className="border-border bg-surface flex gap-3 rounded-2xl border p-4"
              >
                <span className="bg-sea grid size-9 shrink-0 place-items-center rounded-full font-extrabold text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-bold">
                    {t(`step.${s}.title`)}
                  </span>
                  <span className="text-muted text-sm">
                    {t(`step.${s}.body`)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-3 rounded-3xl bg-[linear-gradient(120deg,#07495a,#0b7285_60%,#4a7a37)] p-6 text-white">
          <p className="font-display text-xl font-extrabold">{t("ctaTitle")}</p>
          {contact ? (
            <TrackedAnchor
              event="business_cta"
              href={contact}
              className="bg-coral text-coral-ink inline-flex min-h-12 items-center justify-center self-start rounded-full px-6 font-bold"
            >
              {t("cta")}
            </TrackedAnchor>
          ) : (
            <Link
              href="/informacion"
              className="bg-coral text-coral-ink inline-flex min-h-12 items-center justify-center self-start rounded-full px-6 font-bold"
            >
              {t("ctaFallback")}
            </Link>
          )}
          <Link
            href="/qr"
            className="text-sm font-bold text-[#ffe3a8] underline"
          >
            {t("qrLink")}
          </Link>
        </div>

        <section aria-labelledby="muni" className="bg-sea-soft rounded-2xl p-4">
          <h2
            id="muni"
            className="font-display text-sea-deep text-xl font-extrabold"
          >
            {t("muniTitle")}
          </h2>
          <p className="mt-2 text-sm">{t("muniBody")}</p>
        </section>
      </div>
    </main>
  );
}
