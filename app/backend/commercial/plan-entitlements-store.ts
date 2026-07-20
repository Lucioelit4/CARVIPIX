import fs from "fs/promises";
import path from "path";
import {
  type PlanEntitlements,
  type SubscriptionPlan,
  clonePlanEntitlements,
  normalizeSubscriptionPlan,
  resolveDefaultPlanEntitlements,
} from "./access-control";

type PlanEntitlementsRow = {
  plan: string;
  alerts_enabled: boolean;
  bot_enabled: boolean;
  max_alerts_per_day: number;
  max_pairs: number;
  max_bots: number;
  history_limit: number;
  allowed_pairs: unknown;
  trading_windows_utc: unknown;
};

type LocalEntitlementsStore = Partial<
  Record<SubscriptionPlan, Partial<Omit<PlanEntitlements, "plan">>>
>;

export type ResolvedUserCommercialAccess = {
  userId: string;
  subscriptionPlan: SubscriptionPlan;
  membershipActive: boolean;
  entitlements: PlanEntitlements;
};

const STORE_PATH = process.env.PLAN_ENTITLEMENTS_STORE_PATH
  ? path.resolve(process.env.PLAN_ENTITLEMENTS_STORE_PATH)
  : path.join(process.cwd(), "data", "plan-entitlements.json");

function hasDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function normalizePairList(value: unknown): string[] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const pairs = Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim().toUpperCase())
        .filter(Boolean)
    )
  );

  return pairs;
}

function normalizeTradingWindows(value: unknown): PlanEntitlements["tradingWindowsUtc"] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((item) => {
      const source = item as { startHourUtc?: unknown; endHourUtc?: unknown };
      const startHourUtc = clampInteger(source.startHourUtc, -1);
      const endHourUtc = clampInteger(source.endHourUtc, -1);
      if (startHourUtc < 0 || endHourUtc < 0) {
        return null;
      }

      return { startHourUtc: Math.min(startHourUtc, 23), endHourUtc: Math.min(endHourUtc, 23) };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function clampInteger(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(0, Math.min(100000, Math.floor(numeric)));
}

function mergePlanEntitlements(
  plan: SubscriptionPlan,
  patch?: Partial<Omit<PlanEntitlements, "plan">>
): PlanEntitlements {
  const base = resolveDefaultPlanEntitlements(plan);
  const allowedPairs = normalizePairList(patch?.allowedPairs);

  return {
    plan,
    alertsEnabled: typeof patch?.alertsEnabled === "boolean" ? patch.alertsEnabled : base.alertsEnabled,
    botEnabled: typeof patch?.botEnabled === "boolean" ? patch.botEnabled : base.botEnabled,
    maxAlertsPerDay: clampInteger(patch?.maxAlertsPerDay, base.maxAlertsPerDay),
    maxPairs: clampInteger(patch?.maxPairs, base.maxPairs),
    maxBots: clampInteger(patch?.maxBots, base.maxBots),
    historyLimit: clampInteger(patch?.historyLimit, base.historyLimit),
    allowedPairs: allowedPairs === undefined ? base.allowedPairs : allowedPairs,
    tradingWindowsUtc: normalizeTradingWindows(patch?.tradingWindowsUtc) ?? base.tradingWindowsUtc,
  };
}

async function ensureLocalStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readLocalStore(): Promise<LocalEntitlementsStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return (JSON.parse(raw) as LocalEntitlementsStore) ?? {};
  } catch {
    return {};
  }
}

async function writeLocalStore(store: LocalEntitlementsStore): Promise<void> {
  await ensureLocalStoreDir();
  const tempPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

function mapRowToEntitlements(row: PlanEntitlementsRow): PlanEntitlements {
  return mergePlanEntitlements(normalizeSubscriptionPlan(row.plan), {
    alertsEnabled: row.alerts_enabled,
    botEnabled: row.bot_enabled,
    maxAlertsPerDay: Number(row.max_alerts_per_day ?? 0),
    maxPairs: Number(row.max_pairs ?? 0),
    maxBots: Number(row.max_bots ?? 0),
    historyLimit: Number(row.history_limit ?? 0),
    allowedPairs: normalizePairList(row.allowed_pairs),
    tradingWindowsUtc: normalizeTradingWindows(row.trading_windows_utc),
  });
}

export async function getPlanEntitlements(plan: SubscriptionPlan): Promise<PlanEntitlements> {
  const normalizedPlan = normalizeSubscriptionPlan(plan);

  if (!hasDatabaseConfigured()) {
    const store = await readLocalStore();
    return mergePlanEntitlements(normalizedPlan, store[normalizedPlan]);
  }

  const { backendDatabase } = await import("../core/database");

  const { rows } = await backendDatabase.query<PlanEntitlementsRow>(
    `
    SELECT plan, alerts_enabled, bot_enabled, max_alerts_per_day, max_pairs, max_bots, allowed_pairs
          , history_limit, trading_windows_utc
    FROM plan_entitlements
    WHERE plan = $1
    LIMIT 1
    `,
    [normalizedPlan]
  );

  return rows[0] ? mapRowToEntitlements(rows[0]) : resolveDefaultPlanEntitlements(normalizedPlan);
}

export async function listPlanEntitlements(): Promise<PlanEntitlements[]> {
  const plans: SubscriptionPlan[] = ["free", "basic", "advanced"];

  if (!hasDatabaseConfigured()) {
    const store = await readLocalStore();
    return plans.map((plan) => mergePlanEntitlements(plan, store[plan]));
  }

  const { backendDatabase } = await import("../core/database");

  const { rows } = await backendDatabase.query<PlanEntitlementsRow>(
    `
    SELECT plan, alerts_enabled, bot_enabled, max_alerts_per_day, max_pairs, max_bots, allowed_pairs
          , history_limit, trading_windows_utc
    FROM plan_entitlements
    `
  );

  const map = new Map(rows.map((row) => [normalizeSubscriptionPlan(row.plan), mapRowToEntitlements(row)] as const));
  return plans.map((plan) => clonePlanEntitlements(map.get(plan) ?? resolveDefaultPlanEntitlements(plan)));
}

export async function updatePlanEntitlements(
  plan: SubscriptionPlan,
  patch: Partial<Omit<PlanEntitlements, "plan">>
): Promise<PlanEntitlements> {
  const normalizedPlan = normalizeSubscriptionPlan(plan);
  const next = mergePlanEntitlements(normalizedPlan, patch);

  if (!hasDatabaseConfigured()) {
    const store = await readLocalStore();
    store[normalizedPlan] = {
      alertsEnabled: next.alertsEnabled,
      botEnabled: next.botEnabled,
      maxAlertsPerDay: next.maxAlertsPerDay,
      maxPairs: next.maxPairs,
      maxBots: next.maxBots,
      historyLimit: next.historyLimit,
      allowedPairs: next.allowedPairs,
      tradingWindowsUtc: next.tradingWindowsUtc,
    };
    await writeLocalStore(store);
    return next;
  }

  const { backendDatabase } = await import("../core/database");

  await backendDatabase.query(
    `
    INSERT INTO plan_entitlements (
      plan,
      alerts_enabled,
      bot_enabled,
      max_alerts_per_day,
      max_pairs,
      max_bots,
      history_limit,
      allowed_pairs,
      trading_windows_utc
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
    ON CONFLICT (plan)
    DO UPDATE SET
      alerts_enabled = EXCLUDED.alerts_enabled,
      bot_enabled = EXCLUDED.bot_enabled,
      max_alerts_per_day = EXCLUDED.max_alerts_per_day,
      max_pairs = EXCLUDED.max_pairs,
      max_bots = EXCLUDED.max_bots,
      history_limit = EXCLUDED.history_limit,
      allowed_pairs = EXCLUDED.allowed_pairs,
      trading_windows_utc = EXCLUDED.trading_windows_utc
    `,
    [
      normalizedPlan,
      next.alertsEnabled,
      next.botEnabled,
      next.maxAlertsPerDay,
      next.maxPairs,
      next.maxBots,
      next.historyLimit,
      JSON.stringify(next.allowedPairs),
      JSON.stringify(next.tradingWindowsUtc),
    ]
  );

  return next;
}

export async function resolveUserCommercialAccess(userId: string): Promise<ResolvedUserCommercialAccess> {
  if (userId === "admin-session") {
    const subscriptionPlan: SubscriptionPlan = "advanced";
    return {
      userId,
      subscriptionPlan,
      membershipActive: true,
      entitlements: await getPlanEntitlements(subscriptionPlan),
    };
  }

  if (!hasDatabaseConfigured()) {
    const { findMembershipByUserId, listUsers } = await import("../core/local-auth-store");
    const users = await listUsers();
    const user = users.find((item) => item.id === userId) ?? null;
    const membership = user ? await findMembershipByUserId(userId) : null;
    const subscriptionPlan = normalizeSubscriptionPlan(membership?.plan ?? user?.plan ?? "free");
    const membershipActive = Boolean(
      membership &&
        membership.estado === "activo" &&
        (!membership.fechaFin || new Date(membership.fechaFin) > new Date())
    );

    return {
      userId,
      subscriptionPlan,
      membershipActive,
      entitlements: await getPlanEntitlements(subscriptionPlan),
    };
  }

  const { backendDatabase } = await import("../core/database");

  const { rows } = await backendDatabase.query<{
    plan: string | null;
    membership_state: string | null;
    fecha_fin: Date | null;
  }>(
    `
    SELECT COALESCE(m.plan, u.plan, 'demo') AS plan, m.estado AS membership_state, m.fecha_fin
    FROM users u
    LEFT JOIN memberships m ON m.user_id = u.id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  const row = rows[0];
  const subscriptionPlan = normalizeSubscriptionPlan(row?.plan ?? "free");
  const membershipActive = Boolean(
    row && row.membership_state === "activo" && (!row.fecha_fin || row.fecha_fin > new Date())
  );

  return {
    userId,
    subscriptionPlan,
    membershipActive,
    entitlements: await getPlanEntitlements(subscriptionPlan),
  };
}