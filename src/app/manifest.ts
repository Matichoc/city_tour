import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Papudo en tu mano",
    short_name: "Papudo",
    description: "Guía turística de Papudo: playas, campo y patrimonio.",
    start_url: "/es",
    display: "standalone",
    background_color: "#fdf8ee",
    theme_color: "#0b7285",
    lang: "es",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
