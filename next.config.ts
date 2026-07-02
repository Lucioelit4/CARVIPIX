import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    {
      source: "/gestion-capital",
      destination: "/capital",
      permanent: true,
    },
    {
      source: "/gestion-de-capital",
      destination: "/capital",
      permanent: true,
    },
    {
      source: "/programa-de-fondeo",
      destination: "/fondeo",
      permanent: true,
    },
    {
      source: "/analisis-diario",
      destination: "/analisis",
      permanent: true,
    },
  ],
};

export default nextConfig;
