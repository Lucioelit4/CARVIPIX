import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  redirects: async () => [
    // CONSOLIDACIÓN NIVEL 1: Eliminar duplicados
    {
      source: "/bot-carvipix",
      destination: "/bot",
      permanent: true,
    },
    {
      source: "/programa-de-fondeo",
      destination: "/fondeo",
      permanent: true,
    },
    {
      source: "/gestion-de-capital",
      destination: "/gestion-capital",
      permanent: true,
    },
    {
      source: "/capital",
      destination: "/gestion-capital",
      permanent: true,
    },
    {
      source: "/analisis-diario",
      destination: "/analisis",
      permanent: true,
    },
    // PROTECCIÓN RUTAS INTERNAS: /engine no es pública
    {
      source: "/engine",
      destination: "/admin",
      permanent: false,
    },
    {
      source: "/engine/progreso",
      destination: "/admin",
      permanent: false,
    },
  ],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ],
    },
  ],
};

export default nextConfig;
