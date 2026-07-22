/**
 * Analysis Store — Persiste análisis completos para visualización en Admin
 * Mantiene historial de últimos 100 análisis con expediente, prompt, respuesta, distribución
 */

import type {
  ExpedienteMaestroV3,
  RespuestaMaestraV3,
  CanonicalSymbol,
  PreAnalysisTriggerReason,
} from "./typesMaestroV3";
import type { DispatchResult } from "./disparadorModulos";

export interface StoredAnalysis {
  // Identificadores
  analysis_id: string;
  signal_id: string;
  canonical_symbol: CanonicalSymbol;
  timestamp_utc_ms: number;
  trigger_reason: PreAnalysisTriggerReason;

  // Expediente completo (16 secciones)
  expediente: ExpedienteMaestroV3;

  // Prompt y respuesta
  prompt_text: string;
  prompt_hash: string;
  estimated_tokens: number;
  pregunta_maestra?: string;

  // Respuesta OpenAI
  respuesta_maestra: RespuestaMaestraV3 | null;
  response_latency_ms: number;
  response_cost_usd: number;
  response_valid: boolean;
  response_errors?: string[];

  // Distribución a 9 módulos
  dispatch_result: DispatchResult | null;
  dispatch_errors?: Record<string, string>;

  // Estado
  status: "COMPLETED" | "SKIPPED_BEFORE_AI" | "REUSED_PREVIOUS_ANALYSIS" | "AI_ERROR" | "DISPATCH_ERROR";
  skip_reason?: string;

  // API-consumption tracing
  api_called: boolean;
  reuse_of_analysis_id?: string;
  reuse_reason?: string;
  material_changes_detected?: string[];
  scenario_signature?: string;
  tokens_input?: number;
  tokens_output?: number;
  tokens_avoided?: number;
  cost_avoided_usd?: number;

  // Paper trading impact (si aplica)
  paper_trade_opened?: {
    trade_id: string;
    direction: "BUY" | "SELL";
    entry_price: number;
    tp: number;
    sl: number;
    timestamp_utc_ms: number;
  };
  paper_balance_before_usd?: number;
  paper_balance_after_usd?: number;
  paper_pnl_usd?: number;

  // Metadatos
  worker_id?: string;
  data_source?: string; // "TWELVE_DATA", "MOCK", etc.
}

export class AnalysisStore {
  private readonly maxRecords = 500;
  private records: StoredAnalysis[] = [];

  /**
   * Record a completed analysis
   */
  record(analysis: StoredAnalysis): void {
    this.records.unshift(analysis);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(0, this.maxRecords);
    }
  }

  /**
   * Get all analyses (limited to latest 100)
   */
  getLatest(limit = 100): StoredAnalysis[] {
    return this.records.slice(0, limit);
  }

  /**
   * Get analyses by symbol (latest 10)
   */
  getBySymbol(symbol: CanonicalSymbol, limit = 10): StoredAnalysis[] {
    return this.records.filter((a) => a.canonical_symbol === symbol).slice(0, limit);
  }

  /**
   * Get single analysis by ID
   */
  getById(analysisId: string): StoredAnalysis | null {
    return this.records.find((a) => a.analysis_id === analysisId) ?? null;
  }

  /**
   * Get summary for dashboard
   */
  getSummary() {
    const bySymbol = new Map<CanonicalSymbol, StoredAnalysis[]>();
    for (const record of this.records) {
      if (!bySymbol.has(record.canonical_symbol)) {
        bySymbol.set(record.canonical_symbol, []);
      }
      bySymbol.get(record.canonical_symbol)!.push(record);
    }

    const summary: Record<
      string,
      {
        last_analysis?: StoredAnalysis;
        last_timestamp_utc_ms?: number;
        total_cost_usd: number;
        total_analyses: number;
        last_decision?: string;
        last_status?: string;
      }
    > = {};

    for (const [symbol, analyses] of bySymbol.entries()) {
      const last = analyses[0];
      const totalCost = analyses.reduce((sum, a) => sum + (a.response_cost_usd || 0), 0);
      summary[symbol] = {
        last_analysis: last,
        last_timestamp_utc_ms: last?.timestamp_utc_ms,
        total_cost_usd: totalCost,
        total_analyses: analyses.length,
        last_decision: last?.respuesta_maestra?.master_decision?.decision ?? "N/A",
        last_status: last?.status,
      };
    }

    return summary;
  }

  /**
   * Clear all records (for testing)
   */
  clear(): void {
    this.records = [];
  }

  /**
   * Get raw records (for API)
   */
  getRawRecords(): StoredAnalysis[] {
    return this.records;
  }
}

export const analysisStore = new AnalysisStore();
