import { Link } from "@/i18n/navigation";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CATEGORY_BG } from "@/components/ui/category-card";
import type { CategorySlug } from "@/content/types";

/** Fila compacta de accesos por categoría: lleva a Explorar ya filtrado. */
export function CategoryShortcuts({
  categories,
}: {
  categories: { slug: CategorySlug; name: string }[];
}) {
  return (
    <ul className="-mx-4 flex snap-x [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => (
        <li key={c.slug} className="shrink-0 snap-start">
          <Link
            href={{ pathname: "/explorar", query: { categoria: c.slug } }}
            className="border-border bg-surface hover:border-sea flex min-h-12 items-center gap-2 rounded-full border-2 py-1 pr-4 pl-1.5 text-sm font-extrabold shadow-sm transition active:scale-95"
          >
            <span
              className={`grid size-9 place-items-center rounded-full bg-gradient-to-b text-white ${CATEGORY_BG[c.slug]}`}
            >
              <CategoryIcon category={c.slug} className="size-5" />
            </span>
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
