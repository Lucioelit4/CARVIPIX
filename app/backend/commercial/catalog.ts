import type { SubscriptionPlan } from "./access-control";

export type CommercialProductCategory = "membership" | "bot" | "capital" | "support";

export type CommercialCatalogItem = {
  id: string;
  plan?: SubscriptionPlan;
  category: CommercialProductCategory;
  title: string;
  description: string;
  route: string;
};

export const OFFICIAL_PLAN_LABELS: Record<SubscriptionPlan, "FREE" | "BASIC" | "ADVANCED"> = {
  free: "FREE",
  basic: "BASIC",
  advanced: "ADVANCED",
};

export const COMMERCIAL_CATALOG: CommercialCatalogItem[] = [
  {
    id: "plan-basic",
    plan: "basic",
    category: "membership",
    title: "Plan BASIC",
    description: "Alertas manuales, pares limitados, historial limitado y bot limitado.",
    route: "/checkout?product=plan-basic",
  },
  {
    id: "plan-advanced",
    plan: "advanced",
    category: "membership",
    title: "Plan ADVANCED",
    description: "Mas pares, mas alertas, mas historial y bot completo.",
    route: "/checkout?product=plan-advanced",
  },
  {
    id: "bot-carvipix-license",
    category: "bot",
    title: "Licencia Bot CARVIPIX",
    description: "Licencia comercial con activacion, diagnostico y conexion preparada.",
    route: "/checkout?product=bot-carvipix-license",
  },
  {
    id: "capital-gestionado",
    category: "capital",
    title: "Gestion de Capital",
    description: "Servicio separado de solicitud, contrato, seguimiento y reportes.",
    route: "/checkout?product=capital-gestionado",
  },
];

export function getCommercialCatalogItem(productId: string | null | undefined): CommercialCatalogItem | null {
  return COMMERCIAL_CATALOG.find((item) => item.id === productId) ?? null;
}