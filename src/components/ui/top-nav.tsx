import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

export function TopNav() {
  const t = useTranslations("brand");
  return (
    <header className="border-border bg-background/90 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-sea text-lg font-bold">
          {t("name")}
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
