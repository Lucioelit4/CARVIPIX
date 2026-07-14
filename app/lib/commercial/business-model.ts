export type CommercialPlanCode = "free" | "basic" | "pro";

export type CommercialProductStatus = "active" | "coming_soon";

export type CommercialBillingType = "subscription" | "one_time" | "profit_share" | "none";

export type CommercialRenewalType = "automatic" | "manual" | "none";

export type CommercialSubscriptionPlan = "free" | "basic" | "advanced";

export type TradingWindow = {
  startHourUtc: number;
  endHourUtc: number;
};

export type CommercialPlanEntitlements = {
  alertsEnabled: boolean;
  botEnabled: boolean;
  maxAlertsPerDay: number;
  maxPairs: number;
  maxBots: number;
  historyLimit: number;
  allowedPairs: string[] | null;
  tradingWindowsUtc: TradingWindow[];
};

export type CommercialProduct = {
  id: string;
  checkoutId: string;
  name: string;
  description: string;
  status: CommercialProductStatus;
  billingType: CommercialBillingType;
  renewalType: CommercialRenewalType;
  currency: "USD";
  priceUsd: number | null;
  planCode?: CommercialPlanCode;
  requiresActiveMembership: boolean;
  checkoutEnabled: boolean;
  permissionKeys: string[];
  features: string[];
};

export type CommercialPaymentProductType =
  | "bot"
  | "capital"
  | "fondeo"
  | "plan_pro"
  | "plan_premium"
  | "plan_enterprise";

export const COMMERCIAL_PLAN_ENTITLEMENTS: Record<CommercialSubscriptionPlan, CommercialPlanEntitlements> = {
  free: {
    alertsEnabled: false,
    botEnabled: false,
    maxAlertsPerDay: 0,
    maxPairs: 1,
    maxBots: 0,
    historyLimit: 3,
    allowedPairs: ["EURUSD"],
    tradingWindowsUtc: [],
  },
  basic: {
    alertsEnabled: true,
    botEnabled: true,
    maxAlertsPerDay: 5,
    maxPairs: 2,
    maxBots: 1,
    historyLimit: 25,
    allowedPairs: ["XAUUSD", "BTCUSD"],
    tradingWindowsUtc: [
      { startHourUtc: 7, endHourUtc: 16 },
      { startHourUtc: 18, endHourUtc: 21 },
    ],
  },
  advanced: {
    alertsEnabled: true,
    botEnabled: true,
    maxAlertsPerDay: 14,
    maxPairs: 50,
    maxBots: 3,
    historyLimit: 180,
    allowedPairs: null,
    tradingWindowsUtc: [{ startHourUtc: 0, endHourUtc: 23 }],
  },
};

const PRO_PRICE_CANDIDATES = [150, 99.5] as const;

const PRO_SELECTED_PRICE = 99.5;

export const PRO_PRICE_DECISION = {
  selectedPriceUsd: PRO_SELECTED_PRICE,
  candidatesUsd: [...PRO_PRICE_CANDIDATES],
  requiresDirectorApproval: true,
} as const;

export const COMMERCIAL_PRODUCTS: CommercialProduct[] = [
  {
    id: "plan-free",
    checkoutId: "plan-free",
    name: "Plan FREE",
    description: "Acceso basico para conocer la plataforma sin funciones premium.",
    status: "active",
    billingType: "none",
    renewalType: "none",
    currency: "USD",
    priceUsd: 0,
    planCode: "free",
    requiresActiveMembership: false,
    checkoutEnabled: true,
    permissionKeys: ["dashboard.basic"],
    features: ["Funciones basicas", "Captacion de clientes", "Sin servicios premium"],
  },
  {
    id: "plan-basic",
    checkoutId: "plan-basic-monthly",
    name: "Plan BASIC",
    description: "Suscripcion mensual con alertas en XAUUSD y BTCUSD, dashboard e historial.",
    status: "active",
    billingType: "subscription",
    renewalType: "automatic",
    currency: "USD",
    priceUsd: 19.99,
    planCode: "basic",
    requiresActiveMembership: false,
    checkoutEnabled: true,
    permissionKeys: ["alertas.basic", "dashboard.client", "estadisticas.basic"],
    features: [
      "Hasta 5 alertas por dia cuando existan oportunidades reales",
      "XAUUSD y BTCUSD",
      "Dashboard del cliente",
      "Historial de alertas",
      "Resultados",
      "Notificaciones",
      "Estadisticas basicas",
    ],
  },
  {
    id: "plan-advanced",
    checkoutId: "plan-pro-monthly",
    name: "Plan PRO",
    description: "Incluye todo BASIC y habilita herramientas premium, analisis completos y estadisticas avanzadas.",
    status: "active",
    billingType: "subscription",
    renewalType: "automatic",
    currency: "USD",
    priceUsd: PRO_SELECTED_PRICE,
    planCode: "pro",
    requiresActiveMembership: false,
    checkoutEnabled: true,
    permissionKeys: ["alertas.pro", "herramientas.premium", "analisis.completo", "estadisticas.avanzadas"],
    features: [
      "Incluye todo BASIC",
      "Mas activos",
      "Mas alertas",
      "Herramientas premium",
      "Analisis completos",
      "Videos",
      "Reportes",
      "Estadisticas avanzadas",
    ],
  },
  {
    id: "bot-carvipix-license",
    checkoutId: "bot-carvipix-999",
    name: "Bot CARVIPIX",
    description: "Licencia unica para Bot CARVIPIX descargable (EA). Incluye guia de instalacion y activacion asistida.",
    status: "active",
    billingType: "one_time",
    renewalType: "none",
    currency: "USD",
    priceUsd: 999,
    requiresActiveMembership: true,
    checkoutEnabled: true,
    permissionKeys: ["bot.license", "bot.runtime"],
    features: [
      "Pago unico",
      "Licencia oficial de uso",
      "Entrega por correo: instrucciones, manual y recursos",
      "Descarga del paquete EA",
      "Instalacion guiada para MT4/MT5",
      "Soporte de activacion",
    ],
  },
  {
    id: "capital-gestionado",
    checkoutId: "capital-gestionado",
    name: "Gestion de Capital",
    description: "Servicio por porcentaje sobre utilidades con flujo interno de solicitud y aprobacion.",
    status: "active",
    billingType: "profit_share",
    renewalType: "manual",
    currency: "USD",
    priceUsd: null,
    requiresActiveMembership: false,
    checkoutEnabled: true,
    permissionKeys: ["capital.request", "capital.panel", "capital.tracking"],
    features: ["Solicitud", "Evaluacion", "Aprobacion", "Panel", "Seguimiento", "Estado", "Administracion"],
  },
  {
    id: "cuenta-fondeada",
    checkoutId: "cuenta-fondeada",
    name: "Programa de Fondeo",
    description: "Infraestructura preparada. Proximamente sin venta activa.",
    status: "coming_soon",
    billingType: "none",
    renewalType: "none",
    currency: "USD",
    priceUsd: null,
    requiresActiveMembership: false,
    checkoutEnabled: true,
    permissionKeys: [],
    features: ["Proximamente", "Sin venta", "Sin permisos activos"],
  },
  {
    id: "academia",
    checkoutId: "academia",
    name: "Academia",
    description: "Infraestructura de academia marcada como proximamente.",
    status: "coming_soon",
    billingType: "none",
    renewalType: "none",
    currency: "USD",
    priceUsd: null,
    requiresActiveMembership: false,
    checkoutEnabled: true,
    permissionKeys: [],
    features: ["Proximamente", "Sin contenido comercial", "Sin permisos activos"],
  },
];

export const CHECKOUT_PRODUCT_ALIASES: Record<string, string> = {
  "plan-free": "plan-free",
  free: "plan-free",
  membership: "plan-basic-monthly",
  "plan-basic": "plan-basic-monthly",
  "plan-basic-monthly": "plan-basic-monthly",
  "plan-advanced": "plan-pro-monthly",
  "plan-pro-monthly": "plan-pro-monthly",
  bot: "bot-carvipix-999",
  "bot-carvipix-license": "bot-carvipix-999",
  "bot-carvipix-999": "bot-carvipix-999",
  "capital-gestionado": "capital-gestionado",
  "cuenta-fondeada": "cuenta-fondeada",
  academia: "academia",
};

export function findCommercialProductById(productId: string | null | undefined): CommercialProduct | null {
  const normalized = String(productId ?? "").trim();
  if (!normalized) {
    return null;
  }

  return COMMERCIAL_PRODUCTS.find((item) => item.id === normalized || item.checkoutId === normalized) ?? null;
}

export function getCommercialProductById(productId: string): CommercialProduct | null {
  return COMMERCIAL_PRODUCTS.find((item) => item.id === productId) ?? null;
}

export function getCommercialProductByCheckoutId(checkoutId: string): CommercialProduct | null {
  return COMMERCIAL_PRODUCTS.find((item) => item.checkoutId === checkoutId) ?? null;
}

export function resolveCheckoutProductId(productId: string | null | undefined): string {
  const normalized = String(productId ?? "").trim();
  if (!normalized) {
    return "plan-basic-monthly";
  }

  return CHECKOUT_PRODUCT_ALIASES[normalized] ?? normalized;
}

export function resolveCommercialSubscriptionPlanFromCheckoutId(
  productId: string | null | undefined
): CommercialSubscriptionPlan | null {
  const checkoutId = resolveCheckoutProductId(productId);
  const product = getCommercialProductByCheckoutId(checkoutId);
  if (!product?.planCode) {
    return null;
  }

  if (product.planCode === "free") {
    return "free";
  }

  if (product.planCode === "basic") {
    return "basic";
  }

  return "advanced";
}

export function resolveCommercialSubscriptionPlanFromProductType(
  productType: string | null | undefined
): CommercialSubscriptionPlan | null {
  const normalized = String(productType ?? "").trim().toLowerCase();
  if (normalized === "plan_pro") {
    return "basic";
  }
  if (normalized === "plan_premium") {
    return "advanced";
  }
  return null;
}

export function resolveCommercialPaymentProductType(product: CommercialProduct): CommercialPaymentProductType {
  if (product.planCode === "basic") {
    return "plan_pro";
  }

  if (product.planCode === "pro") {
    return "plan_premium";
  }

  if (product.id === "bot-carvipix-license") {
    return "bot";
  }

  if (product.id === "capital-gestionado") {
    return "capital";
  }

  if (product.id === "cuenta-fondeada") {
    return "fondeo";
  }

  return "plan_enterprise";
}

export function isBotLicenseCheckoutProduct(productId: string | null | undefined): boolean {
  const checkoutId = resolveCheckoutProductId(productId);
  const product = getCommercialProductByCheckoutId(checkoutId);
  return product?.id === "bot-carvipix-license";
}

export function buildPayPalOfferings() {
  return COMMERCIAL_PRODUCTS.filter(
    (item) => item.checkoutEnabled && item.status === "active" && item.priceUsd !== null && (item.billingType === "subscription" || item.billingType === "one_time")
  ).map((item) => ({
    id: item.checkoutId,
    name: item.name,
    description: item.description,
    type: item.billingType === "subscription" ? "subscription" : "one_time",
    amount: item.priceUsd as number,
    currency: item.currency,
  }));
}
