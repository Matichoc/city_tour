import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

export function TopNav() {
  const t = useTranslations("brand");
  const n = useTranslations("nav");
  const links = [
    ["/explorar", "explore"],
    ["/eventos", "events"],
    ["/rutas", "routes"],
    ["/recorrido", "trip"],
    ["/informacion", "info"],
  ] as const;
  return (
    <header className="border-border bg-background/90 sticky top-0 z-30 border-b backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link
          href="/"
          className="font-display text-sea-deep flex items-center gap-2 text-lg font-extrabold"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/papudo-simbolo.webp"
            alt=""
            width={27}
            height={32}
            className="h-8 w-auto"
          />
          {t("name")}
        </Link>
        <nav
          aria-label={n("main")}
          className="hidden items-center gap-1 sm:flex"
        >
          {links.map(([href, key]) => (
            <Link
              key={key}
              href={href}
              className="text-muted hover:bg-sea-soft hover:text-sea-deep rounded-full px-3 py-1.5 text-sm font-semibold"
            >
              {n(key)}
            </Link>
          ))}
        </nav>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
