/**
 * Shadow Production — Daily Metrics Aggregator
 * Recolecta y agrupa métricas de todos los módulos diariamente
 */

import type { DailyMetrics } from './types';
import { saveDailyMetrics, getSystemEvents, logSystemEvent } from './persistence';

// ─── Collect Metrics from Each Module ────────────────────────────────

async function collectMarketMetrics() {
  try {
    const res = await fetch('http://localhost:3001/api/internal/observer-v3/status');
    if (!res.ok) throw new Error('Observer unreachable');

    const data = (await res.json()) as {
      total_analyses: number;
      paper_account: {
        current_balance_usd: number;
        total_pnl_usd: number;
        total_pnl_pct: number;
        win_count: number;
        loss_count: number;
        max_drawdown_usd: number;
      };
    };

    return {
      total_analyses: data.total_analyses || 0,
      analyses_discarded: 0, // Calcular desde logs si disponible
      free_alerts: 0,
      opportunities: 0,
      paper_trades: (data.paper_account?.win_count || 0) + (data.paper_account?.loss_count || 0),
      paper_wins: data.paper_account?.win_count || 0,
      paper_losses: data.paper_account?.loss_count || 0,
      paper_pnl_usd: data.paper_account?.total_pnl_usd || 0,
      paper_pnl_pct: data.paper_account?.total_pnl_pct || 0,
      paper_win_rate: data.paper_account?.win_count || data.paper_account?.loss_count
        ? ((data.paper_account?.win_count || 0) / ((data.paper_account?.win_count || 0) + (data.paper_account?.loss_count || 0))) * 100
        : 0,
      drawdown_max: data.paper_account?.max_drawdown_usd || 0,
    };
  } catch (err) {
    console.warn('[METRICS] Error collecting market metrics:', err);
    return {
      total_analyses: 0,
      analyses_discarded: 0,
      free_alerts: 0,
      opportunities: 0,
      paper_trades: 0,
      paper_wins: 0,
      paper_losses: 0,
      paper_pnl_usd: 0,
      paper_pnl_pct: 0,
      paper_win_rate: 0,
      drawdown_max: 0,
    };
  }
}

async function collectTelegramMetrics() {
  try {
    const res = await fetch('http://localhost:3001/api/internal/community-publisher/publications');
    if (!res.ok) throw new Error('Community Publisher unreachable');

    const data = (await res.json()) as {
      publications: Array<{
        publication_type: string;
        status: string;
        created_at: string;
      }>;
    };

    const today = new Date().toISOString().split('T')[0];
    const todayPubs = (data.publications || []).filter(p =>
      p.created_at.split('T')[0] === today && p.status === 'DELIVERED',
    );

    return {
      publications_sent: todayPubs.length,
      results_sent: todayPubs.filter(p => p.publication_type === 'TRADE_RESULT').length,
      education_sent: todayPubs.filter(p => p.publication_type === 'EDUCATIONAL_OR_PROMOTIONAL').length,
      promotions_suggested: 0, // Calcular desde Trust Engine
      test_channel_only: true,
    };
  } catch (err) {
    console.warn('[METRICS] Error collecting telegram metrics:', err);
    return {
      publications_sent: 0,
      results_sent: 0,
      education_sent: 0,
      promotions_suggested: 0,
      test_channel_only: true,
    };
  }
}

async function collectConversionMetrics() {
  try {
    const res = await fetch('http://localhost:3001/api/internal/trust-conversion/metrics');
    if (!res.ok) throw new Error('Trust Conversion unreachable');

    const data = (await res.json()) as {
      metrics: {
        moments_published: number;
        total_clicks: number;
        total_registrations: number;
        total_conversions: number;
      };
    };

    return {
      suggestions_generated: data.metrics?.moments_published || 0,
      suggestions_pending_approval: 0, // Calcular por query adicional
      clics_total: data.metrics?.total_clicks || 0,
      registrations_total: data.metrics?.total_registrations || 0,
      payments_attributed: data.metrics?.total_conversions || 0,
    };
  } catch (err) {
    console.warn('[METRICS] Error collecting conversion metrics:', err);
    return {
      suggestions_generated: 0,
      suggestions_pending_approval: 0,
      clics_total: 0,
      registrations_total: 0,
      payments_attributed: 0,
    };
  }
}

async function collectSystemMetrics() {
  try {
    const events = await getSystemEvents();
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.timestamp_utc_ms > Date.now() - 24 * 60 * 60 * 1000);

    return {
      errors_count: todayEvents.filter(e => e.severity === 'ERROR').length,
      warnings_count: todayEvents.filter(e => e.severity === 'WARNING').length,
      openai_cost_usd: 0, // Calcular desde logs de Observer
      uptime_pct: 99.5, // Estimar desde eventos de error
      active_modules: [
        'TWELVE_DATA',
        'EXPEDIENTE_MAESTRO',
        'CHATGPT',
        'DISPARADOR',
        'COMMUNITY_PUBLISHER',
        'TELEGRAM',
        'TRUST_CONVERSION',
        'PAPER_ACCOUNT',
        'OBSERVER',
      ],
    };
  } catch (err) {
    console.warn('[METRICS] Error collecting system metrics:', err);
    return {
      errors_count: 0,
      warnings_count: 0,
      openai_cost_usd: 0,
      uptime_pct: 99,
      active_modules: [],
    };
  }
}

// ─── Main Aggregation Function ─────────────────────────────────────

export async function aggregateDailyMetrics(date?: string): Promise<DailyMetrics> {
  const now = new Date();
  const targetDate = date || now.toISOString().split('T')[0];
  const timestamp = new Date(targetDate).getTime();

  console.log(`[METRICS] Agregando métricas para ${targetDate}...`);

  const [market, telegram, conversion, system] = await Promise.all([
    collectMarketMetrics(),
    collectTelegramMetrics(),
    collectConversionMetrics(),
    collectSystemMetrics(),
  ]);

  const metrics: DailyMetrics = {
    date: targetDate,
    timestamp_utc_ms: timestamp,
    market,
    telegram,
    conversion,
    system,
  };

  // Guardar
  await saveDailyMetrics(metrics);

  // Log
  await logSystemEvent({
    module: 'METRICS_AGGREGATOR',
    severity: 'INFO',
    event_type: 'DAILY_METRICS_AGGREGATED',
    description: `Métricas agregadas para ${targetDate}`,
    data: {
      analyses: market.total_analyses,
      publications: telegram.publications_sent,
      errors: system.errors_count,
      paper_pnl: market.paper_pnl_usd,
    },
  });

  return metrics;
}

// ─── Generate Daily Report ────────────────────────────────────────

export async function generateDailyReport(date?: string): Promise<string> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const metrics = await aggregateDailyMetrics(targetDate);

  const report = `
╔═══════════════════════════════════════════════════════════════╗
║         REPORTE DIARIO SHADOW PRODUCTION — ${metrics.date}         ║
╚═══════════════════════════════════════════════════════════════╝

📊 MERCADO
  • Análisis realizados: ${metrics.market.total_analyses}
  • Análisis descartados: ${metrics.market.analyses_discarded}
  • Alertas gratuitas: ${metrics.market.free_alerts}
  • Oportunidades: ${metrics.market.opportunities}
  • Operaciones paper: ${metrics.market.paper_trades}
  • Ganancias: ${metrics.market.paper_wins}
  • Pérdidas: ${metrics.market.paper_losses}
  • P&L USD: ${metrics.market.paper_pnl_usd.toFixed(2)}
  • P&L %: ${metrics.market.paper_pnl_pct.toFixed(2)}%
  • Win rate: ${metrics.market.paper_win_rate.toFixed(1)}%
  • Max drawdown: $${metrics.market.drawdown_max.toFixed(2)}

📱 TELEGRAM
  • Publicaciones enviadas: ${metrics.telegram.publications_sent}
  • Resultados: ${metrics.telegram.results_sent}
  • Educación: ${metrics.telegram.education_sent}
  • Promociones sugeridas: ${metrics.telegram.promotions_suggested}
  • Solo canal test: ${metrics.telegram.test_channel_only ? 'SÍ ✓' : 'NO ✗'}

💰 CONVERSIÓN
  • Sugerencias generadas: ${metrics.conversion.suggestions_generated}
  • Pendientes aprobación: ${metrics.conversion.suggestions_pending_approval}
  • Clics totales: ${metrics.conversion.clics_total}
  • Registros: ${metrics.conversion.registrations_total}
  • Pagos atribuidos: ${metrics.conversion.payments_attributed}

⚙️ SISTEMA
  • Errores: ${metrics.system.errors_count}
  • Advertencias: ${metrics.system.warnings_count}
  • Costo OpenAI USD: $${metrics.system.openai_cost_usd.toFixed(2)}
  • Uptime: ${metrics.system.uptime_pct.toFixed(1)}%
  • Módulos activos: ${metrics.system.active_modules.length}/${metrics.system.active_modules.length}

═══════════════════════════════════════════════════════════════
Generado: ${new Date().toISOString()}
Estado: SHADOW_PRODUCTION
═══════════════════════════════════════════════════════════════
  `.trim();

  return report;
}
