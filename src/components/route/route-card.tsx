import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Route } from "@/lib/data";
import { styleOf } from "@/lib/doors";
import { AiBadge } from "@/components/ui/ai-badge";

/**
 * Tarjeta de ruta: imagen, nombre, descripción y la línea de paradas, con un
 * cuadrito numerado del color de la puerta de cada parada (la ruta es una
 * secuencia: aquí el número sí informa).
 */
export function RouteCard({ route }: { route: Route }) {
  const t = useTranslations("routes");
  const th = useTranslations("home");
  const names = route.stops.length <= 4;
  return (
    <Link
      href={{ pathname: "/rutas/[slug]", params: { slug: route.slug } }}
      className="border-foreground hover:bg-soft flex h-full flex-col overflow-hidden rounded-[1.6rem] border-2 transition"
    >
      {route.cover ? (
        <span className="relative block h-44 sm:h-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={route.cover.src}
            alt=""
            width={1448}
            height={1086}
            loading="lazy"
            className="size-full object-cover"
          />
          <AiBadge className="absolute top-2 right-3" />
        </span>
      ) : null}
      <span className="flex flex-1 flex-col p-5">
        <span className="font-display text-2xl leading-tight font-extrabold">
          {route.name}
        </span>
        <span className="text-muted mt-1.5 text-sm">{route.description}</span>
        <ol
          aria-label={t("stops", { count: route.stops.length })}
          className="mt-4 flex items-center"
        >
          {route.stops.map((s, i) => {
            const tone = styleOf(s.place.categorySlug);
            return (
              <li
                key={s.place.slug}
                className={`flex items-center ${i < route.stops.length - 1 ? "flex-1" : ""}`}
              >
                <span
                  className={`ring-foreground grid size-7 shrink-0 place-items-center rounded-lg border-2 border-white text-xs font-extrabold ring-2 ${tone.frame} ${tone.on}`}
                  title={s.place.name}
                >
                  {i + 1}
                  <span className="sr-only">{s.place.name}</span>
                </span>
                {i < route.stops.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="bg-foreground h-0.5 flex-1"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        {names ? (
          <span
            aria-hidden="true"
            className="text-muted mt-1.5 flex justify-between gap-2 text-xs font-semibold"
          >
            {route.stops.map((s) => (
              <span key={s.place.slug} className="max-w-24 truncate">
                {s.place.name}
              </span>
            ))}
          </span>
        ) : null}
        <span className="mt-4 text-sm font-bold">
          {th("routeMeta", { count: route.stops.length })}
        </span>
      </span>
    </Link>
  );
}
