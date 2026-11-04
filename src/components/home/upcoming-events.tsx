import { Link } from "@/i18n/navigation";

export type UpcomingItem = {
  slug: string;
  name: string;
  /** Día del mes, o `null` si solo se sabe el mes. */
  day: number | null;
  /** Mes abreviado ("nov"). */
  month: string;
  /** "En 23 días", o la fecha en palabras si no tiene día fijo. */
  when: string;
  demoLabel: string | null;
};

/**
 * «Se viene»: las próximas fiestas de la comuna. La primera va destacada en el
 * rojo del cuadro de patrimonio (son celebraciones de la comuna); el resto,
 * en filas con su fecha.
 */
export function UpcomingEvents({ items }: { items: UpcomingItem[] }) {
  const [first, ...rest] = items;
  if (!first) return null;
  return (
    <ul className="flex flex-col">
      <li>
        <Link
          href={{ pathname: "/eventos/[slug]", params: { slug: first.slug } }}
          className="bg-cuadro-patri block rounded-[1.6rem] p-1.5 text-white transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-4 rounded-[1.3rem] border-[3px] border-white/90 p-4">
            <DateBlock item={first} big />
            <span className="min-w-0">
              <span className="font-display block text-xl leading-tight font-extrabold">
                {first.name}
              </span>
              <span className="mt-1 block text-sm font-semibold">
                {first.demoLabel ?? first.when}
              </span>
            </span>
          </span>
        </Link>
      </li>
      {rest.map((e) => (
        <li key={e.slug} className="border-border border-b">
          <Link
            href={{ pathname: "/eventos/[slug]", params: { slug: e.slug } }}
            className="flex items-center gap-4 py-3"
          >
            <DateBlock item={e} />
            <span className="min-w-0">
              <span className="block font-bold">{e.name}</span>
              <span className="text-muted text-sm">
                {e.demoLabel ?? e.when}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DateBlock({
  item,
  big = false,
}: {
  item: UpcomingItem;
  big?: boolean;
}) {
  return (
    <span
      className={`font-display flex w-14 shrink-0 flex-col items-center leading-none font-extrabold ${big ? "text-5xl" : "text-3xl"}`}
      aria-hidden="true"
    >
      {item.day ?? ""}
      <span
        className={`font-sans text-sm font-bold ${big ? "mt-1" : "text-earth mt-0.5"} ${item.day ? "" : "text-base"}`}
      >
        {item.month}
      </span>
    </span>
  );
}
