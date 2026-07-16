import type { NextConfig } from "next";
import { assertCriticalEnvironment, getRuntimeStage } from "./app/backend/core/config";

// Block startup in strict runtime stages when critical env is missing.
const runtimeStage = getRuntimeStage();
if (runtimeStage === "shadow" || runtimeStage === "production") {
  assertCriticalEnvironment();
}

const nextConfig: NextConfig = {
  // "standalone" is for Docker/VPS deployments only.
  // Vercel uses its own serverless output — do NOT set output:"standalone" here.
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
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
