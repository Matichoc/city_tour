import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Papudo en tu Mano",
    short_name: "Papudo",
    description: "Guía turística de Papudo: balneario, campo y patrimonio.",
    start_url: "/es",
    display: "standalone",
    background_color: "#fdf8ee",
    theme_color: "#1b7070",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
