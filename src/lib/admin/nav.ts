/**
 * Menú lateral del panel: grupos, enlaces y qué enlace marca la página
 * actual. Es puro para poder probarlo; el componente solo lo dibuja.
 */
import type { Freshness } from "@/lib/freshness";

export type NavBadge = "proposals" | "reviews";

export type NavItem = {
  /** Clave del texto en `admin.nav`. */
  key: string;
  href: string;
  badge?: NavBadge;
};

export type NavGroup = {
  /** Clave del título en `admin.nav.groups`; sin título, va arriba. */
  key: string | null;
  items: NavItem[];
};

export function navGroups(opts: {
  canEdit: boolean;
  superadmin: boolean;
}): NavGroup[] {
  const groups: NavGroup[] = [
    { key: null, items: [{ key: "home", href: "/admin" }] },
    {
      key: "content",
      items: [
        { key: "business", href: "/admin/comercios" },
        { key: "places", href: "/admin/fichas?tipo=lugar" },
        { key: "events", href: "/admin/fichas?tipo=evento" },
        { key: "routes", href: "/admin/fichas?tipo=ruta" },
        { key: "localities", href: "/admin/fichas?tipo=localidad" },
      ],
    },
    {
      key: "owners",
      items: [
        { key: "proposals", href: "/admin/propuestas", badge: "proposals" },
        ...(opts.canEdit
          ? [
              { key: "ownerLinks", href: "/admin/comercios/enlaces" },
              { key: "bulkImport", href: "/admin/comercios/importar" },
            ]
          : []),
      ],
    },
    {
      key: "visitors",
      items: [
        { key: "reviews", href: "/admin/comentarios", badge: "reviews" },
        { key: "metrics", href: "/admin/metricas" },
      ],
    },
    {
      key: opts.superadmin ? "superadmin" : "team",
      items: [{ key: "team", href: "/admin/equipo" }],
    },
  ];
  return groups;
}

/** Tipo de ficha de una ruta del panel (`/admin/lugar/…` o `?tipo=`). */
function fichaKind(pathname: string, tipo: string | null): string | null {
  if (pathname === "/admin/fichas") return tipo ?? "lugar";
  const m = /^\/admin\/(lugar|evento|ruta)\/[^/]+$/.exec(pathname);
  return m ? m[1] : null;
}

/**
 * Enlace activo: el más específico que contiene la página actual. Así
 * «Enlaces de locatarios» gana sobre «Comercios» en `/admin/comercios/enlaces`.
 */
export function activeHref(
  groups: NavGroup[],
  pathname: string,
  tipo: string | null,
): string | null {
  const kind = fichaKind(pathname, tipo);
  if (kind) return `/admin/fichas?tipo=${kind}`;
  let best: string | null = null;
  for (const { items } of groups)
    for (const { href } of items) {
      if (href.includes("?")) continue;
      const hit =
        href === "/admin"
          ? pathname === "/admin"
          : pathname === href || pathname.startsWith(`${href}/`);
      if (hit && (!best || href.length > best.length)) best = href;
    }
  return best;
}

/** Comercios que deben confirmar sus datos, por estado. */
export function businessDue(states: Freshness[]) {
  return {
    overdue: states.filter((s) => s === "overdue").length,
    soon: states.filter((s) => s === "soon").length,
    never: states.filter((s) => s === "never").length,
  };
}
