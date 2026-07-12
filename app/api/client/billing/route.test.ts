import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest, NextResponse } from "next/server";

import { createBillingHandlers } from "./handlers";

type MockRow = Record<string, unknown>;

type DbQueryCall = {
  sql: string;
  params: unknown[];
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function createMockAuth(userId = "user-auth-1") {
  return async () =>
    ({
      ok: true as const,
      user: {
        id: userId,
        email: "user@example.com",
        nombre: "User",
        apellido: "Test",
        plan: "pro",
        estado: "activo",
        verificado: true,
        password_hash: null,
      },
    });
}

function createUnauthorizedAuth() {
  return async () => ({
    ok: false as const,
    response: jsonResponse(401, { error: "Unauthorized" }),
  });
}

function createMockDb(handlers: Array<(sql: string, params: unknown[]) => MockRow[] | null>, opts?: { throwOnQuery?: boolean }) {
  const calls: DbQueryCall[] = [];

  return {
    enabled: true,
    calls,
    query: async <T extends MockRow>(sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });

      if (opts?.throwOnQuery) {
        throw new Error("db failure");
      }

      for (const resolver of handlers) {
        const rows = resolver(sql, params);
        if (rows !== null) {
          return { rows: rows as T[] };
        }
      }

      return { rows: [] as T[] };
    },
  };
}

function createBaseDbForSnapshot(overrides?: {
  membershipState?: string | null;
  expiryOffsetDays?: number | null;
  autoRenew?: boolean;
  subscriptionStatus?: string | null;
  paymentHistoryRows?: MockRow[];
  paypalRows?: MockRow[];
}) {
  const now = Date.now();
  const expiry =
    overrides?.expiryOffsetDays === null
      ? null
      : new Date(now + (overrides?.expiryOffsetDays ?? 15) * 24 * 60 * 60 * 1000);

  return createMockDb([
    (sql) => {
      if (sql.includes("FROM users u") && sql.includes("LEFT JOIN memberships")) {
        return [
          {
            user_plan: "pro",
            membership_plan: "pro",
            membership_state: overrides?.membershipState ?? "activo",
            fecha_inicio: new Date(now - 10 * 24 * 60 * 60 * 1000),
            fecha_fin: expiry,
            renovacion_automatica: overrides?.autoRenew ?? true,
            payment_subscription_id: "sub_001",
            subscription_status: overrides?.subscriptionStatus ?? "ACTIVE",
            next_billing_date: new Date(now + 10 * 24 * 60 * 60 * 1000),
            subscription_updated_at: new Date(now),
          },
        ];
      }
      return null;
    },
    (sql) => {
      if (sql.includes("FROM payment_orders po")) {
        return (
          overrides?.paymentHistoryRows ?? [
            {
              order_id: "ord_001",
              product_id: "plan-pro-monthly",
              concept: "Plan Pro",
              amount_total: 150,
              currency: "USD",
              order_status: "paid",
              requested_method: "wallet",
              provider_payment_id: "txn_001",
              transaction_status: "captured",
              created_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
              paid_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
            },
          ]
        );
      }
      return null;
    },
    (sql) => {
      if (sql.includes("FROM paypal_billing_records")) {
        return (
          overrides?.paypalRows ?? [
            {
              paypal_order_id: "PP-ORD-1",
              paypal_subscription_id: null,
              product_id: "plan-pro-monthly",
              amount: 150,
              currency: "USD",
              status: "active",
              created_at: new Date(now - 3 * 24 * 60 * 60 * 1000),
              updated_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
            },
          ]
        );
      }
      return null;
    },
    (sql) => {
      if (sql.includes("FROM billing_profiles")) {
        return [
          {
            id: "bp_001",
            legal_name: "CARVIPIX CLIENTE SA",
            tax_id: "ABC0102031A1",
            fiscal_email: "fiscal@example.com",
            address_line1: "Av Demo 123",
            city: "CDMX",
            state: "CDMX",
            postal_code: "01234",
            country_code: "MX",
            updated_at: new Date(now),
          },
        ];
      }
      return null;
    },
    (sql) => {
      if (sql.includes("FROM payment_method_references")) {
        return [
          {
            provider: "custom",
            payment_type: "wallet",
            brand: "PayPal",
            last4: null,
            status: "active",
            updated_at: new Date(now),
            alias: "Principal",
          },
        ];
      }
      return null;
    },
  ]);
}

function createNoMembershipDb() {
  return createMockDb([
    (sql) => {
      if (sql.includes("FROM users u") && sql.includes("LEFT JOIN memberships")) {
        return [
          {
            user_plan: "free",
            membership_plan: null,
            membership_state: null,
            fecha_inicio: null,
            fecha_fin: null,
            renovacion_automatica: false,
            payment_subscription_id: null,
            subscription_status: null,
            next_billing_date: null,
            subscription_updated_at: null,
          },
        ];
      }
      return null;
    },
    (sql) => {
      if (sql.includes("FROM payment_orders po")) return [];
      if (sql.includes("FROM paypal_billing_records")) return [];
      if (sql.includes("FROM billing_profiles")) return [];
      if (sql.includes("FROM payment_method_references")) return [];
      return null;
    },
  ]);
}

function createRequest(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init);
}

async function parseJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function extractMembershipState(payload: Record<string, unknown>): string {
  const data = payload.data as Record<string, unknown>;
  const membership = data.membership as Record<string, unknown>;
  return String(membership.state ?? "");
}

function extractPaymentHistory(payload: Record<string, unknown>): unknown[] {
  const data = payload.data as Record<string, unknown>;
  return (data.paymentHistory as unknown[]) ?? [];
}

test("GET billing rejects unauthenticated user", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createUnauthorizedAuth(),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  assert.equal(response.status, 401);
});

test("GET billing returns pending state when user has no membership", async () => {
  const db = createNoMembershipDb();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-no-membership"),
    resolveAccess: async () => ({
      subscriptionPlan: "free",
      membershipActive: false,
      entitlements: { maxAlertsPerDay: 0, maxPairs: 0, maxBots: 0, historyLimit: 0 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  assert.equal(response.status, 200);
  const payload = await parseJson(response);
  const data = payload.data as Record<string, unknown>;
  const membership = data.membership as Record<string, unknown>;
  assert.equal(membership.state, "PENDIENTE");
});

test("GET billing returns active membership state", async () => {
  const db = createBaseDbForSnapshot({ membershipState: "activo", expiryOffsetDays: 20, subscriptionStatus: "ACTIVE" });
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-active"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 3, historyLimit: 50 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  assert.equal(response.status, 200);
  const payload = await parseJson(response);
  assert.equal(extractMembershipState(payload), "ACTIVO");
});

test("GET billing returns suspended membership state", async () => {
  const db = createBaseDbForSnapshot({ membershipState: "activo", expiryOffsetDays: 12, subscriptionStatus: "SUSPENDED" });
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-suspended"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  const payload = await parseJson(response);
  assert.equal(extractMembershipState(payload), "SUSPENDIDO");
});

test("GET billing returns cancelled membership state", async () => {
  const db = createBaseDbForSnapshot({ membershipState: "cancelado", expiryOffsetDays: 10, subscriptionStatus: "CANCELLED" });
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-cancelled"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  const payload = await parseJson(response);
  assert.equal(extractMembershipState(payload), "CANCELADO");
});

test("GET billing returns expired membership state", async () => {
  const db = createBaseDbForSnapshot({ membershipState: "activo", expiryOffsetDays: -2, subscriptionStatus: "ACTIVE" });
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-expired"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: false,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  const payload = await parseJson(response);
  assert.equal(extractMembershipState(payload), "EXPIRADO");
});

test("GET billing handles empty payment history", async () => {
  const db = createBaseDbForSnapshot({ paymentHistoryRows: [], paypalRows: [] });
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-empty-history"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  const payload = await parseJson(response);
  const paymentHistory = extractPaymentHistory(payload);
  assert.equal(Array.isArray(paymentHistory), true);
  assert.equal(paymentHistory.length, 0);
});

test("GET billing returns multiple payment records", async () => {
  const now = Date.now();
  const db = createBaseDbForSnapshot({
    paymentHistoryRows: [
      {
        order_id: "ord_001",
        product_id: "plan-basic-monthly",
        concept: "Plan Basic",
        amount_total: 19.99,
        currency: "USD",
        order_status: "paid",
        requested_method: "wallet",
        provider_payment_id: "txn_001",
        transaction_status: "captured",
        created_at: new Date(now - 5 * 24 * 60 * 60 * 1000),
        paid_at: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      {
        order_id: "ord_002",
        product_id: "plan-pro-monthly",
        concept: "Plan Pro",
        amount_total: 150,
        currency: "USD",
        order_status: "pending_provider",
        requested_method: "wallet",
        provider_payment_id: "txn_002",
        transaction_status: "initiated",
        created_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
        paid_at: null,
      },
    ],
    paypalRows: [],
  });

  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-multi-history"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  const payload = await parseJson(response);
  const paymentHistory = extractPaymentHistory(payload);
  assert.equal(paymentHistory.length, 2);
});

test("POST updateBillingProfile updates fiscal data", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-fiscal"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "updateBillingProfile",
        payload: {
          legalName: "NUEVA RAZON SA DE CV",
          taxId: "ABC0102031A1",
          fiscalAddress: "Av Reforma 1",
          fiscalEmail: "nuevo.fiscal@example.com",
        },
      }),
    })
  );

  assert.equal(response.status, 200);
  assert.equal(db.calls.some((call) => call.sql.includes("UPDATE billing_profiles") || call.sql.includes("INSERT INTO billing_profiles")), true);
});

test("POST updateBillingProfile rejects invalid RFC", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-invalid-rfc"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "updateBillingProfile",
        payload: {
          legalName: "Cliente Demo",
          taxId: "RFC_INVALIDO",
          fiscalAddress: "Calle 1",
          fiscalEmail: "fiscal@example.com",
        },
      }),
    })
  );

  assert.equal(response.status, 400);
});

test("POST updateBillingProfile rejects invalid fiscal email", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-invalid-email"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "updateBillingProfile",
        payload: {
          legalName: "Cliente Demo",
          taxId: "ABC0102031A1",
          fiscalAddress: "Calle 1",
          fiscalEmail: "correo-invalido",
        },
      }),
    })
  );

  assert.equal(response.status, 400);
});

test("POST toggleAutoRenew supports cancellation and reactivation", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-renew"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const cancelResponse = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "toggleAutoRenew", payload: { enabled: false } }),
    })
  );
  assert.equal(cancelResponse.status, 200);

  const reactivateResponse = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "toggleAutoRenew", payload: { enabled: true } }),
    })
  );
  assert.equal(reactivateResponse.status, 200);

  const renewUpdates = db.calls.filter((call) => call.sql.includes("UPDATE memberships") && call.sql.includes("renovacion_automatica"));
  assert.equal(renewUpdates.length >= 2, true);
});

test("POST ignores attempted cross-user modification by always using authenticated user", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-owner"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "updateBillingProfile",
        payload: {
          userId: "another-user",
          legalName: "Intento malicioso",
          taxId: "ABC0102031A1",
          fiscalAddress: "Address",
          fiscalEmail: "fiscal@example.com",
        },
      }),
    })
  );

  assert.equal(response.status, 200);
  const userBoundQuery = db.calls.find((call) => call.sql.includes("SELECT id FROM billing_profiles"));
  assert.equal(Array.isArray(userBoundQuery?.params), true);
  assert.equal(userBoundQuery?.params[0], "user-owner");
});

test("POST toggleAutoRenew ignores payload userId and updates only authenticated user membership", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-membership-owner"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "toggleAutoRenew",
        payload: {
          userId: "another-user",
          enabled: false,
        },
      }),
    })
  );

  assert.equal(response.status, 200);
  const membershipUpdate = db.calls.find((call) => call.sql.includes("UPDATE memberships") && call.sql.includes("renovacion_automatica"));
  assert.equal(membershipUpdate?.params[0], "user-membership-owner");
});

test("GET returns 500 when database query fails", async () => {
  const db = createMockDb([], { throwOnQuery: true });
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-db-error"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/billing"));
  assert.equal(response.status, 500);
});

test("POST setPaymentMethod does not persist fake method changes", async () => {
  const db = createBaseDbForSnapshot();
  const handlers = createBillingHandlers({
    requireAuth: createMockAuth("user-payment-method"),
    resolveAccess: async () => ({
      subscriptionPlan: "advanced",
      membershipActive: true,
      entitlements: { maxAlertsPerDay: 50, maxPairs: 10, maxBots: 2, historyLimit: 30 },
    }) as never,
    db: db as never,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "setPaymentMethod",
        payload: {
          provider: "custom",
          paymentType: "wallet",
          alias: "Nuevo metodo",
        },
      }),
    })
  );

  assert.equal(response.status, 409);
  const persisted = db.calls.some((call) => call.sql.includes("payment_method_references") && (call.sql.includes("INSERT") || call.sql.includes("UPDATE")));
  assert.equal(persisted, false);
});
