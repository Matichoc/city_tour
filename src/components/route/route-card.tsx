import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Route } from "@/lib/data";
import { formatDuration } from "@/lib/itinerary-format";
import { AiBadge } from "@/components/ui/ai-badge";

/** Tarjeta de ruta con su ilustración de fondo (o degradado si no tiene). */
export function RouteCard({
  route,
  index = 0,
  kicker,
}: {
  route: Route;
  index?: number;
  kicker?: string;
}) {
  const t = useTranslations("routes");
  return (
    <Link
      href={{ pathname: "/rutas/[slug]", params: { slug: route.slug } }}
      style={{ "--i": index } as React.CSSProperties}
      className="card-lift rise-in relative isolate block min-h-64 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#07495a,#0b7285_60%,#4a7a37)] text-white shadow-md"
    >
      {route.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={route.cover.src}
          alt={route.cover.alt}
          width={1448}
          height={1086}
          loading="lazy"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
      ) : null}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgb(7_73_90_/_0.92)_0%,rgb(7_73_90_/_0.55)_55%,rgb(7_73_90_/_0.05)_100%)]"
        aria-hidden="true"
      />
      {route.cover ? <AiBadge className="absolute top-3 right-3" /> : null}
      <div className="flex min-h-64 flex-col justify-end p-6">
        {kicker ? (
          <p className="text-xs font-bold tracking-widest text-[#ffe3a8] uppercase">
            {kicker}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-extrabold">{route.name}</h2>
        <p className="mt-2 max-w-md text-sm text-white/90">
          {route.description}
        </p>
        <p className="mt-3 text-sm font-bold text-[#ffe3a8]">
          {t("stops", { count: route.stops.length })}
          {route.durationMinutes
            ? ` · ${formatDuration(route.durationMinutes)}`
            : ""}
        </p>
      </div>
    </Link>
  );
}
