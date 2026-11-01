import { Link } from "@/i18n/navigation";
import type { Picture } from "@/lib/data";
import { IllustratedImage } from "@/components/ui/illustrated-image";

export type FeaturedItem = {
  kind: "place" | "event";
  slug: string;
  kicker: string;
  name: string;
  /** Línea de cuándo (eventos) o breve descripción (lugares). */
  detail: string;
  picture: Picture;
  /** «Ejemplo» si es contenido ficticio de demostración. */
  demoLabel: string | null;
};

/** Tarjeta de un destacado de la portada: entra a la ficha del lugar o del evento. */
export function FeaturedCard({
  item,
  index = 0,
}: {
  item: FeaturedItem;
  index?: number;
}) {
  const body = (
    <>
      <IllustratedImage picture={item.picture} className="h-36" />
      <span className="block p-4">
        <span className="text-field block text-xs font-bold tracking-wide uppercase">
          {item.kicker}
          {item.demoLabel ? ` · ${item.demoLabel}` : ""}
        </span>
        <span className="font-display mt-1 block text-lg leading-snug font-extrabold">
          {item.name}
        </span>
        <span className="text-muted mt-1 line-clamp-2 text-sm">
          {item.detail}
        </span>
      </span>
    </>
  );
  const className =
    "card-lift rise-in border-border bg-surface block h-full overflow-hidden rounded-2xl border shadow-sm";
  const style = { "--i": index } as React.CSSProperties;
  return item.kind === "event" ? (
    <Link
      href={{ pathname: "/eventos/[slug]", params: { slug: item.slug } }}
      style={style}
      className={className}
    >
      {body}
    </Link>
  ) : (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: item.slug } }}
      style={style}
      className={className}
    >
      {body}
    </Link>
  );
}
