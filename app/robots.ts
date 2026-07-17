import type { MetadataRoute } from "next";

const SITE_URL = "https://carvipix.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all crawlers on public pages
        userAgent: "*",
        allow: [
          "/",
          "/servicios",
          "/resultados",
          "/fondeo",
          "/comunidad",
          "/registro",
          "/login",
          "/legal",
          "/terms",
          "/privacy",
          "/cookies",
          "/risk-disclosure",
        ],
        disallow: [
          // Private/authenticated areas — no SEO value, protect from indexing
          "/dashboard",
          "/admin",
          "/alertas",
          "/bot",
          "/bot-mt5",
          "/herramientas",
          "/analisis",
          "/perfil",
          "/checkout",
          "/pagos-recurrentes",
          "/cancelacion",
          "/reembolsos",
          "/soporte",
          "/gestion",
          "/gestion-capital",
          "/studio",
          "/engine",
          "/ai",
          "/academia",
          "/learning-engine",
          "/research-lab",
          "/crear-cuenta",
          "/verificar-correo",
          "/recuperar-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
