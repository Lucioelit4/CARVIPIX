import type { NextConfig } from "next";
import { assertCriticalEnvironment, getRuntimeStage } from "./app/backend/core/config";

// Validation is deferred to runtime (middleware/startup) instead of build time
// This allows Docker builds to succeed even without environment variables
// The assertCriticalEnvironment() function will still run on server startup
const runtimeStage = getRuntimeStage();
// Skip validation during build; it will happen at runtime via middleware/API routes
// Build-time validation would block Docker image creation which is counterproductive

const nextConfig: NextConfig = {
  // Set output to 'standalone' for Docker deployments (Railway)
  // This creates .next/standalone directory required by Dockerfile
  output: 'standalone',
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
