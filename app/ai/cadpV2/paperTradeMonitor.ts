/**
 * Paper Trade Monitor — Expediente Maestro V3
 * Cuenta simulada de USD 10,000. Seguimiento automático con precios de Twelve Data.
 * Completamente separado de estadísticas reales y demo de MT5.
 */

import type {
  CanonicalSymbol,
  PaperTrade,
  PaperAccountState,
  RespuestaMaestraV3,
} from "./typesMaestroV3";
import { getInstrument } from "./instrumentRegistry";

const INITIAL_BALANCE_USD = 10_000;
const RISK_PER_TRADE_PCT = 1; // 1% risk per trade
const OPERATION_EXPIRY_MINUTES = 240; // 4 hours max before EXPIRED

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Pips between two prices for a given instrument */
function calcPips(priceA: number, priceB: number, pipValue: number): number {
  return Math.abs(priceA - priceB) / pipValue;
}

/** Estimated USD P&L for a paper trade (simplified — no lot sizing without broker) */
function estimatePnlUsd(pips: number, _direction: "BUY" | "SELL", result: "WIN" | "LOSS", balance: number): number {
  const riskUsd = balance * (RISK_PER_TRADE_PCT / 100);
  // For simplicity, assume 1R = risk amount. Accurate lot sizing requires broker.
  return result === "WIN" ? riskUsd : -riskUsd;
}

export class PaperTradeMonitor {
  private trades = new Map<string, PaperTrade>();
  private account: PaperAccountState = {
    initial_balance_usd: INITIAL_BALANCE_USD,
    current_balance_usd: INITIAL_BALANCE_USD,
    equity_usd: INITIAL_BALANCE_USD,
    floating_pnl_usd: 0,
    daily_pnl_usd: 0,
    total_pnl_usd: 0,
    open_trades: [],
    closed_trades: [],
    win_count: 0,
    loss_count: 0,
    expired_count: 0,
    win_rate: null,
    avg_rr_achieved: null,
    max_drawdown_usd: 0,
    drawdown_pct: 0,
    openai_cost_total_usd: 0,
    last_updated: new Date().toISOString(),
  };
  private dailyResetDate: string = new Date().toISOString().slice(0, 10);

  /** Called when a new ENTER signal arrives from the Respuesta Maestra */
  openTrade(
    response: RespuestaMaestraV3,
    canonical_symbol: CanonicalSymbol,
    analysis_id: string,
  ): PaperTrade | null {
    const { master_decision, order_plan } = response;

    if (
      (master_decision.decision !== "ENTER_BUY" && master_decision.decision !== "ENTER_SELL")
      || !order_plan
      || order_plan.stop_loss === null
      || order_plan.take_profit === null
    ) {
      return null;
    }

    const direction = master_decision.decision === "ENTER_BUY" ? "BUY" : "SELL";
    const entryPrice = order_plan.entry_price ?? (order_plan.entry_zone_min ?? 0 + (order_plan.entry_zone_max ?? 0)) / 2;

    const trade: PaperTrade = {
      paper_trade_id: generateId("ptrade"),
      analysis_id,
      canonical_symbol,
      direction,
      entry_price: entryPrice,
      stop_loss: order_plan.stop_loss,
      take_profit: order_plan.take_profit,
      risk_reward_ratio: order_plan.risk_reward_ratio ?? 0,
      opened_at: new Date().toISOString(),
      closed_at: null,
      exit_price: null,
      result: "OPEN",
      pnl_pips: null,
      pnl_usd: null,
      rr_achieved: null,
      close_reason: null,
      paper_spread_note: "NOT_BROKER_VERIFIED",
    };

    this.trades.set(trade.paper_trade_id, trade);
    this.syncAccountState();
    return trade;
  }

  /** Called every 5-minute tick with current price from Twelve Data */
  tick(currentPrices: Partial<Record<CanonicalSymbol, number>>, openaiCostUsd = 0): void {
    const nowMs = Date.now();
    this.account.openai_cost_total_usd += openaiCostUsd;

    for (const [id, trade] of this.trades.entries()) {
      if (trade.result !== "OPEN") continue;

      const currentPrice = currentPrices[trade.canonical_symbol];
      if (currentPrice === undefined) continue;

      const instrument = getInstrument(trade.canonical_symbol);
      const pipValue = instrument.pip_value;

      // Check TP hit
      const tpHit = trade.direction === "BUY"
        ? currentPrice >= trade.take_profit
        : currentPrice <= trade.take_profit;

      // Check SL hit
      const slHit = trade.direction === "BUY"
        ? currentPrice <= trade.stop_loss
        : currentPrice >= trade.stop_loss;

      // Check expiry
      const openedMs = new Date(trade.opened_at).getTime();
      const elapsed = (nowMs - openedMs) / 60000;
      const expired = elapsed >= OPERATION_EXPIRY_MINUTES;

      if (tpHit || slHit || expired) {
        const exitPrice = tpHit ? trade.take_profit : slHit ? trade.stop_loss : currentPrice;
        const result: "WIN" | "LOSS" | "EXPIRED" = tpHit ? "WIN" : slHit ? "LOSS" : "EXPIRED";
        const signMultiplier = (trade.direction === "BUY" ? 1 : -1);
        const pnlPips = (exitPrice - trade.entry_price) / pipValue * signMultiplier;
        const pnlUsd = estimatePnlUsd(Math.abs(pnlPips), trade.direction, tpHit ? "WIN" : "LOSS", this.account.current_balance_usd);

        const slPips = Math.abs(trade.entry_price - trade.stop_loss) / pipValue;
        const _tpPips = Math.abs(trade.take_profit - trade.entry_price) / pipValue;
        const rrAchieved = slPips > 0 ? pnlPips / slPips : null;

        trade.closed_at = new Date().toISOString();
        trade.exit_price = exitPrice;
        trade.result = result;
        trade.pnl_pips = pnlPips;
        trade.pnl_usd = pnlUsd;
        trade.rr_achieved = rrAchieved;
        trade.close_reason = tpHit ? "TP_HIT" : slHit ? "SL_HIT" : "EXPIRED";

        if (result === "WIN") this.account.win_count++;
        else if (result === "LOSS") this.account.loss_count++;
        else this.account.expired_count++;

        this.account.current_balance_usd += pnlUsd;
        this.account.total_pnl_usd += pnlUsd;
        this.account.daily_pnl_usd += pnlUsd;

        const drawdown = INITIAL_BALANCE_USD - this.account.current_balance_usd;
        if (drawdown > this.account.max_drawdown_usd) {
          this.account.max_drawdown_usd = drawdown;
          this.account.drawdown_pct = (drawdown / INITIAL_BALANCE_USD) * 100;
        }
      }
    }

    // Reset daily P&L if new day
    const todayDate = new Date().toISOString().slice(0, 10);
    if (todayDate !== this.dailyResetDate) {
      this.account.daily_pnl_usd = 0;
      this.dailyResetDate = todayDate;
    }

    this.syncAccountState();
  }

  private syncAccountState(): void {
    const open = Array.from(this.trades.values()).filter(t => t.result === "OPEN");
    const closed = Array.from(this.trades.values()).filter(t => t.result !== "OPEN");

    this.account.open_trades = open;
    this.account.closed_trades = closed.slice(-50); // Keep last 50 closed

    const totalCompleted = this.account.win_count + this.account.loss_count;
    this.account.win_rate = totalCompleted > 0 ? this.account.win_count / totalCompleted : null;

    const rrValues = closed
      .filter(t => t.rr_achieved !== null)
      .map(t => t.rr_achieved as number);
    this.account.avg_rr_achieved = rrValues.length > 0
      ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length
      : null;

    // Floating P&L (simplified — no lot size available without broker)
    this.account.floating_pnl_usd = 0; // Cannot calculate accurately without broker
    this.account.equity_usd = this.account.current_balance_usd + this.account.floating_pnl_usd;
    this.account.last_updated = new Date().toISOString();
  }

  getAccountState(): PaperAccountState {
    return { ...this.account };
  }

  getOpenTrades(): PaperTrade[] {
    return Array.from(this.trades.values()).filter(t => t.result === "OPEN");
  }

  getClosedTrades(limit = 50): PaperTrade[] {
    return Array.from(this.trades.values())
      .filter(t => t.result !== "OPEN")
      .slice(-limit);
  }

  getTradeById(id: string): PaperTrade | null {
    return this.trades.get(id) ?? null;
  }
}

export const paperTradeMonitor = new PaperTradeMonitor();
