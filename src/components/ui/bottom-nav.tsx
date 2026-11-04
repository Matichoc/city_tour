"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  {
    href: "/",
    key: "home",
    icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z",
  },
  {
    href: "/explorar",
    key: "explore",
    icon: "M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  },
  {
    href: "/rutas",
    key: "routes",
    icon: "M5 19a2 2 0 100-4 2 2 0 000 4zm14-10a2 2 0 100-4 2 2 0 000 4zM7 17h6a3 3 0 000-6h-2a3 3 0 010-6h4",
  },
  {
    href: "/eventos",
    key: "events",
    icon: "M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  },
  { href: "/recorrido", key: "tripShort", icon: "M6 3h12v18l-6-4-6 4z" },
  // Información queda en el menú de arriba (computador) y al pie de página:
  // cinco pestañas caben cómodas con el pulgar; seis no.
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("main")}
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t sm:hidden print:hidden"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ITEMS.map(({ href, key, icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] leading-tight ${
                  active
                    ? "text-foreground font-bold"
                    : "text-muted font-medium"
                }`}
              >
                {/* La pestaña activa lleva el amarillo del cuadro "mar y sol". */}
                <svg
                  viewBox="0 0 24 24"
                  className={`h-7 w-11 rounded-xl px-2.5 py-0.5 ${active ? "bg-cuadro-mar" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={icon} />
                </svg>
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
