import {
  createTradingKnowledgeBase,
  type MarketType,
  type NewsImpact,
  type OperationType,
  type RiskTag,
  type StrategyKnowledgeCard,
  type TradingKnowledgeBase,
  type TradingSession,
} from "./tradingKnowledgeBase";

export type SignalDecision = "BUY" | "SELL" | "WAIT" | "NO_TRADE";

export type StrategyGrade = "A+" | "A" | "B" | "C";

export type Context1H = {
  price: number;
  ema20: number;
  ema50: number;
  ema200: number;
};

export type Structure45M = {
  ema20: number;
  ema50: number;
  ema200: number;
  bias: "bullish" | "bearish" | "neutral";
  falseBreakoutDetected: boolean;
};

export type Entry5M = {
  price: number;
  ema20: number;
  ema50: number;
  ema200: number;
  pullbackValid: boolean;
  breakoutValid: boolean;
};

export type SignalGenerationInput = {
  symbol: string;
  marketType: MarketType;
  session: TradingSession;
  newsImpact: NewsImpact;
  spreadPips: number;
  lowLiquidity: boolean;
  volatilityIndex: number;
  falseBreakoutRisk: number;
  atrPips: number;
  context1H: Context1H;
  structure45M: Structure45M;
  entry5M: Entry5M;
  preferredOperation?: OperationType;
};

export type GeneratedSignal = {
  decision: SignalDecision;
  symbol: string;
  temporalidad: {
    contexto: "1H";
    estructura: "45M";
    entrada: "5M";
  };
  entry: number | null;
  sl: number | null;
  tp: number | null;
  operationType: OperationType | null;
  expectedDurationMinutes: number | null;
  confidence: number;
  risk: "low" | "medium" | "high";
  reason: string;
  invalidation: string;
  classification: StrategyGrade;
  blockedBy: RiskTag[];
};

export class SignalGenerationEngine {
  constructor(private readonly knowledgeBase: TradingKnowledgeBase = createTradingKnowledgeBase()) {}

  getRecognizedMarkets(): MarketType[] {
    return [...this.knowledgeBase.marketTypes];
  }

  getBlockedRiskTypes(): RiskTag[] {
    return [...this.knowledgeBase.risks];
  }

  getStrategyCards(): StrategyKnowledgeCard[] {
    return [...this.knowledgeBase.strategies];
  }

  generate(input: SignalGenerationInput): GeneratedSignal {
    const blockedBy = this.applyFilters(input);
    if (blockedBy.length > 0) {
      const critical = blockedBy.includes("high_impact_news") || blockedBy.includes("high_spread") || blockedBy.includes("extreme_volatility");
      return {
        decision: critical ? "NO_TRADE" : "WAIT",
        symbol: input.symbol,
        temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
        entry: null,
        sl: null,
        tp: null,
        operationType: null,
        expectedDurationMinutes: null,
        confidence: 0,
        risk: "high",
        reason: `Signal blocked by filters: ${blockedBy.join(", ")}`,
        invalidation: "No operar hasta que filtros de riesgo se normalicen.",
        classification: "C",
        blockedBy,
      };
    }

    const trendDirection = this.resolveTrendDirection(input.context1H);
    const structureDirection = this.resolveStructureDirection(input.structure45M);
    const entryDirection = this.resolveEntryDirection(input.entry5M);

    if (trendDirection === "neutral" || structureDirection === "neutral") {
      return this.buildWaitingSignal(input, "WAIT", "Contexto sin direccion operativa valida.");
    }

    if (trendDirection !== structureDirection) {
      return this.buildWaitingSignal(input, "NO_TRADE", "Desalineacion entre contexto 1H y estructura 45M.");
    }

    if (entryDirection !== trendDirection) {
      return this.buildWaitingSignal(input, "WAIT", "Entrada 5M aun no confirma direccion del contexto.");
    }

    const card = this.pickCard(input);
    const score = this.calculateScore(input, trendDirection, card);
    const classification = this.classify(score);

    if (classification === "C") {
      return this.buildWaitingSignal(input, "WAIT", "Setup de baja calidad. Clasificacion C.");
    }

    if (classification === "B" && input.session !== "overlap") {
      return {
        decision: "WAIT",
        symbol: input.symbol,
        temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
        entry: null,
        sl: null,
        tp: null,
        operationType: null,
        expectedDurationMinutes: null,
        confidence: Number(score.toFixed(2)),
        risk: "high",
        reason: "Hardening activo: clasificacion B bloqueada fuera de overlap.",
        invalidation: "Esperar setup A o A+ fuera de overlap.",
        classification,
        blockedBy: ["invalid_structure"],
      };
    }

    const entry = input.entry5M.price;
    const pipSize = this.resolvePipSize(input.symbol);
    const stopDistance = Math.max(input.atrPips * 1.2, 6) * pipSize;
    const rrTarget = classification === "A+" ? 1.8 : classification === "A" ? 1.5 : 1.2;

    const sl = trendDirection === "bullish" ? entry - stopDistance : entry + stopDistance;
    const tp = trendDirection === "bullish" ? entry + stopDistance * rrTarget : entry - stopDistance * rrTarget;

    const risk = classification === "A+" ? "low" : classification === "A" ? "medium" : "high";
    const reason = `Contexto ${trendDirection} confirmado en 1H/45M, gatillo 5M valido, clasificacion ${classification}.`;

    const decision: SignalDecision = trendDirection === "bullish" ? "BUY" : "SELL";

    return {
      decision,
      symbol: input.symbol,
      temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
      entry: Number(entry.toFixed(5)),
      sl: Number(sl.toFixed(5)),
      tp: Number(tp.toFixed(5)),
      operationType: card.operationType,
      expectedDurationMinutes: card.expectedDurationMinutes,
      confidence: Number(score.toFixed(2)),
      risk,
      reason,
      invalidation: card.invalidationRules.map((item) => item.description).join(" | "),
      classification,
      blockedBy: [],
    };
  }

  private applyFilters(input: SignalGenerationInput): RiskTag[] {
    const blocked: RiskTag[] = [];

    if (input.newsImpact === "high") {
      blocked.push("high_impact_news");
    }

    if (input.spreadPips > 3) {
      blocked.push("high_spread");
    }

    if (input.session === "off_session") {
      blocked.push("off_session");
    }

    if (input.marketType === "range" && !input.entry5M.pullbackValid) {
      blocked.push("invalid_structure");
    }

    if (input.lowLiquidity || input.marketType === "low_liquidity") {
      blocked.push("low_liquidity");
    }

    if (input.volatilityIndex >= 85) {
      blocked.push("extreme_volatility");
    }

    if (input.falseBreakoutRisk >= 0.65 || input.structure45M.falseBreakoutDetected) {
      blocked.push("false_breakout");
    }

    return blocked;
  }

  private resolveTrendDirection(context: Context1H): "bullish" | "bearish" | "neutral" {
    const bullish = context.ema20 > context.ema50 && context.ema50 > context.ema200 && context.price >= context.ema20;
    const bearish = context.ema20 < context.ema50 && context.ema50 < context.ema200 && context.price <= context.ema20;
    if (bullish) return "bullish";
    if (bearish) return "bearish";
    return "neutral";
  }

  private resolveStructureDirection(structure: Structure45M): "bullish" | "bearish" | "neutral" {
    if (structure.bias === "bullish") return "bullish";
    if (structure.bias === "bearish") return "bearish";

    const bullish = structure.ema20 > structure.ema50 && structure.ema50 > structure.ema200;
    const bearish = structure.ema20 < structure.ema50 && structure.ema50 < structure.ema200;

    if (bullish) return "bullish";
    if (bearish) return "bearish";
    return "neutral";
  }

  private resolveEntryDirection(entry: Entry5M): "bullish" | "bearish" | "neutral" {
    const bullish = entry.ema20 > entry.ema50 && entry.price >= entry.ema20 && entry.pullbackValid;
    const bearish = entry.ema20 < entry.ema50 && entry.price <= entry.ema20 && entry.pullbackValid;
    if (entry.breakoutValid) {
      return bullish ? "bullish" : bearish ? "bearish" : "neutral";
    }
    if (bullish) return "bullish";
    if (bearish) return "bearish";
    return "neutral";
  }

  private pickCard(input: SignalGenerationInput): StrategyKnowledgeCard {
    if (input.preferredOperation) {
      const preferred = this.knowledgeBase.strategies.find((card) => card.operationType === input.preferredOperation);
      if (preferred) {
        return preferred;
      }
    }

    if (input.marketType === "range") {
      return this.findCard("range_reversion");
    }

    if (input.marketType === "volatile_breakout") {
      return this.findCard("breakout_continuation");
    }

    return this.findCard("trend_continuation");
  }

  private findCard(operationType: OperationType): StrategyKnowledgeCard {
    const card = this.knowledgeBase.strategies.find((item) => item.operationType === operationType);
    if (!card) {
      throw new Error(`Missing strategy card for ${operationType}`);
    }
    return card;
  }

  private calculateScore(
    input: SignalGenerationInput,
    trendDirection: "bullish" | "bearish",
    card: StrategyKnowledgeCard,
  ): number {
    let score = 0;

    score += 35;

    if (input.structure45M.bias !== "neutral") {
      score += 25;
    }

    if (input.entry5M.pullbackValid && input.entry5M.breakoutValid) {
      score += 25;
    } else if (input.entry5M.pullbackValid) {
      score += 18;
    }

    score += Math.max(0, 15 - input.spreadPips * 2);

    if (input.marketType === "trend_bullish" || input.marketType === "trend_bearish") {
      score += 8;
    }

    if (input.session === "overlap") {
      score += 6;
    }

    if (input.volatilityIndex > 70) {
      score -= 8;
    }

    if (input.falseBreakoutRisk > 0.45) {
      score -= 10;
    }

    if (card.operationType === "range_reversion" && (input.marketType === "trend_bullish" || input.marketType === "trend_bearish")) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private classify(score: number): StrategyGrade {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    return "C";
  }

  private resolvePipSize(symbol: string): number {
    if (symbol.includes("XAU")) {
      return 0.1;
    }
    if (symbol.includes("BTC")) {
      return 1;
    }
    return 0.0001;
  }

  private buildWaitingSignal(
    input: SignalGenerationInput,
    decision: "WAIT" | "NO_TRADE",
    reason: string,
  ): GeneratedSignal {
    return {
      decision,
      symbol: input.symbol,
      temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
      entry: null,
      sl: null,
      tp: null,
      operationType: null,
      expectedDurationMinutes: null,
      confidence: 35,
      risk: "high",
      reason,
      invalidation: "Mantener espera hasta alinear contexto, estructura y entrada.",
      classification: "C",
      blockedBy: [],
    };
  }
}
