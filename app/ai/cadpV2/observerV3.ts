/**
 * Observer V3 — Registro en tiempo real del Expediente Maestro V3
 * Acumula todos los análisis, resultados y costos.
 * Fuente única de verdad para el panel administrativo.
 */

import type {
  CanonicalSymbol,
  AnalysisRecordV3,
  RespuestaMaestraV3,
  ExpedienteMaestroV3,
  QualityV3,
  PaperAccountState,
  PayloadObservador,
} from "./typesMaestroV3";

export interface DailySummary {
  date: string;
  analyses_total: number;
  analyses_skipped: number;
  analyses_reused: number;
  analyses_completed: number;
  ai_errors: number;
  signals_buy: number;
  signals_sell: number;
  signals_wait: number;
  signals_no_trade: number;
  no_trade_pct: number;
  paper_trades_opened: number;
  paper_wins: number;
  paper_losses: number;
  paper_expired: number;
  openai_cost_total_usd: number;
  openai_calls_made: number;
  avg_tokens_per_call: number;
  avg_latency_ms: number;
  most_active_symbol: CanonicalSymbol | null;
  symbols_summary: Partial<Record<CanonicalSymbol, {
    analyses: number;
    signals: number;
    no_trade: number;
    cost_usd: number;
  }>>;
}

export interface ObserverState {
  running: boolean;
  started_at: string | null;
  analyses: AnalysisRecordV3[];
  latest_by_symbol: Partial<Record<CanonicalSymbol, AnalysisRecordV3>>;
  last_observer_payload: Partial<Record<CanonicalSymbol, PayloadObservador>>;
  paper_account: PaperAccountState | null;
  daily_summary: DailySummary | null;
  errors: Array<{ timestamp: string; symbol: CanonicalSymbol; message: string }>;
  total_openai_cost_usd: number;
  total_analyses: number;
  total_skipped: number;
}

export class ObserverV3 {
  private readonly records: AnalysisRecordV3[] = [];
  private readonly latestBySymbol = new Map<CanonicalSymbol, AnalysisRecordV3>();
  private readonly latestPayload = new Map<CanonicalSymbol, PayloadObservador>();
  private readonly errors: ObserverState["errors"] = [];
  private running = false;
  private startedAt: string | null = null;
  private paperAccount: PaperAccountState | null = null;
  private totalCost = 0;
  /** Max records to keep in memory */
  private readonly maxRecords = 500;

  markRunning(isRunning: boolean): void {
    this.running = isRunning;
    if (isRunning && !this.startedAt) {
      this.startedAt = new Date().toISOString();
    }
  }

  /** Record a SKIPPED analysis (no AI call) */
  recordSkipped(params: {
    analysis_id: string;
    signal_id: string;
    canonical_symbol: CanonicalSymbol;
    skip: QualityV3["skip_before_ai"];
    expediente: ExpedienteMaestroV3;
  }): AnalysisRecordV3 {
    const record: AnalysisRecordV3 = {
      analysis_id: params.analysis_id,
      signal_id: params.signal_id,
      canonical_symbol: params.canonical_symbol,
      timestamp_iso: new Date().toISOString(),
      idempotency_key: params.expediente.quality.skip_before_ai?.detail ?? "",
      expediente: params.expediente,
      prompt_sent: "",
      response_raw: null,
      skip_before_ai: params.skip,
      status: params.skip?.skip_reason === "IDEMPOTENT_REUSE" ? "REUSED_PREVIOUS_ANALYSIS" : "SKIPPED_BEFORE_AI",
      cost_usd: 0,
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };
    this.push(record);
    return record;
  }

  /** Record a COMPLETED analysis (AI responded) */
  recordCompleted(params: {
    analysis_id: string;
    signal_id: string;
    canonical_symbol: CanonicalSymbol;
    expediente: ExpedienteMaestroV3;
    prompt_sent: string;
    response: RespuestaMaestraV3;
    idempotency_key: string;
    cost_usd: number;
    latency_ms: number;
  }): AnalysisRecordV3 {
    const record: AnalysisRecordV3 = {
      analysis_id: params.analysis_id,
      signal_id: params.signal_id,
      canonical_symbol: params.canonical_symbol,
      timestamp_iso: new Date().toISOString(),
      idempotency_key: params.idempotency_key,
      expediente: params.expediente,
      prompt_sent: params.prompt_sent,
      response_raw: params.response,
      skip_before_ai: null,
      status: "COMPLETED",
      cost_usd: params.cost_usd,
      latency_ms: params.latency_ms,
      created_at: new Date().toISOString(),
    };
    this.push(record);
    this.totalCost += params.cost_usd;
    return record;
  }

  /** Record an AI error */
  recordError(params: {
    analysis_id: string;
    signal_id: string;
    canonical_symbol: CanonicalSymbol;
    expediente: ExpedienteMaestroV3;
    prompt_sent: string;
    error_message: string;
    idempotency_key: string;
    latency_ms: number;
  }): AnalysisRecordV3 {
    const record: AnalysisRecordV3 = {
      analysis_id: params.analysis_id,
      signal_id: params.signal_id,
      canonical_symbol: params.canonical_symbol,
      timestamp_iso: new Date().toISOString(),
      idempotency_key: params.idempotency_key,
      expediente: params.expediente,
      prompt_sent: params.prompt_sent,
      response_raw: null,
      skip_before_ai: null,
      status: "AI_ERROR",
      cost_usd: 0,
      latency_ms: params.latency_ms,
      created_at: new Date().toISOString(),
    };
    this.push(record);
    this.errors.push({
      timestamp: record.created_at,
      symbol: params.canonical_symbol,
      message: params.error_message.slice(0, 500),
    });
    return record;
  }

  saveObservadorPayload(symbol: CanonicalSymbol, payload: PayloadObservador): void {
    this.latestPayload.set(symbol, payload);
  }

  updatePaperAccount(account: PaperAccountState): void {
    this.paperAccount = account;
  }

  getObserverState(): ObserverState {
    return {
      running: this.running,
      started_at: this.startedAt,
      analyses: this.records.slice(-100),
      latest_by_symbol: Object.fromEntries(this.latestBySymbol) as ObserverState["latest_by_symbol"],
      last_observer_payload: Object.fromEntries(this.latestPayload) as ObserverState["last_observer_payload"],
      paper_account: this.paperAccount,
      daily_summary: this.buildDailySummary(),
      errors: this.errors.slice(-20),
      total_openai_cost_usd: this.totalCost,
      total_analyses: this.records.length,
      total_skipped: this.records.filter(r => r.status === "SKIPPED_BEFORE_AI" || r.status === "REUSED_PREVIOUS_ANALYSIS").length,
    };
  }

  getLatestForSymbol(symbol: CanonicalSymbol): AnalysisRecordV3 | null {
    return this.latestBySymbol.get(symbol) ?? null;
  }

  getObservadorPayload(symbol: CanonicalSymbol): PayloadObservador | null {
    return this.latestPayload.get(symbol) ?? null;
  }

  private push(record: AnalysisRecordV3): void {
    this.records.push(record);
    if (this.records.length > this.maxRecords) this.records.shift();
    this.latestBySymbol.set(record.canonical_symbol, record);
  }

  private buildDailySummary(): DailySummary | null {
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = this.records.filter(r => r.created_at.startsWith(today));
    if (todayRecords.length === 0) return null;

    const completed = todayRecords.filter(r => r.status === "COMPLETED");
    const skipped = todayRecords.filter(r => r.status === "SKIPPED_BEFORE_AI");
    const reused = todayRecords.filter(r => r.status === "REUSED_PREVIOUS_ANALYSIS");
    const errored = todayRecords.filter(r => r.status === "AI_ERROR");

    const decisions = completed.map(r => r.response_raw?.master_decision.decision);
    const signals_buy = decisions.filter(d => d === "ENTER_BUY").length;
    const signals_sell = decisions.filter(d => d === "ENTER_SELL").length;
    const signals_wait = decisions.filter(d => d === "WAIT" || d === "CONDITIONAL_ENTRY" || d === "ENTRY_MISSED").length;
    const signals_no_trade = decisions.filter(d => d === "NO_TRADE" || d === "DATA_INSUFFICIENT" || d === "NEWS_VERIFICATION_REQUIRED").length;

    const totalCostToday = completed.reduce((sum, r) => sum + r.cost_usd, 0);
    const avgTokens = completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.response_raw?._meta.tokens_in ?? 0) + (r.response_raw?._meta.tokens_out ?? 0), 0) / completed.length
      : 0;
    const avgLatency = completed.length > 0
      ? completed.reduce((sum, r) => sum + r.latency_ms, 0) / completed.length
      : 0;

    // Symbol counts
    const symbolCounts: DailySummary["symbols_summary"] = {};
    for (const r of todayRecords) {
      const s = r.canonical_symbol;
      if (!symbolCounts[s]) symbolCounts[s] = { analyses: 0, signals: 0, no_trade: 0, cost_usd: 0 };
      symbolCounts[s]!.analyses++;
      symbolCounts[s]!.cost_usd += r.cost_usd;
      const dec = r.response_raw?.master_decision.decision;
      if (dec === "ENTER_BUY" || dec === "ENTER_SELL") symbolCounts[s]!.signals++;
      if (dec === "NO_TRADE" || dec === "DATA_INSUFFICIENT") symbolCounts[s]!.no_trade++;
    }

    const mostActiveSymbol = Object.entries(symbolCounts)
      .sort(([, a], [, b]) => b.analyses - a.analyses)[0]?.[0] as CanonicalSymbol | undefined ?? null;

    const paper = this.paperAccount;

    return {
      date: today,
      analyses_total: todayRecords.length,
      analyses_skipped: skipped.length,
      analyses_reused: reused.length,
      analyses_completed: completed.length,
      ai_errors: errored.length,
      signals_buy,
      signals_sell,
      signals_wait,
      signals_no_trade,
      no_trade_pct: completed.length > 0 ? (signals_no_trade / completed.length) * 100 : 0,
      paper_trades_opened: paper?.open_trades.length ?? 0,
      paper_wins: paper?.win_count ?? 0,
      paper_losses: paper?.loss_count ?? 0,
      paper_expired: paper?.expired_count ?? 0,
      openai_cost_total_usd: totalCostToday,
      openai_calls_made: completed.length,
      avg_tokens_per_call: Math.round(avgTokens),
      avg_latency_ms: Math.round(avgLatency),
      most_active_symbol: mostActiveSymbol,
      symbols_summary: symbolCounts,
    };
  }
}

export const observerV3 = new ObserverV3();
