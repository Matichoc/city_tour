import type { MetadataRoute } from "next";
import { getData } from "@/lib/data";
import { localizedUrl } from "@/lib/seo";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getData();
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
    for (const slug of data.listIndexablePlaceSlugs()) {
      entries.push({
        url: localizedUrl(locale, {
          pathname: "/lugares/[slug]",
          params: { slug },
        }),
      });
    }
    for (const slug of data.listIndexableEventSlugs()) {
      entries.push({
        url: localizedUrl(locale, {
          pathname: "/eventos/[slug]",
          params: { slug },
        }),
      });
    }
    for (const slug of data.listLocalitySlugs()) {
      entries.push({
        url: localizedUrl(locale, {
          pathname: "/pueblos/[slug]",
          params: { slug },
        }),
      });
    }
    for (const slug of data.listRouteSlugs()) {
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
