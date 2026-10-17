import type { CategorySlug } from "@/content/types";
import { CategoryIcon } from "@/components/ui/category-icon";

const GRADIENT: Record<CategorySlug, string> = {
  balneario: "from-[#a9dedd] via-[#e0f5f4] to-[#f6e6a8]",
  recreacion: "from-[#f8d9e8] via-[#eeb0cf] to-[#b0447c]",
  deportes: "from-[#d6e4f6] via-[#a9c8ee] to-[#3f6fb5]",
  patrimonio: "from-[#f8dcda] via-[#f2aaa6] to-[#b8423f]",
  gastronomia: "from-[#fbe3c8] via-[#f7c79a] to-[#e3925a]",
  ruralidad: "from-[#d4f1f0] via-[#9fe0de] to-[#2a8584]",
  alojamiento: "from-[#ebe1f8] via-[#cdb6ef] to-[#6d52b0]",
};

/** Cabecera ilustrada de tarjeta: degradado + motivo de la categoría. */
export function CategoryScene({
  category,
  className = "h-20",
}: {
  category: CategorySlug;
  className?: string;
}) {
  const hills = category === "ruralidad" || category === "recreacion";
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
