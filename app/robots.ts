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
          "/socios-estrategicos",
          "/fondeo",
          "/registro",
          "/login",
          "/legal",
          "/terms",
          "/privacy",
          "/cookies",
          "/risk-disclosure",
          "/trust-center",
          "/trust-center/empresa",
          "/trust-center/cronologia",
          "/trust-center/numeros",
          "/trust-center/tecnologico",
          "/trust-center/calidad",
          "/trust-center/transparencia",
          "/trust-center/seguridad",
          "/trust-center/cumplimiento",
          "/trust-center/estado",
          "/trust-center/contacto",
          "/trust-center/metodologia",
          "/trust-center/filosofia",
          "/trust-center/preguntas-dificiles",
          "/trust-center/respaldos",
          "/trust-center/roadmap",
        ],
        disallow: [
          // Private/authenticated areas — no SEO value, protect from indexing
          "/dashboard",
          "/resultados",
          "/comunidad",
          "/admin",
          "/alertas",
          "/bot",
          "/bot-mt5",
          "/herramientas",
          "/analisis",
          "/perfil",
          "/checkout",
          "/gestion",
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
