import type {
  IPaymentsDomainService,
  ServiceOrder,
  ServicePayment,
  ServicePaymentMethod,
  ServiceProduct,
} from "../contracts";
import { InMemoryServiceEventBus } from "../core/event-bus";

const DEMO_PRODUCTS: ServiceProduct[] = [
  {
    id: "bot-carvipix-license",
    name: "Bot CARVIPIX",
    description: "Licencia de por vida para Bot CARVIPIX",
    price: 999,
    currency: "USD",
    type: "bot",
    oneTime: true,
    features: ["Ejecucion automatica de reglas", "Control de riesgo", "MT4/MT5 compatible", "Actualizaciones futuras"],
  },
  {
    id: "capital-gestionado",
    name: "Gestion de Capital",
    description: "Gestion de capital desde 10,000 USD con participacion 40%",
    price: 10000,
    currency: "USD",
    type: "capital",
    oneTime: false,
    features: ["Capital objetivo 10K-1M USD", "Participacion 40% en ganancias", "Reportes mensuales", "Soporte dedicado"],
  },
  {
    id: "cuenta-fondeada",
    name: "Cuenta Fondeada",
    description: "Servicio de gestion de cuenta fondeada hacia 200K USD",
    price: 5000,
    currency: "USD",
    type: "fondeo",
    oneTime: true,
    features: ["Capital objetivo 200K USD", "FTMO / TopTier disponibles", "30-45 dias", "Credenciales al completar"],
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

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneProduct(product: ServiceProduct): ServiceProduct {
  return {
    ...product,
    features: product.features ? [...product.features] : undefined,
  };
}

function cloneOrder(order: ServiceOrder): ServiceOrder {
  return {
    ...order,
    fechaCreacion: new Date(order.fechaCreacion),
    fechaCompletado: order.fechaCompletado ? new Date(order.fechaCompletado) : undefined,
  };
}

export class PaymentsDomainService implements IPaymentsDomainService {
  private readonly orders: ServiceOrder[] = [];

  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getProducts(): Promise<ServiceProduct[]> {
    this.eventBus.publish("payments.products.read", {
      count: DEMO_PRODUCTS.length,
      queriedAt: new Date(),
    });

    return DEMO_PRODUCTS.map(cloneProduct);
  }

  async getProduct(productId: string): Promise<ServiceProduct | null> {
    const product = DEMO_PRODUCTS.find((item) => item.id === productId);

    this.eventBus.publish("payments.product.read", {
      productId,
      found: Boolean(product),
      queriedAt: new Date(),
    });

    return product ? cloneProduct(product) : null;
  }

  async createOrder(userId: string, productId: string): Promise<ServiceOrder> {
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const order: ServiceOrder = {
      id: createId("order"),
      userId,
      productId,
      quantity: 1,
      total: product.price,
      currency: product.currency,
      status: "pending",
      fechaCreacion: new Date(),
    };

    this.orders.unshift(order);

    this.eventBus.publish("payments.order.created", {
      orderId: order.id,
      userId,
      productId,
      queriedAt: new Date(),
    });

    return cloneOrder(order);
  }

  async processPayment(orderId: string, method: ServicePaymentMethod): Promise<ServicePayment> {
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("Orden no encontrada");
    }

    order.status = "completed";
    order.fechaCompletado = new Date();

    const payment: ServicePayment = {
      id: createId("pay"),
      userId: order.userId,
      productId: order.productId,
      amount: order.total,
      currency: order.currency,
      status: "completed",
      method,
      fecha: new Date(),
    };

    this.eventBus.publish("payments.processed", {
      orderId,
      paymentId: payment.id,
      method,
      queriedAt: new Date(),
    });

    return {
      ...payment,
      fecha: new Date(payment.fecha),
    };
  }

  async getOrderHistory(userId: string): Promise<ServiceOrder[]> {
    const orders = this.orders.filter((item) => item.userId === userId).map(cloneOrder);

    this.eventBus.publish("payments.orders.read", {
      userId,
      count: orders.length,
      queriedAt: new Date(),
    });

    return orders;
  }
}
