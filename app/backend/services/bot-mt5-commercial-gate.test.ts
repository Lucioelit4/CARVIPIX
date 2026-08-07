import assert from "node:assert/strict";
import test from "node:test";

import { backendDatabase } from "@/app/backend/core/database";
import { BotMT5Service } from "./bot-mt5-service";

type QueryCall = {
  sql: string;
  params: unknown[];
};

type QueryResponder = (sql: string, params: unknown[]) => { rows: unknown[] };

function withMockDatabase(responder: QueryResponder): { calls: QueryCall[]; restore: () => void } {
  const calls: QueryCall[] = [];
  const originalQuery = (backendDatabase as { query: unknown }).query;
  const hadOwnEnabled = Object.prototype.hasOwnProperty.call(backendDatabase, "enabled");
  const ownEnabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");

  Object.defineProperty(backendDatabase, "enabled", {
    configurable: true,
    get: () => true,
  });

  (backendDatabase as { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }> }).query = async (
    sql: string,
    params: unknown[] = []
  ) => {
    calls.push({ sql, params });
    return responder(sql, params);
  };

  return {
    calls,
    restore: () => {
      (backendDatabase as { query: unknown }).query = originalQuery;
      if (hadOwnEnabled && ownEnabledDescriptor) {
        Object.defineProperty(backendDatabase, "enabled", ownEnabledDescriptor);
      } else {
        delete (backendDatabase as { enabled?: boolean }).enabled;
      }
    },
  };
}

function buildService(input: {
  membershipActive: boolean;
  subscriptionPlan: "free" | "basic" | "advanced";
  allowedPairs: string[] | null;
  consumedToday: number;
  alreadyCountedSignal: boolean;
  licenseUserId?: string;
}) {
  const userId = input.licenseUserId ?? "user-1";
  const db = withMockDatabase((sql) => {
    if (sql.includes("FROM bot_mt5_licenses") && sql.includes("WHERE license_id = $1")) {
      return {
        rows: [
          {
            user_id: userId,
            status: "ACTIVE",
            expires_at: new Date(Date.now() + 60_000),
          },
        ],
      };
    }

    if (sql.includes("COUNT(DISTINCT s.signal_id)::int AS consumed_today")) {
      return {
        rows: [
          {
            consumed_today: input.consumedToday,
            already_counted_signal: input.alreadyCountedSignal,
          },
        ],
      };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  });

  const service = new BotMT5Service(async () => ({
    userId,
    membershipActive: input.membershipActive,
    subscriptionPlan: input.subscriptionPlan,
    entitlements: {
      plan: input.subscriptionPlan,
      alertsEnabled: true,
      botEnabled: true,
      maxAlertsPerDay: input.subscriptionPlan === "advanced" ? 20 : 5,
      maxPairs: input.subscriptionPlan === "advanced" ? 50 : 2,
      maxBots: input.subscriptionPlan === "advanced" ? 3 : 1,
      historyLimit: 25,
      allowedPairs: input.allowedPairs,
      tradingWindowsUtc: [{ startHourUtc: 0, endHourUtc: 23 }],
    },
  }));

  return { service, db };
}

test("BASIC 0/7 -> ALLOW", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "basic",
    allowedPairs: ["XAUUSD", "BTCUSD"],
    consumedToday: 0,
    alreadyCountedSignal: false,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-BASIC-1",
      signalId: "SIG-001",
      symbol: "XAUUSD",
      decision: "BUY",
    });

    assert.equal(result.allowed, true);
    assert.equal(result.dailyLimit, 7);
    assert.equal(result.consumedToday, 0);
  } finally {
    db.restore();
  }
});

test("BASIC 6/7 -> ALLOW", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "basic",
    allowedPairs: ["XAUUSD", "BTCUSD"],
    consumedToday: 6,
    alreadyCountedSignal: false,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-BASIC-2",
      signalId: "SIG-002",
      symbol: "BTCUSD",
      decision: "SELL",
    });

    assert.equal(result.allowed, true);
    assert.equal(result.dailyLimit, 7);
    assert.equal(result.consumedToday, 6);
  } finally {
    db.restore();
  }
});

test("BASIC 7/7 -> BLOCK", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "basic",
    allowedPairs: ["XAUUSD", "BTCUSD"],
    consumedToday: 7,
    alreadyCountedSignal: false,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-BASIC-3",
      signalId: "SIG-003",
      symbol: "XAUUSD",
      decision: "BUY",
    });

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "PLAN_DAILY_LIMIT_REACHED");
    assert.equal(result.dailyLimit, 7);
    assert.equal(result.consumedToday, 7);
  } finally {
    db.restore();
  }
});

test("PRO 24/25 -> ALLOW", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "advanced",
    allowedPairs: null,
    consumedToday: 24,
    alreadyCountedSignal: false,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-PRO-1",
      signalId: "SIG-004",
      symbol: "EURUSD",
      decision: "BUY",
    });

    assert.equal(result.allowed, true);
    assert.equal(result.dailyLimit, 25);
    assert.equal(result.consumedToday, 24);
  } finally {
    db.restore();
  }
});

test("PRO 25/25 -> BLOCK", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "advanced",
    allowedPairs: null,
    consumedToday: 25,
    alreadyCountedSignal: false,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-PRO-2",
      signalId: "SIG-005",
      symbol: "GBPUSD",
      decision: "SELL",
    });

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "PLAN_DAILY_LIMIT_REACHED");
    assert.equal(result.dailyLimit, 25);
    assert.equal(result.consumedToday, 25);
  } finally {
    db.restore();
  }
});

test("membership inactive + active license -> BLOCK", async () => {
  const { service, db } = buildService({
    membershipActive: false,
    subscriptionPlan: "basic",
    allowedPairs: ["XAUUSD", "BTCUSD"],
    consumedToday: 0,
    alreadyCountedSignal: false,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-BASIC-4",
      signalId: "SIG-006",
      symbol: "XAUUSD",
      decision: "BUY",
    });

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "MEMBERSHIP_INACTIVE");
  } finally {
    db.restore();
  }
});

test("membership expired + active license -> BLOCK", async () => {
  const { service, db } = buildService({
    membershipActive: false,
    subscriptionPlan: "advanced",
    allowedPairs: null,
    consumedToday: 0,
    alreadyCountedSignal: false,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-PRO-EXPIRED",
      signalId: "SIG-006B",
      symbol: "EURUSD",
      decision: "SELL",
    });

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "MEMBERSHIP_INACTIVE");
  } finally {
    db.restore();
  }
});

test("same signal_id repeated does not consume twice", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "basic",
    allowedPairs: ["XAUUSD", "BTCUSD"],
    consumedToday: 7,
    alreadyCountedSignal: true,
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-BASIC-5",
      signalId: "SIG-007",
      symbol: "XAUUSD",
      decision: "BUY",
    });

    assert.equal(result.allowed, true);
    assert.equal(result.alreadyCountedSignal, true);
  } finally {
    db.restore();
  }
});

test("two installations of same client share user-level quota query", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "basic",
    allowedPairs: ["XAUUSD", "BTCUSD"],
    consumedToday: 6,
    alreadyCountedSignal: false,
    licenseUserId: "shared-user-1",
  });

  try {
    const result = await service.evaluateCommercialGate({
      licenseId: "LIC-SHARED-1",
      signalId: "SIG-008",
      symbol: "BTCUSD",
      decision: "SELL",
    });

    assert.equal(result.allowed, true);
    const usageQuery = db.calls.find((call) => call.sql.includes("COUNT(DISTINCT s.signal_id)::int AS consumed_today"));
    assert.ok(usageQuery);
    assert.equal(usageQuery?.params[0], "shared-user-1");
    assert.equal(usageQuery?.sql.includes("installation_id"), false);
  } finally {
    db.restore();
  }
});

test("WAIT/NO_TRADE do not consume quota", async () => {
  const { service, db } = buildService({
    membershipActive: true,
    subscriptionPlan: "basic",
    allowedPairs: ["XAUUSD", "BTCUSD"],
    consumedToday: 7,
    alreadyCountedSignal: false,
  });

  try {
    const waitResult = await service.evaluateCommercialGate({
      licenseId: "LIC-BASIC-6",
      signalId: "SIG-009",
      symbol: "XAUUSD",
      decision: "WAIT",
    });
    const noTradeResult = await service.evaluateCommercialGate({
      licenseId: "LIC-BASIC-6",
      signalId: "SIG-010",
      symbol: "XAUUSD",
      decision: "NO_TRADE",
    });

    assert.equal(waitResult.allowed, true);
    assert.equal(waitResult.reason, "NON_OPERABLE_DECISION");
    assert.equal(noTradeResult.allowed, true);
    assert.equal(noTradeResult.reason, "NON_OPERABLE_DECISION");

    const usageQueryCount = db.calls.filter((call) => call.sql.includes("COUNT(DISTINCT s.signal_id)::int AS consumed_today")).length;
    assert.equal(usageQueryCount, 0);
  } finally {
    db.restore();
  }
});
