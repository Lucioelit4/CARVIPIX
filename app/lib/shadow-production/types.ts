/**
 * Shadow Production — Type Definitions
 * Sistema de observación integral de 7 días
 */

export type ShadowProductionMode = 'SHADOW_PRODUCTION' | 'PRODUCTION_CONTROLLED' | 'LIVE_PRODUCTION';

export interface ShadowProductionConfig {
  mode: ShadowProductionMode;
  start_date: string; // ISO string
  duration_days: number;
  enabled_modules: string[];
  test_only: boolean;
  auto_send_official: boolean;
  bot_mt4_mt5_enabled: boolean;
  live_trading_enabled: boolean;
  paper_trading_enabled: boolean;
  paper_trading_balance: number;
}

export interface SystemEvent {
  event_id: string;
  timestamp_utc_ms: number;
  module: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  event_type: string;
  description: string;
  data?: Record<string, unknown>;
  analysis_id?: string;
  signal_id?: string;
}

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  timestamp_utc_ms: number;

  // Mercado
  market: {
    total_analyses: number;
    analyses_discarded: number;
    free_alerts: number;
    opportunities: number;
    paper_trades: number;
    paper_wins: number;
    paper_losses: number;
    paper_pnl_usd: number;
    paper_pnl_pct: number;
    paper_win_rate: number;
    drawdown_max: number;
  };

  // Telegram
  telegram: {
    publications_sent: number;
    results_sent: number;
    education_sent: number;
    promotions_suggested: number;
    test_channel_only: boolean;
  };

  // Conversión
  conversion: {
    suggestions_generated: number;
    suggestions_pending_approval: number;
    clics_total: number;
    registrations_total: number;
    payments_attributed: number;
  };

  // Sistema
  system: {
    errors_count: number;
    warnings_count: number;
    openai_cost_usd: number;
    uptime_pct: number;
    active_modules: string[];
  };
}

export interface AnomalyReport {
  anomaly_id: string;
  timestamp_utc_ms: number;
  date: string; // YYYY-MM-DD
  module: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  description: string;
  evidence: Record<string, unknown>;
  analysis_id?: string;
  signal_id?: string;
  status: 'LOGGED' | 'INVESTIGATING' | 'RESOLVED' | 'WONT_FIX';
  resolution?: string;
}

export interface ShadowProductionReport {
  start_date: string;
  end_date: string;
  duration_days: number;

  // Summary
  total_analyses: number;
  total_alerts: number;
  total_errors: number;
  total_cost_usd: number;
  uptime_pct: number;

  // Market Performance
  paper_account_final_pnl: number;
  paper_account_win_rate: number;
  paper_account_max_drawdown: number;

  // Telegram Performance
  total_publications: number;
  avg_publications_per_day: number;

  // Conversion Performance
  total_suggestions_generated: number;
  total_clics: number;
  total_registrations: number;
  total_payments: number;

  // Issues
  total_anomalies: number;
  critical_issues: number;
  major_issues: number;
  minor_issues: number;

  // Module Status
  modules_status: Record<string, {
    active: boolean;
    errors: number;
    status: 'READY' | 'DEGRADED' | 'FAILED';
  }>;

  // Recommendations
  recommendations: string[];
  ready_for_production: boolean;
}

export interface ModuleHealthCheck {
  module_name: string;
  timestamp_utc_ms: number;
  is_ready: boolean;
  status: 'READY' | 'DEGRADED' | 'FAILED';
  last_activity: string;
  error_count_24h: number;
  info: Record<string, unknown>;
}
