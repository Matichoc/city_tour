import { defineRouting } from "next-intl/routing";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

/** Español es el idioma principal; inglés es opcional y cae a español. */
export const defaultLocale: Locale = "es";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  // Primera visita siempre en español: no se usa Accept-Language del navegador.
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/explorar": { es: "/explorar", en: "/explore" },
    "/eventos": { es: "/eventos", en: "/events" },
    "/rutas": { es: "/rutas", en: "/routes" },
    "/rutas/[slug]": { es: "/rutas/[slug]", en: "/routes/[slug]" },
    "/lugares/[slug]": { es: "/lugares/[slug]", en: "/places/[slug]" },
    "/pueblos/[slug]": { es: "/pueblos/[slug]", en: "/villages/[slug]" },
    "/recorrido": { es: "/recorrido", en: "/my-trip" },
    "/informacion": { es: "/informacion", en: "/info" },
    "/negocios": { es: "/negocios", en: "/for-business" },
    "/qr": "/qr",
  },
});
