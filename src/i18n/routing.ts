import { defineRouting } from "next-intl/routing";

export const locales = ["es", "en", "pt"] as const;
export type Locale = (typeof locales)[number];

/**
 * Español es el idioma principal; inglés y portugués son opcionales y, si falta
 * la traducción de un contenido, caen a español (el PLADETUR pide español,
 * inglés y portugués, pp. 150 y 174).
 */
export const defaultLocale: Locale = "es";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  // Primera visita siempre en español: no se usa Accept-Language del navegador.
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/explorar": { es: "/explorar", en: "/explore", pt: "/explorar" },
    "/eventos": { es: "/eventos", en: "/events", pt: "/eventos" },
    "/eventos/[slug]": {
      es: "/eventos/[slug]",
      en: "/events/[slug]",
      pt: "/eventos/[slug]",
    },
    "/quiosco": { es: "/quiosco", en: "/kiosk", pt: "/quiosque" },
    "/rutas": { es: "/rutas", en: "/routes", pt: "/roteiros" },
    "/rutas/[slug]": {
      es: "/rutas/[slug]",
      en: "/routes/[slug]",
      pt: "/roteiros/[slug]",
    },
    "/lugares/[slug]": {
      es: "/lugares/[slug]",
      en: "/places/[slug]",
      pt: "/lugares/[slug]",
    },
    "/pueblos/[slug]": {
      es: "/pueblos/[slug]",
      en: "/villages/[slug]",
      pt: "/localidades/[slug]",
    },
    "/recorrido": { es: "/recorrido", en: "/my-trip", pt: "/meu-roteiro" },
    "/informacion": { es: "/informacion", en: "/info", pt: "/informacoes" },
    "/negocios": {
      es: "/negocios",
      en: "/for-business",
      pt: "/para-negocios",
    },
    "/qr": "/qr",
  },
});
