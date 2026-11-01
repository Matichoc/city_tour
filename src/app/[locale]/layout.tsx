import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { TopNav } from "@/components/ui/top-nav";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PoweredBy } from "@/components/ui/powered-by";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const n = await getTranslations("nav");

  return (
    <NextIntlClientProvider>
      {/* Primer elemento con el teclado o el lector de pantalla: salta el menú. */}
      <a
        href="#contenido"
        className="bg-sea sr-only z-50 rounded-full font-bold text-white shadow-lg focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-5 focus:py-3"
      >
        {n("skipToContent")}
      </a>
      <div className="flex min-h-dvh flex-1 flex-col pb-16 sm:pb-0">
        <TopNav />
        <div
          id="contenido"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col outline-none"
        >
          {children}
        </div>
        <PoweredBy locale={locale} />
      </div>
      <BottomNav />
    </NextIntlClientProvider>
  );
}
