// Datos demo para pagos

import { Product, Payment, Order } from "./types";
import { COMMERCIAL_PRODUCTS, resolveCommercialPaymentProductType } from "@/app/lib/commercial/business-model";

export const DEMO_PRODUCTS: Product[] = COMMERCIAL_PRODUCTS.filter((item) => item.id !== "plan-free" && item.id !== "academia").map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.priceUsd ?? 0,
  currency: "USD",
  type: resolveCommercialPaymentProductType(item),
  oneTime: item.billingType === "one_time",
  features: [...item.features],
}));

export function getDemoProducts(): Product[] {
  return DEMO_PRODUCTS.map(p => ({ ...p }));
}

export function getProductById(productId: string): Product | null {
  return DEMO_PRODUCTS.find(p => p.id === productId) || null;
}
