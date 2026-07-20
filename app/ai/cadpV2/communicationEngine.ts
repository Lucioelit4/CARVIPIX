import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { CadpDecisionV3, PayloadAlertaPremium, PayloadTelegram } from "./typesMaestroV3";

type ChannelKind = "alerts" | "notes";
type CommunicationCategory = "OFFICIAL_ALERT" | "NO_TRADE_NOTE" | "WATCH_NOTE";

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

export class CommunicationEngine {
  private readonly store = new CommunicationMemoryStore();

  prepareTelegramPlan(input: {
    symbol: string;
    decision: CadpDecisionV3;
    payload: PayloadTelegram;
    premiumPayload?: PayloadAlertaPremium;
  }): CommunicationPlan {
    const summaryBase = `${input.symbol}|${input.decision}|${normalizeText(input.payload.public_summary)}|${normalizeText(input.payload.public_warning)}|${input.payload.market_status}|${input.payload.action_taken}|${input.payload.recheck_minutes ?? "na"}`;
    const summaryHash = hashText(summaryBase);

    if (input.premiumPayload?.action && (input.premiumPayload.action === "BUY" || input.premiumPayload.action === "SELL") && input.premiumPayload.entry !== null) {
      return {
        shouldSend: true,
        channel: "alerts",
        category: "OFFICIAL_ALERT",
        reason: "official-alert-priority",
        message: this.buildOfficialAlertMessage(input.symbol, input.premiumPayload),
        fingerprint: `${input.symbol}:${input.decision}:official:${summaryHash}`,
        summaryHash,
        symbol: input.symbol,
        decision: input.decision,
      };
    }

    const category = input.decision === "NO_TRADE" ? "NO_TRADE_NOTE" : "WATCH_NOTE";
    const fingerprint = `${input.symbol}:${input.decision}:${category}:${summaryHash}`;
    const memory = this.store.load();
    const recentForSymbol = memory.events.filter((event) => event.symbol === input.symbol).slice(-8);
    const sameFingerprint = recentForSymbol.find((event) => event.fingerprint === fingerprint);
    const lastSameCategory = [...recentForSymbol].reverse().find((event) => event.category === category);
    const nowMs = Date.now();

    if (sameFingerprint && nowMs - sameFingerprint.sent_at_ms < this.getCooldownMs(category, input.payload.recheck_minutes)) {
      return {
        shouldSend: false,
        channel: "notes",
        category,
        reason: "duplicate-message-suppressed",
        fingerprint,
        summaryHash,
        symbol: input.symbol,
        decision: input.decision,
      };
    }

    if (
      category === "NO_TRADE_NOTE" &&
      lastSameCategory &&
      lastSameCategory.summary_hash === summaryHash &&
      nowMs - lastSameCategory.sent_at_ms < this.getCooldownMs(category, input.payload.recheck_minutes)
    ) {
      return {
        shouldSend: false,
        channel: "notes",
        category,
        reason: "consecutive-no-trade-suppressed",
        fingerprint,
        summaryHash,
        symbol: input.symbol,
        decision: input.decision,
      };
    }

    const message = category === "NO_TRADE_NOTE"
      ? this.buildNoTradeNote(input.symbol, input.payload, summaryHash)
      : this.buildWatchNote(input.symbol, input.payload, input.decision, summaryHash);

    return {
      shouldSend: true,
      channel: "notes",
      category,
      reason: "contextual-note-allowed",
      message,
      fingerprint,
      summaryHash,
      symbol: input.symbol,
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
    if (category === "NO_TRADE_NOTE") {
      return Math.max(reviewMs, 30 * 60_000);
    }
    return Math.max(reviewMs, 15 * 60_000);
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

  private buildNoTradeNote(symbol: string, payload: PayloadTelegram, seed: string): string {
    const openers = [
      "⛔ Sin entrada",
      "⛔ Aún sin señal válida",
      "⛔ Mercado sin ventaja clara",
    ];
    const reasonLabels = [
      "Motivo",
      "Clave",
      "Contexto",
    ];

    const opener = pickVariant(`${seed}:opener`, openers);
    const reasonLabel = pickVariant(`${seed}:reason`, reasonLabels);
    const reason = compactReason(payload);

    return [
      `🟡 ${symbol}`,
      "",
      opener,
      `${reasonLabel}: ${reason}`,
      buildReviewLine(payload),
    ].join("\n");
  }

  private buildWatchNote(
    symbol: string,
    payload: PayloadTelegram,
    decision: CadpDecisionV3,
    seed: string,
  ): string {
    const headlines = [
      "👀 Seguimiento activo",
      "📍 Escenario en vigilancia",
      "🧭 Mercado en observación",
    ];
    const context = truncate(payload.public_summary || payload.public_warning || "Seguimiento profesional sin entrada inmediata.", 110);
    const action = decision === "WAIT" ? "Esperar confirmación." : "Aún falta confirmación operativa.";

    return [
      `${pickVariant(`${seed}:headline`, headlines)} ${symbol}`,
      "",
      context,
      action,
      buildReviewLine(payload),
    ].join("\n");
  }
}

export const communicationEngine = new CommunicationEngine();