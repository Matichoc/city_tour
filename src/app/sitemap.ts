import type { MetadataRoute } from "next";
import {
  listIndexableEventSlugs,
  listIndexablePlaceSlugs,
  listLocalitySlugs,
  listRouteSlugs,
} from "@/lib/data";
import { localizedUrl } from "@/lib/seo";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const href of [
      "/",
      "/explorar",
      "/eventos",
      "/rutas",
      "/recorrido",
      "/informacion",
      "/negocios",
    ] as const) {
      entries.push({ url: localizedUrl(locale, href) });
    }
    for (const slug of listIndexablePlaceSlugs()) {
      entries.push({
        url: localizedUrl(locale, {
          pathname: "/lugares/[slug]",
          params: { slug },
        }),
      });
    }
    for (const slug of listIndexableEventSlugs()) {
      entries.push({
        url: localizedUrl(locale, {
          pathname: "/eventos/[slug]",
          params: { slug },
        }),
      });
    }
    for (const slug of listLocalitySlugs()) {
      entries.push({
        url: localizedUrl(locale, {
          pathname: "/pueblos/[slug]",
          params: { slug },
        }),
      });
    }
    for (const slug of listRouteSlugs()) {
      entries.push({
        url: localizedUrl(locale, {
          pathname: "/rutas/[slug]",
          params: { slug },
        }),
      });
    }
  }
  return entries;
}
