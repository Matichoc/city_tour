import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Papudo en tu mano", template: "%s · Papudo en tu mano" },
  description:
    "Guía turística de Papudo: playas, patrimonio, gastronomía y alojamiento.",
};

export const viewport: Viewport = {
  themeColor: "#0b7285",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
