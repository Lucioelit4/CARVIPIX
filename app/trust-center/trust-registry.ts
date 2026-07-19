export type TrustEvidenceStatus = "verified" | "pending";

export type TrustEvidenceItem = {
  id: string;
  label: string;
  status: TrustEvidenceStatus;
  detail: string;
  sourceLabel: string;
  sourceHref: string;
  updatedAt: string;
};

export type TrustTimelineEvent = {
  year: number;
  title: string;
  detail: string;
  sourceLabel: string;
  sourceHref: string;
};

export const TRUST_CENTER_START_YEAR = 2019;

export const TRUST_EVIDENCE_ITEMS: TrustEvidenceItem[] = [
  {
    id: "empresa-verificada",
    label: "Empresa verificada",
    status: "verified",
    detail: "Identidad de empresa y alcance publico documentados en modulos legales y corporativos.",
    sourceLabel: "Aviso legal",
    sourceHref: "/legal",
    updatedAt: "2026-07-18",
  },
  {
    id: "marca-registrada",
    label: "Marca registrada",
    status: "pending",
    detail: "Marca registrada - evidencia pendiente de publicacion.",
    sourceLabel: "Centro de evidencias",
    sourceHref: "/trust-center/respaldos",
    updatedAt: "2026-07-18",
  },
  {
    id: "dominio-protegido",
    label: "Dominio protegido",
    status: "verified",
    detail: "Dominio canonico publico unificado en carvipix.com dentro de metadatos y sitemap.",
    sourceLabel: "Sitemap",
    sourceHref: "/sitemap.xml",
    updatedAt: "2026-07-18",
  },
  {
    id: "conexion-cifrada",
    label: "Conexion cifrada",
    status: "verified",
    detail: "Rutas publicas y canonical definidas sobre HTTPS en el sitio principal.",
    sourceLabel: "Home metadata",
    sourceHref: "/",
    updatedAt: "2026-07-18",
  },
  {
    id: "politicas-publicas",
    label: "Politicas publicas",
    status: "verified",
    detail: "Documentacion legal publica activa y centralizada para usuarios y terceros.",
    sourceLabel: "Cumplimiento",
    sourceHref: "/trust-center/cumplimiento",
    updatedAt: "2026-07-18",
  },
  {
    id: "plataforma-operativa",
    label: "Plataforma operativa",
    status: "verified",
    detail: "Modulo de salud publica disponible con estado y componentes del sistema.",
    sourceLabel: "Health endpoint",
    sourceHref: "/api/health",
    updatedAt: "2026-07-18",
  },
  {
    id: "servicios-activos",
    label: "Servicios activos",
    status: "verified",
    detail: "Catalogo comercial con servicios activos y otros claramente marcados como proximamente.",
    sourceLabel: "Servicios",
    sourceHref: "/servicios",
    updatedAt: "2026-07-18",
  },
];

export const TRUST_TIMELINE: TrustTimelineEvent[] = [
  {
    year: 2019,
    title: "Inicio de la trayectoria reportada",
    detail: "Base historica de operacion previa a la plataforma actual.",
    sourceLabel: "Empresa",
    sourceHref: "/trust-center/empresa",
  },
  {
    year: 2020,
    title: "Primeras iteraciones de alertas",
    detail: "Consolidacion del enfoque operativo orientado a traders.",
    sourceLabel: "Empresa",
    sourceHref: "/trust-center/empresa",
  },
  {
    year: 2021,
    title: "Evolucion metodologica",
    detail: "Refinamiento de disciplina operativa y control de riesgo.",
    sourceLabel: "Transparencia",
    sourceHref: "/trust-center/metodologia",
  },
  {
    year: 2022,
    title: "Fortalecimiento de producto",
    detail: "Expansion progresiva de modulos, estructura y trazabilidad.",
    sourceLabel: "Roadmap",
    sourceHref: "/trust-center/roadmap",
  },
  {
    year: 2023,
    title: "Maduracion de arquitectura",
    detail: "Consolidacion de capas de backend, contratos y servicios del ecosistema.",
    sourceLabel: "Arquitectura",
    sourceHref: "/trust-center/tecnologico",
  },
  {
    year: 2024,
    title: "Estabilidad y cumplimiento",
    detail: "Ajustes de documentacion legal, coherencia comercial y seguridad operacional.",
    sourceLabel: "Cumplimiento",
    sourceHref: "/trust-center/cumplimiento",
  },
  {
    year: 2025,
    title: "Preparacion de infraestructura viva",
    detail: "Instrumentacion de monitoreo, estados y control de calidad del sistema.",
    sourceLabel: "Estado de la plataforma",
    sourceHref: "/trust-center/estado",
  },
  {
    year: 2026,
    title: "Lanzamiento de CARVIPIX Transparency & Trust Center",
    detail: "Transparencia, evidencia y confianza documentada como capa publica permanente.",
    sourceLabel: "Trust Center",
    sourceHref: "/trust-center",
  },
];
