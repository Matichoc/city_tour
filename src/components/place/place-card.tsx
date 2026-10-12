import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, localize, type Place } from "@/lib/demo-data";
import type { Locale } from "@/i18n/routing";
import { StatusBadge } from "@/components/place/status-badge";

export function PlaceCard({ place }: { place: Place }) {
  const locale = useLocale() as Locale;
  const category = CATEGORIES.find((c) => c.slug === place.category);

  return (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      className="border-border bg-surface hover:border-sea block rounded-2xl border p-4 shadow-sm transition"
    >
      <p className="text-hill text-xs font-semibold tracking-wide uppercase">
        {category ? localize(category.name, locale) : null}
      </p>
      <h3 className="font-display mt-1 text-lg leading-snug font-bold">
        {localize(place.name, locale)}
      </h3>
      <p className="text-muted mt-1 line-clamp-2 text-sm">
        {localize(place.shortDescription, locale)}
      </p>
      <div className="mt-3">
        <StatusBadge place={place} />
      </div>
    </Link>
  );
}
