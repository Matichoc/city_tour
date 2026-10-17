import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_NAME = "Papudo en tu mano";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

type Href = Parameters<typeof getPathname>[0]["href"];

export function localizedUrl(locale: Locale, href: Href): string {
  return `${getSiteUrl()}${getPathname({ locale, href })}`;
}

/** Título, canonical, hreflang (es/en/x-default) y Open Graph de una página. */
export function buildPageMetadata({
  locale,
  href,
  title,
  description,
  image,
}: {
  locale: Locale;
  href: Href;
  title: string;
  description?: string;
  /** Ruta de una imagen en /public para compartir (WhatsApp, redes). */
  image?: string;
}): Metadata {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, localizedUrl(l, href)]),
  );
  languages["x-default"] = localizedUrl(routing.defaultLocale, href);
  const imageUrl = image ? `${getSiteUrl()}${image}` : undefined;
  return {
    title,
    description,
    alternates: { canonical: localizedUrl(locale, href), languages },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale,
      type: "website",
      url: localizedUrl(locale, href),
      ...(imageUrl
        ? { images: [{ url: imageUrl, width: 1448, height: 1086 }] }
        : {}),
    },
    ...(imageUrl
      ? {
          twitter: { card: "summary_large_image" as const, images: [imageUrl] },
        }
      : {}),
  };
}

export function truncate(text: string, max = 160): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
