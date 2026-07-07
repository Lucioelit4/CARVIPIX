import type {
  IPaymentsDomainService,
  ServiceOrder,
  ServicePayment,
  ServicePaymentMethod,
  ServiceProduct,
} from "../contracts";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";
import { createPaymentGateway } from "../payments/gateway";
import type { PaymentGateway } from "../payments/types";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: ServiceProduct["currency"];
  type: ServiceProduct["type"];
  one_time: boolean;
  features: unknown;
};

type OrderRow = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total: number;
  currency: string;
  status: ServiceOrder["status"];
  payment_id: string | null;
  fecha_creacion: Date;
  fecha_completado: Date | null;
  product_type?: ServiceProduct["type"];
};

function toProduct(row: ProductRow): ServiceProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    type: row.type,
    oneTime: row.one_time,
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
  };
}

function toOrder(row: OrderRow): ServiceOrder {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    total: Number(row.total),
    currency: row.currency,
    status: row.status,
    paymentId: row.payment_id ?? undefined,
    fechaCreacion: new Date(row.fecha_creacion),
    fechaCompletado: row.fecha_completado ? new Date(row.fecha_completado) : undefined,
  };
}

export class PaymentsDomainService implements IPaymentsDomainService {
  private readonly paymentGateway: PaymentGateway;

  constructor(private readonly eventBus: InMemoryServiceEventBus, paymentGateway?: PaymentGateway) {
    this.paymentGateway = paymentGateway ?? createPaymentGateway();
  }

  async getProducts(): Promise<ServiceProduct[]> {
    const { rows } = await backendDatabase.query<ProductRow>(
      `SELECT id, name, description, price, currency, type, one_time, features FROM products ORDER BY name ASC`
    );

    const products = rows.map(toProduct);

    this.eventBus.publish("payments.products.read", {
      count: products.length,
      queriedAt: new Date(),
    });

    return products;
  }

  async getProduct(productId: string): Promise<ServiceProduct | null> {
    const { rows } = await backendDatabase.query<ProductRow>(
      `SELECT id, name, description, price, currency, type, one_time, features FROM products WHERE id = $1 LIMIT 1`,
      [productId]
    );
    const product = rows[0] ? toProduct(rows[0]) : null;

    this.eventBus.publish("payments.product.read", {
      productId,
      found: Boolean(product),
      queriedAt: new Date(),
    });

    return product;
  }

  async createOrder(userId: string, productId: string): Promise<ServiceOrder> {
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const orderId = createId("order");
    const now = new Date();

    await backendDatabase.query(
      `
      INSERT INTO orders (id, user_id, product_id, quantity, total, currency, status, fecha_creacion)
      VALUES ($1, $2, $3, 1, $4, $5, 'pending', $6)
      `,
      [orderId, userId, productId, product.price, product.currency, now]
    );

    const order: ServiceOrder = {
      id: orderId,
      userId,
      productId,
      quantity: 1,
      total: product.price,
      currency: product.currency,
      status: "pending",
      fechaCreacion: now,
    };

    this.eventBus.publish("payments.order.created", {
      orderId: order.id,
      userId,
      productId,
      queriedAt: new Date(),
    });

    return order;
  }

  async processPayment(orderId: string, method: ServicePaymentMethod): Promise<ServicePayment> {
    const { rows: orderRows } = await backendDatabase.query<{
      id: string;
      user_id: string;
      product_id: string;
      total: number;
      currency: string;
    }>(
      `
      SELECT id, user_id, product_id, total, currency
      FROM orders
      WHERE id = $1
      LIMIT 1
      `,
      [orderId]
    );

    const orderForAuthorization = orderRows[0];
    if (!orderForAuthorization) {
      throw new Error("Orden no encontrada");
    }

    const authorization = await this.paymentGateway.authorizePayment({
      orderId,
      userId: orderForAuthorization.user_id,
      productId: orderForAuthorization.product_id,
      amount: Number(orderForAuthorization.total),
      currency: orderForAuthorization.currency,
      method,
    });

    if (authorization.status !== "approved") {
      throw new Error("Pago rechazado por el proveedor externo");
    }

    const payment = await backendDatabase.withTransaction<ServicePayment>(async (client) => {
      const orderResult = await client.query<OrderRow>(
        `
        SELECT
          o.id,
          o.user_id,
          o.product_id,
          o.quantity,
          o.total,
          o.currency,
          o.status,
          o.payment_id,
          o.fecha_creacion,
          o.fecha_completado,
          p.type AS product_type
        FROM orders o
        INNER JOIN products p ON p.id = o.product_id
        WHERE o.id = $1
        LIMIT 1
        `,
        [orderId]
      );

      const orderRow = orderResult.rows[0];
      if (!orderRow) {
        throw new Error("Orden no encontrada");
      }

      const paymentId = createId("pay");
      const now = new Date();

      await client.query(
        `
        INSERT INTO payments (id, user_id, product_id, amount, currency, status, method, fecha)
        VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7)
        `,
        [paymentId, orderRow.user_id, orderRow.product_id, orderRow.total, orderRow.currency, method, now]
      );

      if (authorization.externalReferenceId) {
        await client.query(
          `
          UPDATE payments
          SET reference_id = $2
          WHERE id = $1
          `,
          [paymentId, authorization.externalReferenceId]
        );
      }

      await client.query(
        `
        UPDATE orders
        SET status = 'completed', payment_id = $2, fecha_completado = $3
        WHERE id = $1
        `,
        [orderId, paymentId, now]
      );

      const productType = orderRow.product_type;
      const reportMonth = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      const operationId = createId("op");

      await client.query(
        `
        INSERT INTO operations (id, user_id, account_id, symbol, side, status, pnl, executed_at, metadata)
        VALUES ($1, $2, NULL, $3, 'buy', 'completed', 0, $4, $5::jsonb)
        `,
        [
          operationId,
          orderRow.user_id,
          String(productType ?? "payment").toUpperCase(),
          now,
          JSON.stringify({
            module: "payments",
            orderId,
            paymentId,
            method,
            productType,
            reportMonth,
          }),
        ]
      );

      const paidPlan =
        productType === "plan_pro"
          ? "pro"
          : productType === "plan_premium"
            ? "premium"
            : productType === "plan_enterprise"
              ? "enterprise"
              : null;

      if (paidPlan) {
        await client.query(
          `
          INSERT INTO memberships (user_id, plan, estado, fecha_inicio, renovacion_automatica)
          VALUES ($1, $2, 'activo', NOW(), true)
          ON CONFLICT (user_id) DO UPDATE
          SET plan = EXCLUDED.plan,
              estado = 'activo',
              fecha_inicio = EXCLUDED.fecha_inicio,
              renovacion_automatica = EXCLUDED.renovacion_automatica
          `,
          [orderRow.user_id, paidPlan]
        );

        await client.query(
          `
          UPDATE users
          SET plan = $2, estado = 'activo'
          WHERE id = $1
          `,
          [orderRow.user_id, paidPlan]
        );
      }

      if (productType === "capital") {
        const accountId = createId("capital");
        const movementId = createId("mov");

        await client.query(
          `
          INSERT INTO capital_accounts (
            account_id,
            user_id,
            initial_capital,
            current_balance,
            utilidad,
            participacion_cliente,
            participacion_carvipix,
            status,
            fecha_inicio,
            monthly_return,
            annual_return
          )
          SELECT $1, $2, $3, $3, 0, 0, 0, 'pending', $4, 0, 0
          WHERE NOT EXISTS (
            SELECT 1
            FROM capital_accounts
            WHERE user_id = $2
              AND status IN ('pending', 'active')
          )
          `,
          [accountId, orderRow.user_id, Number(orderRow.total), now]
        );

        await client.query(
          `
          INSERT INTO capital_movements (id, account_id, type, amount, fecha, description, balance_after)
          SELECT $1, $2, 'deposit', $3, $4, 'Capital inicial desde orden pagada', $3
          WHERE EXISTS (
            SELECT 1
            FROM capital_accounts
            WHERE account_id = $2
          )
          `,
          [movementId, accountId, Number(orderRow.total), now]
        );

        await client.query(
          `
          INSERT INTO monthly_reports (
            account_id,
            mes,
            capital_inicial,
            capital_final,
            utilidad,
            participacion_cliente,
            participacion_carvipix,
            rendimiento
          )
          SELECT $1, $2, $3, $3, 0, 0, 0, 0
          WHERE EXISTS (
            SELECT 1
            FROM capital_accounts
            WHERE account_id = $1
          )
          ON CONFLICT (account_id, mes) DO NOTHING
          `,
          [accountId, reportMonth, Number(orderRow.total)]
        );
      }

      return {
        id: paymentId,
        userId: orderRow.user_id,
        productId: orderRow.product_id,
        amount: Number(orderRow.total),
        currency: orderRow.currency,
        status: "completed",
        method,
        fecha: now,
      };
    });

    this.eventBus.publish("payments.processed", {
      orderId,
      paymentId: payment.id,
      method,
      gatewayProvider: this.paymentGateway.provider,
      gatewayStatus: authorization.status,
      queriedAt: new Date(),
    });

    return payment;
  }

  async getOrderHistory(userId: string): Promise<ServiceOrder[]> {
    const { rows } = await backendDatabase.query<OrderRow>(
      `
      SELECT id, user_id, product_id, quantity, total, currency, status, payment_id, fecha_creacion, fecha_completado
      FROM orders
      WHERE user_id = $1
      ORDER BY fecha_creacion DESC
      `,
      [userId]
    );
    const orders = rows.map(toOrder);

    this.eventBus.publish("payments.orders.read", {
      userId,
      count: orders.length,
      queriedAt: new Date(),
    });

    return orders;
  }
}
