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
  { href: "/recorrido", key: "trip", icon: "M6 3h12v18l-6-4-6 4z" },
  {
    href: "/informacion",
    key: "info",
    icon: "M12 22a10 10 0 100-20 10 10 0 000 20zm0-11v6m0-9.5v.5",
  },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("main")}
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t sm:hidden"
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
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-sea" : "text-muted"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
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
