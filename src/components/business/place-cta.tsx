import { getTranslations } from "next-intl/server";
import type { Place } from "@/lib/data";
import { TrackedAnchor } from "@/components/analytics/tracked-link";

/** Botón de acción del comercio («Reserva por WhatsApp», «Ver carta»...). */
export async function PlaceCta({
  slug,
  cta,
}: {
  slug: string;
  cta: NonNullable<Place["cta"]>;
}) {
  const t = await getTranslations("place.cta");
  const external = cta.href.startsWith("http");
  return (
    <TrackedAnchor
      event="cta_click"
      eventProps={{ slug, kind: cta.kind }}
      href={cta.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="bg-coral text-coral-ink inline-flex min-h-12 items-center rounded-full px-6 font-extrabold shadow-sm active:scale-95"
    >
      {t(cta.kind)}
    </TrackedAnchor>
  );
}
