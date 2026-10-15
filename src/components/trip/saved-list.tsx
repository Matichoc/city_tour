"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSaved } from "@/lib/saved-store";
import { AddToTripButton } from "@/components/trip/add-to-trip-button";
import { SaveButton } from "@/components/place/save-button";

export type SavedPlaceOption = {
  slug: string;
  name: string;
  /** Solo los lugares con coordenada pueden sumarse al recorrido. */
  located: boolean;
};

/** "Tus guardados": lugares marcados con el corazón en este dispositivo. */
export function SavedList({ places }: { places: SavedPlaceOption[] }) {
  const t = useTranslations("saved");
  const saved = useSaved();
  const items = places.filter((p) => saved.includes(p.slug));
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="guardados" className="flex flex-col gap-3 px-4">
      <h2 id="guardados" className="font-display text-xl font-extrabold">
        {t("title")}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((p) => (
          <li
            key={p.slug}
            className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4"
          >
            <Link
              href={{ pathname: "/lugares/[slug]", params: { slug: p.slug } }}
              className="font-bold hover:underline"
            >
              {p.name}
            </Link>
            <div className="flex flex-wrap gap-2">
              {p.located ? <AddToTripButton slug={p.slug} /> : null}
              <SaveButton slug={p.slug} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
