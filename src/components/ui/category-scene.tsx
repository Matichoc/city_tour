import type { CategorySlug } from "@/content/types";
import { CategoryIcon } from "@/components/ui/category-icon";

const GRADIENT: Record<CategorySlug, string> = {
  playas: "from-[#8fd8ea] via-[#cdeff2] to-[#f2dfb0]",
  naturaleza: "from-[#bfe3a8] via-[#8fc27a] to-[#4a7a37]",
  patrimonio: "from-[#f6dca6] via-[#e7b878] to-[#b4651f]",
  gastronomia: "from-[#ffd29a] via-[#ffa87a] to-[#ff7a59]",
  alojamiento: "from-[#d8f1f4] via-[#a6dbe6] to-[#5bb7c9]",
  actividades: "from-[#a6dbe6] via-[#6fc8b8] to-[#4a7a37]",
};

/** Cabecera ilustrada de tarjeta: degradado + motivo de la categoría. */
export function CategoryScene({
  category,
  className = "h-20",
}: {
  category: CategorySlug;
  className?: string;
}) {
  const hills = category === "naturaleza" || category === "actividades";
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${GRADIENT[category]} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-full w-full"
      >
        {hills ? (
          <>
            <path
              d="M0 80 V50 Q80 14 170 46 T400 40 V80Z"
              fill="#2f5233"
              fillOpacity="0.55"
            />
            <path
              d="M0 80 V64 Q120 34 240 62 T400 58 V80Z"
              fill="#2f5233"
              fillOpacity="0.7"
            />
          </>
        ) : (
          <>
            <path
              d="M0 80 V52 Q50 36 100 52 T200 52 T300 52 T400 52 V80Z"
              fill="#ffffff"
              fillOpacity="0.45"
            />
            <path
              d="M0 80 V64 Q50 50 100 64 T200 64 T300 64 T400 64 V80Z"
              fill="#ffffff"
              fillOpacity="0.7"
            />
          </>
        )}
      </svg>
      <span className="text-sea-deep absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/80 shadow-sm">
        <CategoryIcon category={category} />
      </span>
    </div>
  );
}
