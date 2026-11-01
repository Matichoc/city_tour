import type { CategorySlug } from "@/content/types";
import { CategoryIcon } from "@/components/ui/category-icon";

/** Degradados vivos por producto: claro arriba, profundo abajo (donde va el texto). */
export const CATEGORY_BG: Record<CategorySlug, string> = {
  // Colores del logo municipal, en versión pálida (docs/MARCA-REFERENCIA.md):
  // amarillo (mar y sol), magenta (árboles), rojo (patrimonio), turquesa
  // (campo) y sus mezclas para el resto.
  balneario: "from-[#f8e08a] via-[#e3bd50] to-[#8a6a14]",
  recreacion: "from-[#f4b3d4] via-[#d9709f] to-[#8a2f5e]",
  deportes: "from-[#a9c8ee] via-[#5f8fd0] to-[#2b4a86]",
  patrimonio: "from-[#f2aaa6] via-[#d96b67] to-[#8f2f2d]",
  gastronomia: "from-[#f7c79a] via-[#e3925a] to-[#93501f]",
  ruralidad: "from-[#9fe0de] via-[#4fb3b1] to-[#1d6463]",
  alojamiento: "from-[#cdb6ef] via-[#9a7bd6] to-[#4f3a86]",
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
