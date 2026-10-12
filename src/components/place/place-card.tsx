import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Place } from "@/lib/data";
import { CategoryScene } from "@/components/ui/category-scene";
import { StatusBadge } from "@/components/place/status-badge";

export function PlaceCard({
  place,
  index = 0,
}: {
  place: Place;
  index?: number;
}) {
  const t = useTranslations("place");
  return (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      style={{ "--i": index } as React.CSSProperties}
      className="card-lift rise-in border-border bg-surface block rounded-2xl border shadow-sm"
    >
      <CategoryScene category={place.categorySlug} />
      <div className="p-4">
        <p className="text-field text-xs font-bold tracking-wide uppercase">
          {place.categoryName}
          {place.localityName ? ` · ${place.localityName}` : ""}
        </p>
        <h3 className="font-display mt-1 text-lg leading-snug font-extrabold">
          {place.name}
        </h3>
        <p className="text-muted mt-1 line-clamp-2 text-sm">
          {place.shortDescription}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge verification={place.verification} />
          {place.fallbackToSpanish ? (
            <span className="text-muted text-xs">{t("onlySpanish")}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
