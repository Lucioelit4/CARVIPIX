export type LegalDocumentStatus = "Activo" | "Borrador" | "Obsoleto";

export type LegalDocument = {
  slug: string;
  title: string;
  route: string;
  version: string;
  updatedAt: string;
  author: string;
  status: LegalDocumentStatus;
  relatedModules: string[];
  requiredBeforePayment: boolean;
};

export type MultimediaVideo = {
  id: string;
  scope: "public-home" | "member-dashboard";
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
  active: boolean;
  updatedAt: string;
};

export const LEGAL_DOCUMENTS_BASE: LegalDocument[] = [
  {
    slug: "terminos-condiciones",
    title: "Terminos y Condiciones",
    route: "/terms",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["checkout", "membresias", "soporte"],
    requiredBeforePayment: true,
  },
  {
    slug: "aviso-privacidad",
    title: "Aviso de Privacidad",
    route: "/privacy",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["registro", "perfil", "soporte"],
    requiredBeforePayment: true,
  },
  {
    slug: "politica-privacidad",
    title: "Politica de Privacidad",
    route: "/privacy",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["registro", "perfil", "admin"],
    requiredBeforePayment: false,
  },
  {
    slug: "politica-cookies",
    title: "Politica de Cookies",
    route: "/cookies",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["home", "registro", "legal"],
    requiredBeforePayment: false,
  },
  {
    slug: "politica-pagos",
    title: "Politica de Pagos",
    route: "/pagos-recurrentes",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["checkout", "billing", "admin-pagos"],
    requiredBeforePayment: true,
  },
  {
    slug: "politica-cancelaciones",
    title: "Politica de Cancelaciones",
    route: "/cancelacion",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["checkout", "billing", "membresias"],
    requiredBeforePayment: true,
  },
  {
    slug: "politica-reembolsos",
    title: "Politica de Reembolsos",
    route: "/reembolsos",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["checkout", "billing", "soporte"],
    requiredBeforePayment: true,
  },
  {
    slug: "politica-renovacion-automatica",
    title: "Politica de Renovacion Automatica",
    route: "/pagos-recurrentes",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["checkout", "billing", "membresias"],
    requiredBeforePayment: true,
  },
  {
    slug: "divulgacion-riesgos",
    title: "Divulgacion de Riesgos",
    route: "/risk-disclosure",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["alertas", "resultados", "trading"],
    requiredBeforePayment: true,
  },
  {
    slug: "reglas-comunidad",
    title: "Reglas de Comunidad",
    route: "/comunidad",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["comunidad", "moderacion", "soporte"],
    requiredBeforePayment: false,
  },
  {
    slug: "condiciones-uso",
    title: "Condiciones de Uso",
    route: "/legal",
    version: "3.0.0",
    updatedAt: "2026-07-12T00:00:00.000Z",
    author: "CARVIPIX Legal",
    status: "Activo",
    relatedModules: ["home", "checkout", "dashboard"],
    requiredBeforePayment: true,
  },
];

export const MULTIMEDIA_VIDEOS_BASE: MultimediaVideo[] = [
  {
    id: "video-home-corporate",
    scope: "public-home",
    title: "CARVIPIX: Plataforma Profesional",
    description:
      "Video profesional: que es CARVIPIX, como funcionan las alertas, beneficios, flujo general, riesgos del trading y proceso de contratacion.",
    videoUrl: "/training-videos/step-1-que-es-forex.mp4",
    posterUrl: "/logo/logo carvipix.png",
    active: true,
    updatedAt: "2026-07-12T00:00:00.000Z",
  },
  {
    id: "video-member-dashboard-guide",
    scope: "member-dashboard",
    title: "Guia del Panel del Miembro",
    description:
      "Video guiado: dashboard, alertas, resultados, membresias, soporte y herramientas operativas dentro de CARVIPIX.",
    videoUrl: "/training-videos/step-2-aplicaciones.mp4",
    posterUrl: "/logo/logo carvipix.png",
    active: true,
    updatedAt: "2026-07-12T00:00:00.000Z",
  },
];

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(".").map((item) => Number(item) || 0);
  const rightParts = right.split(".").map((item) => Number(item) || 0);
  const max = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < max; index += 1) {
    const l = leftParts[index] ?? 0;
    const r = rightParts[index] ?? 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }

  return 0;
}

export function latestActiveLegalDocuments(documents: LegalDocument[]): LegalDocument[] {
  const latest = new Map<string, LegalDocument>();

  documents.forEach((doc) => {
    if (doc.status !== "Activo") return;
    const previous = latest.get(doc.slug);
    if (!previous) {
      latest.set(doc.slug, doc);
      return;
    }

    const versionCompare = compareVersions(doc.version, previous.version);
    if (versionCompare > 0 || (versionCompare === 0 && new Date(doc.updatedAt).getTime() >= new Date(previous.updatedAt).getTime())) {
      latest.set(doc.slug, doc);
    }
  });

  return Array.from(latest.values()).sort((a, b) => a.title.localeCompare(b.title));
}

export function activeVideos(videos: MultimediaVideo[]): MultimediaVideo[] {
  return videos.filter((item) => item.active).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
