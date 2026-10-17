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
          <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
            <circle cx="22" cy="10" r="5" fill="#f4d36e" />
            <path
              d="M2 22c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3v6H2z"
              fill="#1b7070"
            />
            <path
              d="M2 27c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2v3H2z"
              fill="#6fcbca"
            />
          </svg>
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
