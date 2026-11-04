import { Link } from "@/i18n/navigation";
import type { Route } from "@/lib/data";
import { AiBadge } from "@/components/ui/ai-badge";

/**
 * «Ruta para hoy»: la ruta destacada con su imagen y las paradas en orden,
 * como chips numerados (la ruta es una secuencia: aquí el número sí informa).
 */
export function RouteSpotlight({
  route,
  meta,
}: {
  route: Route;
  /** "3 paradas · con audioguía". */
  meta: string;
}) {
  return (
    <Link
      href={{ pathname: "/rutas/[slug]", params: { slug: route.slug } }}
      className="relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-[1.6rem] bg-[linear-gradient(120deg,var(--sea-deep),var(--sea))] p-5 text-white sm:p-7"
    >
      {route.cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={route.cover.src}
            alt=""
            width={1448}
            height={1086}
            loading="lazy"
            className="absolute inset-0 -z-10 size-full object-cover"
          />
          <AiBadge className="absolute top-3 right-4" />
        </>
      ) : null}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(20_22_74_/_0.05)_0%,rgb(20_22_74_/_0.6)_45%,rgb(20_22_74_/_0.94)_100%)]"
      />
      <span className="font-display text-3xl leading-none font-extrabold sm:text-4xl">
        {route.name}
      </span>
      <span className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">
        {route.description}
      </span>
      <span className="mt-2 text-sm font-bold">{meta}</span>
      <ol className="mt-3 flex flex-wrap gap-2">
        {route.stops.map((s, i) => (
          <li
            key={s.place.slug}
            className="text-foreground rounded-full bg-white px-3 py-1 text-sm font-bold"
          >
            {i + 1} {s.place.name}
          </li>
        ))}
      </ol>
    </Link>
  );
}
