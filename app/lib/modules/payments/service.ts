// Servicio de pagos (preparado para pasarelas reales)

import { Product, Payment, Order, PaymentProduct } from "./types";
import { getDemoProducts, getProductById } from "./demo-data";

export class PaymentsService {
  private isDemoMode = true;
  private demoOrders: Order[] = [];

  // Obtener productos disponibles
  async getProducts(): Promise<Product[]> {
    if (this.isDemoMode) {
      return getDemoProducts();
    }
    // FUTURE: Conectar a API real
    throw new Error("API de pagos no conectada todavía");
  }

  // Obtener producto específico
  async getProduct(productId: string): Promise<Product | null> {
    if (this.isDemoMode) {
      return getProductById(productId);
    }
    // FUTURE: Conectar a API real
    throw new Error("API de pagos no conectada todavía");
  }

  // Crear orden de compra
  async createOrder(userId: string, productId: string): Promise<Order> {
    const product = await this.getProduct(productId);
    if (!product) throw new Error("Producto no encontrado");

    const order: Order = {
      id: `order-${Date.now()}`,
      userId,
      productId,
      quantity: 1,
      total: product.price,
      currency: product.currency,
      status: "pending",
      fechaCreacion: new Date(),
    };

    if (this.isDemoMode) {
      this.demoOrders.push(order);
    }
    // FUTURE: Guardar en base de datos

    return order;
  }

  // Procesar pago (simula éxito en demo)
  async processPayment(orderId: string, method: string): Promise<Payment> {
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      userId: "current-user",
      productId: "product-id",
      amount: 0,
      currency: "USD",
      status: this.isDemoMode ? "completed" : "pending",
      method: method as any,
      fecha: new Date(),
    };

    // FUTURE: Integrar Stripe, MercadoPago, crypto, etc.

    return payment;
  }

  // Obtener historial de órdenes
  async getOrderHistory(userId: string): Promise<Order[]> {
    if (this.isDemoMode) {
      return this.demoOrders.filter(o => o.userId === userId);
    }
    // FUTURE: Conectar a API real
    throw new Error("API no conectada todavía");
  }

  setDemoMode(isDemoMode: boolean) {
    this.isDemoMode = isDemoMode;
  }
}

export const paymentsService = new PaymentsService();
