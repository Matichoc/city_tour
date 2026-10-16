import type { CategorySlug } from "@/content/types";
import { CategoryIcon } from "@/components/ui/category-icon";

/** Degradados vivos por producto: claro arriba, profundo abajo (donde va el texto). */
export const CATEGORY_BG: Record<CategorySlug, string> = {
  balneario: "from-[#2fd0e3] via-[#0f9cb5] to-[#07495a]",
  recreacion: "from-[#5fdcb4] via-[#2a9d7f] to-[#145c4d]",
  deportes: "from-[#9b8cf0] via-[#6a58c9] to-[#372b78]",
  patrimonio: "from-[#ffc36b] via-[#d9822b] to-[#8a4a0e]",
  gastronomia: "from-[#ff9a70] via-[#e2543a] to-[#a22f18]",
  ruralidad: "from-[#9ed66e] via-[#5a9a3f] to-[#2a4f2d]",
  alojamiento: "from-[#6fcbe0] via-[#2f8fb0] to-[#0a4457]",
};

/** Clases del contenedor (el <a> o <button> que envuelve la tarjeta). */
export const categoryCardClass =
  "group relative block w-full overflow-hidden rounded-[1.75rem] text-left text-white shadow-md transition duration-300 hover:-translate-y-1.5 hover:-rotate-1 hover:shadow-xl active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:transform-none";

/**
 * Tarjeta vertical y colorida de un producto turístico: ícono flotando, olas,
 * sol y el nombre grande abajo. Se usa en la portada y en el quiosco.
 */
export function CategoryCardFace({
  category,
  name,
  countLabel,
  index = 0,
  compactOnWide = false,
}: {
  category: CategorySlug;
  name: string;
  countLabel: string;
  index?: number;
  /** En pantallas anchas (web) la tarjeta es más pequeña. */
  compactOnWide?: boolean;
}) {
  return (
    <span
      className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-b p-4 ${CATEGORY_BG[category]}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* Sol y burbujas */}
      <span
        aria-hidden="true"
        className="absolute -top-6 -right-6 size-28 rounded-full bg-white/15 transition-transform duration-500 group-hover:scale-125"
      />
      <span
        aria-hidden="true"
        className="absolute top-20 left-3 size-3 rounded-full bg-white/30"
      />
      <span
        aria-hidden="true"
        className="absolute top-28 right-6 size-2 rounded-full bg-white/40"
      />
      {/* Ícono gigante de fondo */}
      <CategoryIcon
        category={category}
        className="absolute -right-5 bottom-14 size-36 rotate-12 text-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0"
      />
      {/* Olas */}
      <svg
        viewBox="0 0 200 60"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-20 w-full"
      >
        <path
          d="M0 30 Q25 14 50 30 T100 30 T150 30 T200 30 V60 H0Z"
          fill="#ffffff"
          fillOpacity="0.1"
        />
        <path
          d="M0 40 Q25 26 50 40 T100 40 T150 40 T200 40 V60 H0Z"
          fill="#ffffff"
          fillOpacity="0.12"
        />
      </svg>

      <span className="bob relative grid size-14 place-items-center rounded-2xl bg-white/25 shadow-inner backdrop-blur-sm">
        <CategoryIcon category={category} className="size-8" />
      </span>

      <span className="relative flex flex-col gap-2">
        <span
          className={`font-display text-[1.65rem] leading-[1.05] font-extrabold drop-shadow-sm ${compactOnWide ? "sm:text-xl" : ""}`}
        >
          {name}
        </span>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-black/25 px-3 py-1 text-sm font-bold backdrop-blur-sm">
          {countLabel}
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </span>
    </span>
  );
}

/** Tarjeta vertical para secciones que no son un producto (eventos, rutas). */
export function FeatureCardFace({
  gradient,
  title,
  countLabel,
  glyph,
}: {
  gradient: string;
  title: string;
  countLabel: string;
  glyph: string;
}) {
  return (
    <span
      className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-b p-4 ${gradient}`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-6 -right-6 size-28 rounded-full bg-white/15 transition-transform duration-500 group-hover:scale-125"
      />
      <span
        aria-hidden="true"
        className="font-display absolute -right-2 bottom-12 text-[9rem] leading-none text-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
      >
        {glyph}
      </span>
      <span
        aria-hidden="true"
        className="bob relative grid size-14 place-items-center rounded-2xl bg-white/25 text-3xl shadow-inner backdrop-blur-sm"
      >
        {glyph}
      </span>
      <span className="relative flex flex-col gap-2">
        <span className="font-display text-[1.65rem] leading-[1.05] font-extrabold drop-shadow-sm">
          {title}
        </span>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-black/25 px-3 py-1 text-sm font-bold backdrop-blur-sm">
          {countLabel}
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </span>
    </span>
  );
}
