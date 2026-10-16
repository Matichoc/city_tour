import type { CategorySlug } from "@/content/types";

const PATHS: Record<CategorySlug, string> = {
  balneario:
    "M2 16c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M2 20c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M12 3v6m-4-2l4-4 4 4",
  recreacion:
    "M13 4a2 2 0 11-4 0 2 2 0 014 0zM7 21l3-7-2-3 4-3 3 3 3 1M10 14l4 2 1 5",
  deportes:
    "M5 19a3 3 0 100-6 3 3 0 000 6zM19 19a3 3 0 100-6 3 3 0 000 6zM5 16l4-7h6l4 7M9 9l3 7M13 6h3",
  patrimonio: "M3 21h18M5 21V9m14 12V9M3 9l9-6 9 6M9 21v-6a3 3 0 016 0v6",
  gastronomia: "M6 3v7a2 2 0 002 2v9M10 3v7M6 7h4M17 3c-2 2-3 5-3 8h3v10",
  ruralidad:
    "M12 22V10m0 0c-4 0-7-3-7-7 4 0 7 3 7 7zm0 4c3 0 6-2.5 6-6-3 0-6 2.5-6 6z",
  alojamiento:
    "M3 20V8m18 12v-6a3 3 0 00-3-3H3m0 5h18M7 11V9a2 2 0 012-2h2a2 2 0 012 2v2",
};

export function CategoryIcon({
  category,
  className = "size-5",
}: {
  category: CategorySlug;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[category]} />
    </svg>
  );
}
