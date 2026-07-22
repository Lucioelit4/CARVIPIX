import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { CadpDecisionV3, PayloadAlertaPremium, PayloadTelegram } from "./typesMaestroV3";

type ChannelKind = "alerts" | "notes";
type CommunicationCategory = "OFFICIAL_ALERT" | "GLOBAL_SUMMARY";
const MAX_CONTEXT_MESSAGES_PER_DAY = 3;
const MAX_FREE_OFFICIAL_ALERTS_PER_DAY = 2;

interface CommunicationEventMemory {
  symbol: string;
  decision: CadpDecisionV3;
  category: CommunicationCategory;
  fingerprint: string;
  summary_hash: string;
  sent_at_ms: number;
  channel: ChannelKind;
}

interface CommunicationDayMemory {
  date: string;
  events: CommunicationEventMemory[];
}

export interface CommunityContextSnapshot {
  dailyPnlUsd: number;
  winCount: number;
  lossCount: number;
  closedTrades: number;
}

export interface CommunicationPlan {
  shouldSend: boolean;
  channel: ChannelKind;
  category: CommunicationCategory;
  reason: string;
  message?: string;
  fingerprint: string;
  summaryHash: string;
  symbol: string;
  decision: CadpDecisionV3;
}

type CommunityTone = "CALM" | "MEASURED_POSITIVE" | "PATIENT" | "NEUTRAL";

function getMemoryDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashText(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function pickVariant(seed: string, options: string[]): string {
  const digest = crypto.createHash("md5").update(seed).digest();
  const idx = digest[0] % options.length;
  return options[idx];
}

function compactReason(payload: PayloadTelegram): string {
  const source = payload.public_warning || payload.public_summary || "Mercado sin ventaja estadística clara.";
  return truncate(source.replace(/\s+/g, " ").trim(), 90);
}

function buildReviewLine(payload: PayloadTelegram): string {
  if (payload.recheck_minutes && payload.recheck_minutes > 0) {
    return `Próxima revisión: ${payload.recheck_minutes} min.`;
  }

  return "Seguimiento interno activo.";
}

class CommunicationMemoryStore {
  private readonly primaryDir = path.join(process.cwd(), "data", "communication-engine");
  private readonly fallbackDir = path.join(os.tmpdir(), "carvipix", "communication-engine");
  private activeDir: string | null = null;
  private diskUnavailable = false;
  private warnedFallback = false;
  private cache: CommunicationDayMemory = { date: getMemoryDate(), events: [] };

  private resolveFilePath(): string | null {
    if (this.diskUnavailable) {
      return null;
    }

    if (!this.activeDir && !this.tryActivate(this.primaryDir) && !this.tryActivate(this.fallbackDir)) {
      this.diskUnavailable = true;
      if (!this.warnedFallback) {
        this.warnedFallback = true;
        console.warn("[CommunicationEngine] Disk storage unavailable. Using in-memory day memory.");
      }
      return null;
    }

    return this.activeDir ? path.join(this.activeDir, "day-memory.json") : null;
  }

  private tryActivate(dir: string): boolean {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const probe = path.join(dir, ".write-test");
      fs.writeFileSync(probe, "ok", "utf8");
      fs.unlinkSync(probe);

      this.activeDir = dir;
      if (dir === this.fallbackDir && !this.warnedFallback) {
        this.warnedFallback = true;
        console.warn(`[CommunicationEngine] Primary storage unavailable. Falling back to ${dir}.`);
      }
      return true;
    } catch {
      return false;
    }
  }

  load(): CommunicationDayMemory {
    const today = getMemoryDate();
    const filePath = this.resolveFilePath();

    if (!filePath || !fs.existsSync(filePath)) {
      if (this.cache.date !== today) {
        this.cache = { date: today, events: [] };
      }
      return this.cache;
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as CommunicationDayMemory;
      if (parsed.date !== today) {
        this.cache = { date: today, events: [] };
        this.save(this.cache);
        return this.cache;
      }
      this.cache = {
        date: parsed.date,
        events: Array.isArray(parsed.events) ? parsed.events.slice(-200) : [],
      };
      return this.cache;
    } catch {
      return this.cache;
    }
  }

  save(memory: CommunicationDayMemory): void {
    this.cache = {
      date: memory.date,
      events: memory.events.slice(-200),
    };

    const filePath = this.resolveFilePath();
    if (!filePath) {
      return;
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(this.cache, null, 2), "utf8");
    } catch {
      this.diskUnavailable = true;
    }
  }
}

export interface CommunicationMemoryBackend {
  load(): CommunicationDayMemory;
  save(memory: CommunicationDayMemory): void;
}

export class CommunicationEngine {
  constructor(private readonly store: CommunicationMemoryBackend = new CommunicationMemoryStore()) {}

  private buildGlobalStateKey(payload: PayloadTelegram): string {
    return [
      normalizeText(payload.market_status),
      normalizeText(payload.action_taken),
      normalizeText(payload.scenario_classification),
    ].join("|");
  }

  prepareTelegramPlan(input: {
    symbol: string;
    decision: CadpDecisionV3;
    payload: PayloadTelegram;
    premiumPayload?: PayloadAlertaPremium;
    communityContext?: CommunityContextSnapshot;
  }): CommunicationPlan {
    const normalizedSummary = `${normalizeText(input.payload.public_summary)}|${normalizeText(input.payload.public_warning)}|${input.payload.market_status}|${input.payload.action_taken}`;
    const premiumPayload = input.premiumPayload;
    const isOfficialAlert = !!premiumPayload
      && (premiumPayload.action === "BUY" || premiumPayload.action === "SELL")
      && premiumPayload.entry !== null;
    const summaryBase = isOfficialAlert
      ? `${input.symbol}|${input.decision}|official|${normalizedSummary}`
      : `GLOBAL|WAITING_MARKET|${normalizedSummary}`;
    const summaryHash = hashText(summaryBase);
    const memory = this.store.load();

    if (isOfficialAlert) {
      const officialAlertsSentToday = memory.events.filter(event => event.category === "OFFICIAL_ALERT").length;
      if (officialAlertsSentToday >= MAX_FREE_OFFICIAL_ALERTS_PER_DAY) {
        return {
          shouldSend: false,
          channel: "alerts",
          category: "OFFICIAL_ALERT",
          reason: "CUPO_FREE",
          fingerprint: `${input.symbol}:${input.decision}:official:${summaryHash}`,
          summaryHash,
          symbol: input.symbol,
          decision: input.decision,
        };
      }

      return {
        shouldSend: true,
        channel: "alerts",
        category: "OFFICIAL_ALERT",
        reason: "ALERTA",
        message: this.buildOfficialAlertMessage(input.symbol, premiumPayload),
        fingerprint: `${input.symbol}:${input.decision}:official:${summaryHash}`,
        summaryHash,
        symbol: input.symbol,
        decision: input.decision,
      };
    }

    const category: CommunicationCategory = "GLOBAL_SUMMARY";
    const contextSentToday = memory.events.filter((event) => event.category === "GLOBAL_SUMMARY").length;
    if (contextSentToday >= MAX_CONTEXT_MESSAGES_PER_DAY) {
      return {
        shouldSend: false,
        channel: "notes",
        category,
        reason: "SILENCIO",
        fingerprint: `${category}:${summaryHash}`,
        summaryHash,
        symbol: "GLOBAL",
        decision: input.decision,
      };
    }

    const fingerprint = `GLOBAL:WAITING_MARKET:${summaryHash}`;
  const equivalentStateFingerprint = `GLOBAL:STATE:${this.buildGlobalStateKey(input.payload)}`;
    const allRecent = memory.events.slice(-30);
    const sameFingerprint = allRecent.find((event) => event.fingerprint === fingerprint);
  const sameStateAlreadySent = allRecent.find((event) => event.fingerprint === equivalentStateFingerprint);
    const lastGlobal = [...allRecent].reverse().find((event) => event.category === "GLOBAL_SUMMARY");
    const nowMs = Date.now();
    const tone = this.deriveTone(input.communityContext, allRecent, nowMs);

    if (sameFingerprint && nowMs - sameFingerprint.sent_at_ms < this.getCooldownMs(category, input.payload.recheck_minutes)) {
      return {
        shouldSend: false,
        channel: "notes",
        category,
        reason: "SILENCIO",
        fingerprint,
        summaryHash,
        symbol: "GLOBAL",
        decision: input.decision,
      };
    }

    if (lastGlobal && nowMs - lastGlobal.sent_at_ms < this.getCooldownMs(category, input.payload.recheck_minutes)) {
      return {
        shouldSend: false,
        channel: "notes",
        category,
        reason: "SILENCIO",
        fingerprint,
        summaryHash,
        symbol: "GLOBAL",
        decision: input.decision,
      };
    }

    if (sameStateAlreadySent && nowMs - sameStateAlreadySent.sent_at_ms < this.getCooldownMs(category, input.payload.recheck_minutes)) {
      return {
        shouldSend: false,
        channel: "notes",
        category,
        reason: "SILENCIO",
        fingerprint,
        summaryHash,
        symbol: "GLOBAL",
        decision: input.decision,
      };
    }

    const message = this.buildGlobalSummary(input.payload, summaryHash, tone);

    return {
      shouldSend: true,
      channel: "notes",
      category,
      reason: "RESUMEN_GLOBAL",
      message,
      fingerprint: equivalentStateFingerprint,
      summaryHash,
      symbol: "GLOBAL",
      decision: input.decision,
    };
  }

  registerSent(plan: CommunicationPlan): void {
    if (!plan.shouldSend) {
      return;
    }

    const memory = this.store.load();
    const today = getMemoryDate();
    const nextMemory: CommunicationDayMemory = memory.date === today
      ? memory
      : { date: today, events: [] };

    nextMemory.events.push({
      symbol: plan.symbol,
      decision: plan.decision,
      category: plan.category,
      fingerprint: plan.fingerprint,
      summary_hash: plan.summaryHash,
      sent_at_ms: Date.now(),
      channel: plan.channel,
    });

    this.store.save(nextMemory);
  }

  private getCooldownMs(category: CommunicationCategory, recheckMinutes: number | null | undefined): number {
    const reviewMs = Math.max(5, recheckMinutes ?? 15) * 60_000;
    if (category === "GLOBAL_SUMMARY") {
      return Math.max(reviewMs, 2 * 60 * 60_000);
    }
    return reviewMs;
  }

  private deriveTone(
    context: CommunityContextSnapshot | undefined,
    recentEvents: CommunicationEventMemory[],
    nowMs: number,
  ): CommunityTone {
    const lastSent = recentEvents.at(-1)?.sent_at_ms ?? null;
    const silenceMs = lastSent ? nowMs - lastSent : Number.POSITIVE_INFINITY;

    if (context) {
      if (context.lossCount > context.winCount && context.dailyPnlUsd < 0) {
        return "CALM";
      }

      if (context.winCount > 0 && context.dailyPnlUsd > 0) {
        return "MEASURED_POSITIVE";
      }
    }

    if (silenceMs >= 2 * 60 * 60_000) {
      return "PATIENT";
    }

    return "NEUTRAL";
  }

  private buildOfficialAlertMessage(symbol: string, premiumPayload: PayloadAlertaPremium): string {
    const directionLabel = premiumPayload.action === "BUY" ? "🟢 COMPRA" : "🔴 VENTA";
    const stateLabel = premiumPayload.action === "BUY" ? "Lista para ejecutar" : "Lista para ejecutar";

    let message = `${directionLabel}\n`;
    message += `${symbol}\n\n`;
    message += `Entrada: ${premiumPayload.entry ?? "N/A"}\n`;
    message += `SL: ${premiumPayload.stop_loss ?? "N/A"}\n`;
    message += `TP: ${premiumPayload.take_profit ?? "N/A"}\n`;
    message += `R/B: ${premiumPayload.rr ?? "N/A"}\n`;
    message += `Estado: ${stateLabel}`;
    return message;
  }

  private buildGlobalSummary(payload: PayloadTelegram, seed: string, tone: CommunityTone): string {
    const titles: Record<CommunityTone, string[]> = {
      CALM: ["🟡 Mercado en espera", "🟡 Seguimos en espera disciplinada"],
      MEASURED_POSITIVE: ["🟡 Mercado en espera", "🟡 Seguimos selectivos"],
      PATIENT: ["🟡 Mercado en espera", "🟡 Seguimos monitoreando con paciencia"],
      NEUTRAL: ["🟡 Mercado en espera", "🟡 Sin entrada por ahora"],
    };
    const title = pickVariant(`${seed}:title:${tone}`, titles[tone]);
    const body = this.buildGlobalNoTradeContext(payload, tone, seed);
    return `${title}\n\n${body}`;
  }

  private buildGlobalNoTradeContext(payload: PayloadTelegram, tone: CommunityTone, seed: string): string {
    const baseByTone: Record<CommunityTone, string[]> = {
      CALM: [
        "Por ahora no detectamos una entrada con ventaja suficiente en los principales instrumentos. Seguimos monitoreando con disciplina y avisaremos solo cuando aparezca una oportunidad clara.",
        "El mercado sigue sin ofrecer una ventaja clara en los instrumentos principales. Mantenemos la calma y solo avisaremos si aparece una entrada realmente limpia.",
      ],
      MEASURED_POSITIVE: [
        "Por ahora no detectamos una entrada con ventaja suficiente en los principales instrumentos. Preferimos conservar calidad y avisar solo cuando aparezca una oportunidad clara.",
        "Después del movimiento reciente seguimos selectivos: todavía no vemos una entrada con ventaja suficiente en los instrumentos principales. Avisaremos solo si el contexto mejora de verdad.",
      ],
      PATIENT: [
        "Por ahora no detectamos una entrada con ventaja suficiente en los principales instrumentos. Seguimos monitoreando y avisaremos únicamente cuando aparezca una oportunidad clara.",
        "El mercado sigue en espera en los principales instrumentos. Seguimos atentos y solo interrumpiremos al grupo cuando exista una oportunidad clara.",
      ],
      NEUTRAL: [
        "Por ahora no detectamos una entrada con ventaja suficiente en los principales instrumentos. Seguimos monitoreando y avisaremos únicamente cuando aparezca una oportunidad clara.",
        "De momento no vemos una entrada con ventaja suficiente en los instrumentos principales. Seguimos observando y avisaremos solo si aparece una oportunidad clara.",
      ],
    };

    const fromPayload = truncate(compactReason(payload), 70);
    const base = pickVariant(`${seed}:global:${tone}`, baseByTone[tone]);

    if (!fromPayload || fromPayload.length < 18) {
      return base;
    }

    return `${base} Contexto actual: ${fromPayload}.`;
  }
}

export const communicationEngine = new CommunicationEngine();