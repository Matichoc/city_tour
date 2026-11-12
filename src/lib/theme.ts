/**
 * Tema visual del sitio.
 *
 * - `base`: la paleta propia de «Papudo en tu Mano» (globals.css, :root).
 * - `municipal`: el Manual de Marca de la Municipalidad de Papudo (2026):
 *   azul institucional, colores del isotipo y de los cinco sentidos,
 *   Montserrat en títulos. Se activa con NEXT_PUBLIC_THEME=municipal, así se
 *   puede mostrar en un ambiente sin cambiar los demás.
 */
export type Theme = "base" | "municipal";

/**
 * El demo (rama `demo` en Vercel) muestra la propuesta municipal: tema
 * municipal, contenido de la guía (del repo) y sin fichas de ejemplo. Vercel
 * entrega el nombre de la rama en NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF.
 */
export const IS_DEMO_BRANCH =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === "demo";

export const THEME: Theme =
  process.env.NEXT_PUBLIC_THEME === "municipal" || IS_DEMO_BRANCH
    ? "municipal"
    : "base";

/** Símbolo junto al nombre (barra superior, quiosco, «Mi local»). */
export const BRAND_SYMBOL =
  THEME === "municipal"
    ? { src: "/brand/municipal/papudo-isotipo.webp", width: 96, height: 256 }
    : { src: "/brand/papudo-simbolo.webp", width: 27, height: 32 };

/** Color de la barra del navegador en el celular. */
export const THEME_COLOR = THEME === "municipal" ? "#283270" : "#1b7070";
