export type SubscriptionPlan = "free" | "basic" | "advanced";

export type CommercialFeature = "alertas" | "bot";

export type TradingWindow = {
  startHourUtc: number;
  endHourUtc: number;
};

export type PlanEntitlements = {
  plan: SubscriptionPlan;
  alertsEnabled: boolean;
  botEnabled: boolean;
  maxAlertsPerDay: number;
  maxPairs: number;
  maxBots: number;
  historyLimit: number;
  allowedPairs: string[] | null;
  tradingWindowsUtc: TradingWindow[];
};

export type GuardContext = {
  membershipActive: boolean;
  entitlements: PlanEntitlements;
};

export type LicenseContext = {
  active: boolean;
  expiryDate?: Date;
};

export class CommercialAccessError extends Error {
  constructor(
    public readonly code:
      | "FEATURE_NOT_AVAILABLE"
      | "MEMBERSHIP_INACTIVE"
      | "PLAN_NOT_ALLOWED"
      | "ALERT_LIMIT_EXCEEDED"
      | "BOT_LIMIT_EXCEEDED"
      | "PAIR_NOT_ALLOWED"
      | "PAIR_LIMIT_EXCEEDED"
      | "OUTSIDE_ALLOWED_HOURS"
      | "LICENSE_REQUIRED",
    message: string,
    public readonly status = 403
  ) {
    super(message);
    this.name = "CommercialAccessError";
  }
}

const DEFAULT_ALLOWED_PAIRS = {
  free: ["EURUSD"],
  basic: ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY"],
} as const;

const BASIC_WINDOWS: TradingWindow[] = [
  { startHourUtc: 7, endHourUtc: 16 },
  { startHourUtc: 18, endHourUtc: 21 },
];

export const DEFAULT_PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  free: {
    plan: "free",
    alertsEnabled: false,
    botEnabled: false,
    maxAlertsPerDay: 0,
    maxPairs: 1,
    maxBots: 0,
    historyLimit: 3,
    allowedPairs: [...DEFAULT_ALLOWED_PAIRS.free],
    tradingWindowsUtc: [],
  },
  basic: {
    plan: "basic",
    alertsEnabled: true,
    botEnabled: true,
    maxAlertsPerDay: 5,
    maxPairs: 4,
    maxBots: 1,
    historyLimit: 25,
    allowedPairs: [...DEFAULT_ALLOWED_PAIRS.basic],
    tradingWindowsUtc: [...BASIC_WINDOWS],
  },
  advanced: {
    plan: "advanced",
    alertsEnabled: true,
    botEnabled: true,
    maxAlertsPerDay: 25,
    maxPairs: 12,
    maxBots: 3,
    historyLimit: 180,
    allowedPairs: null,
    tradingWindowsUtc: [{ startHourUtc: 0, endHourUtc: 23 }],
  },
};

function normalizeValue(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function inWindow(hourUtc: number, window: TradingWindow): boolean {
  if (window.startHourUtc <= window.endHourUtc) {
    return hourUtc >= window.startHourUtc && hourUtc <= window.endHourUtc;
  }

  return hourUtc >= window.startHourUtc || hourUtc <= window.endHourUtc;
}

export function getPlanRank(plan: SubscriptionPlan): number {
  if (plan === "advanced") {
    return 2;
  }

  if (plan === "basic") {
    return 1;
  }

  return 0;
}

export function normalizeSubscriptionPlan(value: string | null | undefined): SubscriptionPlan {
  const normalized = normalizeValue(value);

  switch (normalized) {
    case "free":
    case "basic":
    case "demo":
      return normalized === "basic" ? "basic" : "free";
    case "advanced":
    case "premium":
    case "enterprise":
    case "elite":
      return "advanced";
    case "pro":
      return "basic";
    default:
      return "free";
  }
}

export function clonePlanEntitlements(entitlements: PlanEntitlements): PlanEntitlements {
  return {
    ...entitlements,
    allowedPairs: entitlements.allowedPairs ? [...entitlements.allowedPairs] : null,
    tradingWindowsUtc: entitlements.tradingWindowsUtc.map((window) => ({ ...window })),
  };
}

export function resolveDefaultPlanEntitlements(plan: SubscriptionPlan): PlanEntitlements {
  return clonePlanEntitlements(DEFAULT_PLAN_ENTITLEMENTS[plan]);
}

export class MembershipGuard {
  assertActive(context: GuardContext): void {
    if (!context.membershipActive) {
      throw new CommercialAccessError("MEMBERSHIP_INACTIVE", "La membresia activa es obligatoria para continuar.");
    }
  }
}

export class PlanAccessGuard {
  assertAtLeast(context: GuardContext, minimumPlan: SubscriptionPlan): void {
    if (getPlanRank(context.entitlements.plan) < getPlanRank(minimumPlan)) {
      throw new CommercialAccessError(
        "PLAN_NOT_ALLOWED",
        `Tu plan ${context.entitlements.plan.toUpperCase()} no cubre este flujo comercial.`
      );
    }
  }
}

export class FeatureAccessGuard {
  private readonly membershipGuard = new MembershipGuard();

  assertAccess(context: GuardContext, feature: CommercialFeature): void {
    this.membershipGuard.assertActive(context);

    const enabled = feature === "alertas" ? context.entitlements.alertsEnabled : context.entitlements.botEnabled;
    if (!enabled) {
      throw new CommercialAccessError("FEATURE_NOT_AVAILABLE", `El plan ${context.entitlements.plan.toUpperCase()} no incluye ${feature}.`);
    }
  }
}

export class AlertAccessGuard {
  constructor(private readonly featureAccessGuard = new FeatureAccessGuard()) {}

  assertWithinTradingWindow(context: GuardContext, now = new Date()): void {
    this.featureAccessGuard.assertAccess(context, "alertas");

    const windows = context.entitlements.tradingWindowsUtc;
    if (windows.length === 0) {
      throw new CommercialAccessError("OUTSIDE_ALLOWED_HOURS", "Tu plan no tiene ventanas horarias activas para alertas.");
    }

    const hourUtc = now.getUTCHours();
    if (!windows.some((window) => inWindow(hourUtc, window))) {
      throw new CommercialAccessError("OUTSIDE_ALLOWED_HOURS", "Fuera del horario permitido para tu plan.");
    }
  }
}

export class AlertLimitGuard {
  constructor(
    private readonly featureAccessGuard = new FeatureAccessGuard(),
    private readonly alertAccessGuard = new AlertAccessGuard()
  ) {}

  assertCanCreateAlert(context: GuardContext, alertsCreatedToday: number, now = new Date()): void {
    this.featureAccessGuard.assertAccess(context, "alertas");
    this.alertAccessGuard.assertWithinTradingWindow(context, now);

    if (alertsCreatedToday >= context.entitlements.maxAlertsPerDay) {
      throw new CommercialAccessError(
        "ALERT_LIMIT_EXCEEDED",
        `Se alcanzo el limite diario de alertas para el plan ${context.entitlements.plan.toUpperCase()}.`
      );
    }
  }
}

export class BotLimitGuard {
  constructor(private readonly featureAccessGuard = new FeatureAccessGuard()) {}

  assertCanCreateBot(context: GuardContext, activeBots: number): void {
    this.featureAccessGuard.assertAccess(context, "bot");

    if (activeBots >= context.entitlements.maxBots) {
      throw new CommercialAccessError(
        "BOT_LIMIT_EXCEEDED",
        `Se alcanzo el limite de bots para el plan ${context.entitlements.plan.toUpperCase()}.`
      );
    }
  }
}

export class BotAccessGuard {
  constructor(private readonly botLimitGuard = new BotLimitGuard()) {}

  assertCanProvisionBot(context: GuardContext, activeBots: number): void {
    this.botLimitGuard.assertCanCreateBot(context, activeBots);
  }
}

export class PairAccessGuard {
  constructor(private readonly featureAccessGuard = new FeatureAccessGuard()) {}

  assertPairAccess(
    context: GuardContext,
    input: {
      feature: CommercialFeature;
      pair: string;
      existingPairs: string[];
    }
  ): void {
    this.featureAccessGuard.assertAccess(context, input.feature);

    const pair = String(input.pair ?? "").trim().toUpperCase();
    const allowedPairs = context.entitlements.allowedPairs?.map((item) => item.toUpperCase()) ?? null;
    if (allowedPairs && !allowedPairs.includes(pair)) {
      throw new CommercialAccessError("PAIR_NOT_ALLOWED", `El plan ${context.entitlements.plan.toUpperCase()} no permite operar el par ${pair}.`);
    }

    const distinctPairs = new Set(input.existingPairs.map((item) => String(item ?? "").trim().toUpperCase()).filter(Boolean));
    distinctPairs.add(pair);

    if (distinctPairs.size > context.entitlements.maxPairs) {
      throw new CommercialAccessError(
        "PAIR_LIMIT_EXCEEDED",
        `Se alcanzo el limite de pares para el plan ${context.entitlements.plan.toUpperCase()}.`
      );
    }
  }
}

export class LicenseGuard {
  assertActive(license: LicenseContext | null | undefined): void {
    if (!license?.active) {
      throw new CommercialAccessError("LICENSE_REQUIRED", "Debes tener una licencia activa del Bot para continuar.");
    }

    if (license.expiryDate && license.expiryDate <= new Date()) {
      throw new CommercialAccessError("LICENSE_REQUIRED", "La licencia del Bot expiró y debe renovarse.");
    }
  }
}