"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { activeHref, type NavBadge, type NavGroup } from "@/lib/admin/nav";

/**
 * Menú lateral agrupado del panel. En el celular se pliega bajo un botón
 * «Menú»; desde tablet queda siempre a la vista. `children` va al pie del
 * menú (rol, abrir el sitio y salir).
 */
export function AdminNav({
  groups,
  badges,
  children,
}: {
  groups: NavGroup[];
  badges: Record<NavBadge, number>;
  children: ReactNode;
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const tipo = useSearchParams().get("tipo");
  const active = activeHref(groups, pathname, tipo);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="admin-menu"
        className="border-border rounded-full border px-4 py-1.5 text-sm font-bold md:hidden"
      >
        {open ? t("closeMenu") : t("menu")}
      </button>
      <div
        id="admin-menu"
        className={`${open ? "block" : "hidden"} w-full md:block`}
      >
        <nav aria-label={t("label")} className="mt-3 flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.key ?? "top"} className="flex flex-col gap-1">
              {g.key && (
                <p className="text-muted px-3 text-xs font-bold tracking-wide uppercase">
                  {t(`groups.${g.key}`)}
                </p>
              )}
              {g.items.map((item) => {
                const current = item.href === active;
                const count = item.badge ? badges[item.badge] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                      current
                        ? "bg-sea-deep text-white"
                        : "text-sea-deep hover:bg-sea-soft"
                    }`}
                  >
                    {t(item.key)}
                    {count > 0 && (
                      <span
                        aria-label={t(`${item.badge!}Badge`, { count })}
                        className="bg-coral rounded-full px-2 py-0.5 text-xs font-extrabold text-white"
                      >
                        {count >= 100 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-border mt-6 border-t pt-4">{children}</div>
      </div>
    </>
  );
}
