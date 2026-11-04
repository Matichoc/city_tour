import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Place } from "@/lib/data";
import { styleOf } from "@/lib/doors";

const DOT = {
  verified: "bg-field",
  pending: "bg-[#c9a227]",
  outdated: "bg-muted",
} as const;

/**
 * Fila de un lugar en Explorar: miniatura con el doble marco del color de su
 * puerta (los cuadros del logo), nombre, descripción corta y su estado.
 */
export function PlaceRow({
  place,
  doorName,
}: {
  place: Place;
  /** Nombre de la puerta (o "Comer y dormir"), en el color de la puerta. */
  doorName: string;
}) {
  const t = useTranslations("place");
  const tc = useTranslations("common");
  const tone = styleOf(place.categorySlug);
  const thumb = place.logo
    ? { src: place.logo.src, logo: true, ai: false }
    : {
        src: place.picture.src,
        logo: place.picture.kind === "logo",
        ai: !place.picture.kind,
      };
  return (
    // El enlace se llama como el lugar; la descripción, la puerta y el estado
    // se leen como descripción (no alargan el nombre del enlace).
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      aria-labelledby={`fila-${place.slug}`}
      aria-describedby={`fila-${place.slug}-texto fila-${place.slug}-meta${thumb.ai ? ` fila-${place.slug}-ia` : ""}`}
      className="border-border hover:bg-soft -mx-2 flex items-center gap-4 rounded-2xl border-b px-2 py-3 transition"
    >
      <span
        className={`relative size-[4.5rem] shrink-0 rounded-[1.1rem] p-[3px] ${tone.frame}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb.src}
          alt=""
          loading="lazy"
          decoding="async"
          className={`size-full rounded-[0.85rem] border-2 border-white/95 ${
            thumb.logo
              ? "bg-white object-contain"
              : thumb.ai
                ? "object-cover mix-blend-multiply saturate-[.3]"
                : "object-cover"
          }`}
        />
        {/* Ilustración con IA: rótulo corto visible y completo para lectores. */}
        {thumb.ai ? (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1 text-[9px] leading-tight font-bold text-white">
            <span aria-hidden="true">IA</span>
            <span id={`fila-${place.slug}-ia`} className="sr-only">
              {tc("aiIllustration")}
            </span>
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <h2 id={`fila-${place.slug}`} className="leading-snug font-bold">
          {place.name}
        </h2>
        <span
          id={`fila-${place.slug}-texto`}
          className="text-muted mt-0.5 line-clamp-2 text-sm"
        >
          {place.shortDescription}
        </span>
        <span
          id={`fila-${place.slug}-meta`}
          className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold"
        >
          <span className={tone.ink}>{doorName}</span>
          {place.localityName ? (
            <span className="text-muted">{place.localityName}</span>
          ) : null}
          {place.demo ? (
            <span className="text-coral-ink bg-sun rounded-full px-2 py-0.5 font-extrabold">
              {t("demoBadge")}
            </span>
          ) : (
            <span className="text-muted inline-flex items-center gap-1.5">
              <span
                className={`size-2 rounded-full ${DOT[place.verification]}`}
                aria-hidden="true"
              />
              {t(place.verification)}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
