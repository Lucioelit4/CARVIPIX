import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CARVIPIX Trader",
    short_name: "CARVIPIX Trader",
    description: "Herramienta operativa para clientes activos de CARVIPIX enfocada en alertas y ejecucion rapida.",
    start_url: "/trader",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030303",
    theme_color: "#D4AF37",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/logo/carvipix-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
