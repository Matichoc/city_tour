import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Papudo en tu Mano",
    short_name: "Papudo",
    description: "Guía turística de Papudo: balneario, campo y patrimonio.",
    start_url: "/es",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: THEME_COLOR,
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
