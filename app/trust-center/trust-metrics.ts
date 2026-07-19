import { TRUST_CENTER_START_YEAR, TRUST_EVIDENCE_ITEMS, TRUST_TIMELINE } from "./trust-registry";

export type TrustScoreCard = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  href: string;
};

export type TrustMetricsSnapshot = {
  scoreCards: TrustScoreCard[];
  trustScore: number;
  verifiedItems: number;
  pendingItems: number;
  totalEvidenceItems: number;
  timelineSpanYears: number;
  timelineEvents: number;
  generatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function buildTrustMetricsSnapshot(): TrustMetricsSnapshot {
  const scoreCards: TrustScoreCard[] = [
    {
      id: "empresa-identidad",
      label: "Empresa e identidad",
      ok: TRUST_EVIDENCE_ITEMS.some((item) => item.id === "empresa-verificada" && item.status === "verified"),
      detail: "Base legal y corporativa disponible para consulta publica.",
      href: "/trust-center/empresa",
    },
    {
      id: "dominio-y-cifrado",
      label: "Dominio y cifrado",
      ok:
        TRUST_EVIDENCE_ITEMS.some((item) => item.id === "dominio-protegido" && item.status === "verified") &&
        TRUST_EVIDENCE_ITEMS.some((item) => item.id === "conexion-cifrada" && item.status === "verified"),
      detail: "Rutas canonicas y operacion web sobre HTTPS.",
      href: "/trust-center/seguridad",
    },
    {
      id: "cumplimiento-publico",
      label: "Cumplimiento publico",
      ok: TRUST_EVIDENCE_ITEMS.some((item) => item.id === "politicas-publicas" && item.status === "verified"),
      detail: "Politicas, terminos y divulgaciones publicadas.",
      href: "/trust-center/cumplimiento",
    },
    {
      id: "estado-operativo",
      label: "Estado operativo",
      ok: TRUST_EVIDENCE_ITEMS.some((item) => item.id === "plataforma-operativa" && item.status === "verified"),
      detail: "Monitoreo y estado de plataforma accesibles de forma publica.",
      href: "/trust-center/estado",
    },
    {
      id: "catalogo-activo",
      label: "Catalogo activo",
      ok: TRUST_EVIDENCE_ITEMS.some((item) => item.id === "servicios-activos" && item.status === "verified"),
      detail: "Servicios activos diferenciados de borradores o proximamente.",
      href: "/servicios",
    },
    {
      id: "marca-documentada",
      label: "Marca registrada",
      ok: TRUST_EVIDENCE_ITEMS.some((item) => item.id === "marca-registrada" && item.status === "verified"),
      detail: "Marca registrada - evidencia pendiente de publicacion.",
      href: "/trust-center/respaldos",
    },
  ];

  const verifiedItems = TRUST_EVIDENCE_ITEMS.filter((item) => item.status === "verified").length;
  const pendingItems = TRUST_EVIDENCE_ITEMS.filter((item) => item.status === "pending").length;
  const trustScore = Math.round((verifiedItems / TRUST_EVIDENCE_ITEMS.length) * 100);

  return {
    scoreCards,
    trustScore,
    verifiedItems,
    pendingItems,
    totalEvidenceItems: TRUST_EVIDENCE_ITEMS.length,
    timelineSpanYears: new Date().getFullYear() - TRUST_CENTER_START_YEAR,
    timelineEvents: TRUST_TIMELINE.length,
    generatedAt: nowIso(),
  };
}
