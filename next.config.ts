import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Fotos del panel: ya vienen achicadas del navegador. Vercel acepta hasta
  // 4,5 MB por pedido, así que se deja un poco menos.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default withNextIntl(nextConfig);
