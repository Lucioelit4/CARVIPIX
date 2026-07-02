// Tipos para pagos

export type PaymentProduct = "bot" | "capital" | "fondeo" | "plan_pro" | "plan_premium" | "plan_enterprise";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod = "card" | "crypto" | "bank_transfer";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "USD" | "USDT" | "BTC";
  type: PaymentProduct;
  oneTime: boolean; // true para compras únicas, false para suscripciones
  features?: string[];
}

export interface Payment {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  fecha: Date;
  referenceId?: string; // ID de pasarela de pago externa
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  total: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentId?: string;
  fechaCreacion: Date;
  fechaCompletado?: Date;
}
