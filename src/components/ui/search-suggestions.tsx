import { Link } from "@/i18n/navigation";

/**
 * Explica qué se puede buscar y ofrece ejemplos tocables. Los ejemplos son
 * búsquedas que hoy devuelven resultados (lo vigila tests/unit/search.test.ts).
 */
export function SearchSuggestions({
  hint,
  tryLabel,
  examples,
  tone = "page",
}: {
  hint: string;
  tryLabel: string;
  examples: string[];
  /** `hero`: sobre fondo oscuro; `page`: sobre fondo claro. */
  tone?: "hero" | "page";
}) {
  const hero = tone === "hero";
  const text = hero ? "text-white/85" : "text-muted";
  const chip = hero
    ? "bg-white/15 text-white hover:bg-white/25"
    : "bg-sea-soft text-sea-deep hover:bg-sea hover:text-white";
  return (
    <div className="flex max-w-md flex-col gap-1">
      <p id="search-hint" className={`text-sm ${text}`}>
        {hint}
      </p>
      <ul aria-label={tryLabel} className="flex flex-wrap items-center gap-x-2">
        <li aria-hidden="true" className={`text-sm font-bold ${text}`}>
          {tryLabel}
        </li>
        {examples.map((q) => (
          <li key={q}>
            <Link
              href={{ pathname: "/explorar", query: { q } }}
              className={`inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-bold transition ${chip}`}
            >
              {q}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
