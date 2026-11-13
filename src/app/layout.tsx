import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource/baloo-2/latin-600.css";
import "@fontsource/baloo-2/latin-700.css";
import "@fontsource/baloo-2/latin-800.css";
import "@fontsource/pacifico/latin-400.css";
// Tema municipal (Manual de Marca): Montserrat y Archivo, en reemplazo de
// Acumin Variable Concept, que es de pago y tiene ancho variable como Archivo.
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/montserrat/latin-800.css";
import "@fontsource/montserrat-alternates/latin-600.css";
import "@fontsource/montserrat-alternates/latin-700.css";
import "@fontsource-variable/archivo/wdth.css";
import { THEME, THEME_COLOR } from "@/lib/theme";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Papudo en tu Mano", template: "%s · Papudo en tu Mano" },
  description:
    "Guía turística de Papudo: balneario, patrimonio, gastronomía y alojamiento.",
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
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
    <html
      lang={locale}
      className="h-full antialiased"
      data-theme={THEME === "municipal" ? "municipal" : undefined}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
