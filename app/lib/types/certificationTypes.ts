import type { CanonicalSymbol } from "@/app/ai/cadpV2/typesMaestroV3";

export interface CertificationLogEntry {
  // Identificadores únicos
  id: string;
  analysis_id: string;
  signal_id: string;
  
  // Temporal
  timestamp: number; // ms desde epoch
  date: string; // formato ISO
  hour: string; // HH:MM formato
  
  // Instrumento y contexto
  instrument: CanonicalSymbol;
  cycle_number: number; // consecutivo global
  
  // Trigger y ejecución
  trigger_reason: string; // "MARKET_PROXIMITY" | "PRICE_LEVEL" | "TIMEFRAME_CLOSE" | etc
  cycle_status: "COMPLETED" | "SKIPPED_BEFORE_AI" | "REUSED_PREVIOUS_ANALYSIS" | "AI_ERROR" | "FAILED";
  
  // Decisión de ChatGPT
  decision: string; // "ENTER_BUY" | "ENTER_SELL" | "WAIT" | "NO_TRADE" | "CONDITIONAL_ENTRY" | etc
  probability: number; // 0-100 %
  conviction: number; // score
  
  // Rendimiento
  duration_ms: number; // total del ciclo
  openai_latency_ms: number;
  tokens_used: number;
  cost_usd: number;
  
  // Calidad
  expediente_quality: {
    completeness: number; // 0-100
    sections: number; // cuántas secciones se poblaron
    has_error: boolean;
    error_details?: string;
  };
  
  // Estado del mercado
  market_state: {
    trend: string;
    volatility: string;
    key_levels: string[];
  };
  
  // Distribución (9 destinos)
  distribution: {
    BOT_ENGINE: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    ALERTA_PREMIUM: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    TELEGRAM: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    DASHBOARD: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    ESTADO_MERCADO: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    OBSERVADOR: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    HISTORIAL: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    RESULTADOS_PAPER: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
    MONITOR_PAPER: "DELIVERED" | "SKIPPED" | "FAILED" | "PENDING";
  };
  
  // Monitor Paper en momento del análisis
  paper_state: {
    balance: number;
    open_positions: number;
    closed_positions: number;
    pnl: number;
    win_rate: number;
  };
  
  // Próxima revisión programada
  next_review: number; // ms desde epoch
  
  // Evidencia inmutable (resumen, no duplicate)
  evidence_summary: {
    question_hash: string;
    response_hash: string;
    expediente_sections: number;
  };
}

export interface CertificationSummary {
  total_cycles: number;
  completed: number;
  skipped_before_ai: number;
  reused_previous: number;
  ai_errors: number;
  failed: number;
  total_cost_usd: number;
  unique_instruments: string[];
  distribution_success_rate: number; // 0-100
  open_paper_positions: number;
  closed_paper_positions: number;
  progress: {
    current: number; // ciclos reales completados
    required: number; // 3
    ready_for_review: boolean;
  };
}
