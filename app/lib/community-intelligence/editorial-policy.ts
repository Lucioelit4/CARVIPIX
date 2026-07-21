import { createHash } from "crypto";
import type {
  CommunityEditorialDecision,
  CommunityMarketDossier,
  CommunityPublicationType,
  CommunitySession,
} from "./types";

export interface CommunityEditorialHistoryEntry {
  analysis_id: string;
  asset: string;
  category: CommunityPublicationType;
  status: "APPROVED" | "PUBLISHED" | "BLOCKED" | "FAILED";
  content_hash: string;
  semantic_key: string;
  created_at: string;
}

export interface CommunityEditorialHistoryReader {
  recent(asset: string, since: Date): Promise<CommunityEditorialHistoryEntry[]>;
}

export const COMMUNITY_EDITORIAL_LIMITS = Object.freeze({
  normalDailyMaximum: 6,
  generalAnalysisDailyMaximum: 2,
  assetCooldownMinutes: 30,
  categoryCooldownMinutes: {
    SESSION_OPEN: 24 * 60,
    MARKET_STATUS: 90,
    NO_TRADE_WAIT: 120,
    MATERIAL_CHANGE: 0,
    GENERAL_ANALYSIS: 6 * 60,
    OFFICIAL_ALERT_CONTEXT: 0,
    ACTIVE_OPERATION: 120,
    OFFICIAL_RESULT: 0,
    DAILY_CLOSE: 24 * 60,
  } satisfies Record<CommunityPublicationType, number>,
});

export const OFFICIAL_ALERT_PRIORITY = 1;

export const COMMUNITY_EDITORIAL_PRIORITY: Record<CommunityPublicationType, number> = {
  OFFICIAL_ALERT_CONTEXT: 2,
  OFFICIAL_RESULT: 2,
  ACTIVE_OPERATION: 2,
  MATERIAL_CHANGE: 4,
  MARKET_STATUS: 5,
  SESSION_OPEN: 5,
  NO_TRADE_WAIT: 5,
  GENERAL_ANALYSIS: 6,
  DAILY_CLOSE: 7,
};

const NORMAL_CATEGORIES = new Set<CommunityPublicationType>([
  "SESSION_OPEN",
  "MARKET_STATUS",
  "NO_TRADE_WAIT",
  "MATERIAL_CHANGE",
  "GENERAL_ANALYSIS",
  "DAILY_CLOSE",
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 2));
}

export function semanticSimilarity(left: string, right: string): number {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (leftTokens.size === 0 && rightTokens.size === 0) return 1;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

export function resolveCommunitySession(asset: string, now: Date): CommunitySession {
  if (asset === "BTCUSD") return "BTC_24_7";
  const hour = now.getUTCHours();
  if (hour >= 7 && hour < 10) return "LONDON";
  if (hour >= 12 && hour < 16) return "NEW_YORK";
  if (hour >= 10 && hour < 12) return "TRANSITION";
  if (hour >= 20 && hour < 22) return "DAILY_CLOSE";
  return "OFF_SESSION";
}

function beginningOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function minutesSince(timestamp: string, now: Date): number {
  return (now.getTime() - new Date(timestamp).getTime()) / 60_000;
}

function classify(
  dossier: CommunityMarketDossier,
  session: CommunitySession,
  today: CommunityEditorialHistoryEntry[],
): CommunityPublicationType {
  if (dossier.editorial.category_hint) return dossier.editorial.category_hint;
  if (dossier.editorial.material_change || dossier.relevant_news.some((event) => event.impact === "HIGH")) {
    return "MATERIAL_CHANGE";
  }
  if (session === "DAILY_CLOSE" && !today.some((entry) => entry.category === "DAILY_CLOSE" && entry.status === "PUBLISHED")) {
    return "DAILY_CLOSE";
  }
  if (
    (session === "LONDON" || session === "NEW_YORK") &&
    !today.some((entry) => entry.category === "SESSION_OPEN" && entry.status === "PUBLISHED")
  ) {
    return "SESSION_OPEN";
  }
  if (String(dossier.market_state).includes("RANGE") || String(dossier.scenario_classification).includes("NO_EDGE")) {
    return "NO_TRADE_WAIT";
  }
  if (!today.some((entry) => entry.category === "GENERAL_ANALYSIS" && entry.status === "PUBLISHED")) {
    return "GENERAL_ANALYSIS";
  }
  return "MARKET_STATUS";
}

export class CommunityEditorialPolicy {
  constructor(private readonly history: CommunityEditorialHistoryReader) {}

  async evaluate(dossier: CommunityMarketDossier, now: Date): Promise<CommunityEditorialDecision> {
    const dayStart = beginningOfUtcDay(now);
    const recent = await this.history.recent(dossier.asset, new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const today = recent.filter((entry) => new Date(entry.created_at) >= dayStart);
    const session = resolveCommunitySession(dossier.asset, now);
    const category = classify(dossier, session, today);
    const cooldown = COMMUNITY_EDITORIAL_LIMITS.categoryCooldownMinutes[category];
    const semanticKey = normalize([
      dossier.market_state,
      dossier.risk_level,
      dossier.volatility,
      dossier.scenario_classification,
      dossier.context,
      ...dossier.reasons,
      ...dossier.scenarios,
    ].join(" "));
    const contentHash = hash(`${category}:${dossier.asset}:${semanticKey}`);
    const base = {
      category,
      priority: COMMUNITY_EDITORIAL_PRIORITY[category],
      session,
      content_hash: contentHash,
      semantic_key: semanticKey,
      cooldown_minutes: cooldown,
    };

    const published = recent.filter((entry) => entry.status === "PUBLISHED");
    if (published.some((entry) => entry.content_hash === contentHash)) {
      return { ...base, allowed: false, reason: "Identical editorial state already published", blocked_by: "DUPLICATE" };
    }

    const lastCategory = published.find((entry) => entry.category === category);
    if (lastCategory && semanticSimilarity(lastCategory.semantic_key, semanticKey) >= 0.82) {
      return { ...base, allowed: false, reason: "Semantically equivalent editorial state already published", blocked_by: "SEMANTIC_DUPLICATE" };
    }
    if (lastCategory && minutesSince(lastCategory.created_at, now) < cooldown) {
      return { ...base, allowed: false, reason: `Category cooldown active for ${cooldown} minutes`, blocked_by: "CATEGORY_COOLDOWN" };
    }

    const lastAsset = published[0];
    if (
      lastAsset &&
      NORMAL_CATEGORIES.has(category) &&
      minutesSince(lastAsset.created_at, now) < COMMUNITY_EDITORIAL_LIMITS.assetCooldownMinutes
    ) {
      return { ...base, allowed: false, reason: "Asset cooldown active", blocked_by: "ASSET_COOLDOWN" };
    }

    const todayPublished = today.filter((entry) => entry.status === "PUBLISHED");
    if (
      category === "GENERAL_ANALYSIS" &&
      todayPublished.filter((entry) => entry.category === "GENERAL_ANALYSIS").length >= COMMUNITY_EDITORIAL_LIMITS.generalAnalysisDailyMaximum
    ) {
      return { ...base, allowed: false, reason: "Daily general-analysis limit reached", blocked_by: "DAILY_LIMIT" };
    }
    if (
      NORMAL_CATEGORIES.has(category) &&
      todayPublished.filter((entry) => NORMAL_CATEGORIES.has(entry.category)).length >= COMMUNITY_EDITORIAL_LIMITS.normalDailyMaximum
    ) {
      return { ...base, allowed: false, reason: "Daily informational limit reached", blocked_by: "DAILY_LIMIT" };
    }

    return {
      ...base,
      allowed: true,
      reason: dossier.editorial.reason,
    };
  }
}
