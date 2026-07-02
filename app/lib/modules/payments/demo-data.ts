// Datos demo para pagos

import { Product, Payment, Order } from "./types";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "bot-carvipix-license",
    name: "Bot CARVIPIX",
    description: "Licencia de por vida para Bot CARVIPIX",
    price: 999,
    currency: "USD",
    type: "bot",
    oneTime: true,
    features: ["Ejecución automática de reglas", "Control de riesgo", "MT4/MT5 compatible", "Actualizaciones futuras"],
  },
  {
    id: "capital-gestionado",
    name: "Gestión de Capital",
    description: "Gestión de capital desde 10,000 USD con participación 40%",
    price: 10000,
    currency: "USD",
    type: "capital",
    oneTime: false,
    features: ["Capital objetivo 10K-1M USD", "Participación 40% en ganancias", "Reportes mensuales", "Soporte dedicado"],
  },
  {
    id: "cuenta-fondeada",
    name: "Cuenta Fondeada",
    description: "Servicio de gestión de cuenta fondeada hacia 200K USD",
    price: 5000,
    currency: "USD",
    type: "fondeo",
    oneTime: true,
    features: ["Capital objetivo 200K USD", "FTMO / TopTier disponibles", "30-45 días", "Credenciales al completar"],
  },
  {
    id: "plan-pro",
    name: "Plan Pro",
    description: "Plan mensual con acceso a alertas y bot",
    price: 49,
    currency: "USD",
    type: "plan_pro",
    oneTime: false,
    features: ["50 alertas", "1 bot", "Reportes"],
  },
  {
    id: "plan-premium",
    name: "Plan Premium",
    description: "Plan mensual con acceso completo",
    price: 199,
    currency: "USD",
    type: "plan_premium",
    oneTime: false,
    features: ["Alertas ilimitadas", "3 bots", "Capital gestionado", "IA Briefing"],
  },
];

export function getDemoProducts(): Product[] {
  return DEMO_PRODUCTS.map(p => ({ ...p }));
}

export function getProductById(productId: string): Product | null {
  return DEMO_PRODUCTS.find(p => p.id === productId) || null;
}
