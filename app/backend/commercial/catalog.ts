import type { SubscriptionPlan } from "./access-control";
import { COMMERCIAL_PRODUCTS } from "@/app/lib/commercial/business-model";

export type CommercialProductCategory = "membership" | "bot" | "capital" | "support";

export type CommercialCatalogItem = {
  id: string;
  plan?: SubscriptionPlan;
  category: CommercialProductCategory;
  title: string;
  description: string;
  route: string;
};

export const OFFICIAL_PLAN_LABELS: Record<SubscriptionPlan, "FREE" | "BASIC" | "PRO"> = {
  free: "FREE",
  basic: "BASIC",
  advanced: "PRO",
};

function mapCategory(product: (typeof COMMERCIAL_PRODUCTS)[number]): CommercialProductCategory {
  if (product.planCode) {
    return "membership";
  }

  if (product.id === "bot-carvipix-license") {
    return "bot";
  }

  if (product.id === "capital-gestionado") {
    return "capital";
  }

  return "support";
}

function mapPlan(product: (typeof COMMERCIAL_PRODUCTS)[number]): SubscriptionPlan | undefined {
  if (product.planCode === "free") {
    return "free";
  }

  if (product.planCode === "basic") {
    return "basic";
  }

  if (product.planCode === "pro") {
    return "advanced";
  }

  return undefined;
}

function mapRoute(product: (typeof COMMERCIAL_PRODUCTS)[number]): string {
  if (product.id === "capital-gestionado") {
    return "/servicios/capital";
  }

  if (product.id === "cuenta-fondeada") {
    return "/servicios/fondeo";
  }

  if (product.id === "academia") {
    return "/servicios/academia";
  }

  return `/checkout?product=${product.checkoutId}`;
}

export const COMMERCIAL_CATALOG: CommercialCatalogItem[] = COMMERCIAL_PRODUCTS.map((product) => ({
  id: product.id,
  plan: mapPlan(product),
  category: mapCategory(product),
  title: product.name,
  description: product.description,
  route: mapRoute(product),
}));

export const COMMERCIAL_CATALOG_OFFICIAL = COMMERCIAL_PRODUCTS;

export function getCommercialCatalogItem(productId: string | null | undefined): CommercialCatalogItem | null {
  return COMMERCIAL_CATALOG.find((item) => item.id === productId) ?? null;
}