import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { TopNav } from "@/components/ui/top-nav";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SponsorBanner } from "@/components/ui/sponsor-banner";

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

  return (
    <NextIntlClientProvider>
      <div className="flex min-h-dvh flex-1 flex-col pb-16 sm:pb-0">
        <TopNav />
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          {children}
        </div>
        <SponsorBanner locale={locale} />
      </div>
      <BottomNav />
    </NextIntlClientProvider>
  );
}
