// Servicio de pagos delegado al Backend Enterprise

import { Product, Payment, Order, PaymentProduct } from "./types";
import { ecosystemServices } from "@/app/backend";

export class PaymentsService {
  // Obtener productos disponibles
  async getProducts(): Promise<Product[]> {
    return ecosystemServices.payments.getProducts();
  }

  // Obtener producto específico
  async getProduct(productId: string): Promise<Product | null> {
    return ecosystemServices.payments.getProduct(productId);
  }

  // Crear orden de compra
  async createOrder(userId: string, productId: string): Promise<Order> {
    return ecosystemServices.payments.createOrder(userId, productId);
  }

  // Procesar pago (simula éxito en demo)
  async processPayment(orderId: string, method: string): Promise<Payment> {
    const normalizedMethod = (method as Payment["method"]) ?? "card";
    return ecosystemServices.payments.processPayment(orderId, normalizedMethod);
  }

  // Obtener historial de órdenes
  async getOrderHistory(userId: string): Promise<Order[]> {
    return ecosystemServices.payments.getOrderHistory(userId);
  }

  setDemoMode(_isDemoMode: boolean) {
    // No-op: la fuente de datos oficial es Backend Enterprise.
  }
}

export const paymentsService = new PaymentsService();
