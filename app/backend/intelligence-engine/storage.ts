import "server-only";

import { randomUUID } from "node:crypto";
import { backendDatabase } from "@/app/backend/core/database";

type JsonObject = Record<string, unknown>;

type CandleInput = {
  id?: string;
  symbol: string;
  timeframe: string;
  openTime: Date;
  closeTime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  spreadMin?: number | null;
  spreadMax?: number | null;
  spreadAvg?: number | null;
  source: string;
};

type TickInput = {
  id?: string;
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  midPrice: number;
  source: string;
  tickTime: Date;
  payload?: JsonObject;
};

type EconomicNewsInput = {
  id?: string;
  provider: string;
  eventId?: string;
  title: string;
  countryCode?: string;
  currency?: string;
  impact?: string;
  actualValue?: string;
  forecastValue?: string;
  previousValue?: string;
  publishedAt: Date;
  eventTime?: Date;
  tags?: string[];
  payload?: JsonObject;
};

type DataQualityReportInput = {
  id?: string;
  dataset: string;
  symbol?: string;
  timeframe?: string;
  dateFrom?: Date;
  dateTo?: Date;
  totalRows: number;
  missingRows: number;
  duplicateRows: number;
  invalidRows: number;
  latencyMsP95?: number;
  score?: number;
  status: string;
  details?: JsonObject;
  generatedAt: Date;
};

type EngineDecisionInput = {
  id?: string;
  decisionType: string;
  symbol?: string;
  timeframe?: string;
  decidedAt: Date;
  state: string;
  rationale?: string;
  payload?: JsonObject;
};

type OperationResultInput = {
  id?: string;
  decisionId?: string;
  symbol?: string;
  timeframe?: string;
  side?: string;
  status: string;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity?: number;
  pnl?: number;
  executedAt?: Date;
  closedAt?: Date;
  payload?: JsonObject;
};

type SystemVersionInput = {
  id?: string;
  component: string;
  version: string;
  buildHash?: string;
  releaseChannel?: string;
  metadata?: JsonObject;
  deployedAt: Date;
};

type SystemLogInput = {
  id?: string;
  module: string;
  level: string;
  message: string;
  context?: JsonObject;
  traceId?: string;
  loggedAt?: Date;
};

type CandleRow = {
  id: string;
  symbol: string;
  timeframe: string;
  open_time: Date;
  close_time: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  spread_min: string | null;
  spread_max: string | null;
  spread_avg: string | null;
  source: string;
  ingest_time: Date;
};

type TickRow = {
  id: string;
  symbol: string;
  bid: string;
  ask: string;
  spread: string;
  mid_price: string;
  source: string;
  tick_time: Date;
  ingest_time: Date;
  payload: JsonObject | null;
};

type SystemLogRow = {
  id: string;
  module: string;
  level: string;
  message: string;
  context: JsonObject | null;
  trace_id: string | null;
  logged_at: Date;
  ingest_time: Date;
};

export type CandleRecord = {
  id: string;
  symbol: string;
  timeframe: string;
  openTime: Date;
  closeTime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  spreadMin: number | null;
  spreadMax: number | null;
  spreadAvg: number | null;
  source: string;
  ingestTime: Date;
};

export type TickRecord = {
  id: string;
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  midPrice: number;
  source: string;
  tickTime: Date;
  ingestTime: Date;
  payload: JsonObject;
};

export type SystemLogRecord = {
  id: string;
  module: string;
  level: string;
  message: string;
  context: JsonObject;
  traceId?: string;
  loggedAt: Date;
  ingestTime: Date;
};

type DateRangeQuery = {
  from?: Date;
  to?: Date;
  limit?: number;
};

function clampLimit(value: number | undefined, fallback = 100, max = 5000): number {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.trunc(value), max));
}

function mapCandleRow(row: CandleRow): CandleRecord {
  return {
    id: row.id,
    symbol: row.symbol,
    timeframe: row.timeframe,
    openTime: new Date(row.open_time),
    closeTime: new Date(row.close_time),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume),
    spreadMin: row.spread_min === null ? null : Number(row.spread_min),
    spreadMax: row.spread_max === null ? null : Number(row.spread_max),
    spreadAvg: row.spread_avg === null ? null : Number(row.spread_avg),
    source: row.source,
    ingestTime: new Date(row.ingest_time),
  };
}

function mapTickRow(row: TickRow): TickRecord {
  return {
    id: row.id,
    symbol: row.symbol,
    bid: Number(row.bid),
    ask: Number(row.ask),
    spread: Number(row.spread),
    midPrice: Number(row.mid_price),
    source: row.source,
    tickTime: new Date(row.tick_time),
    ingestTime: new Date(row.ingest_time),
    payload: row.payload ?? {},
  };
}

function mapSystemLogRow(row: SystemLogRow): SystemLogRecord {
  return {
    id: row.id,
    module: row.module,
    level: row.level,
    message: row.message,
    context: row.context ?? {},
    traceId: row.trace_id ?? undefined,
    loggedAt: new Date(row.logged_at),
    ingestTime: new Date(row.ingest_time),
  };
}

export class IntelligenceEngineStorage {
  async upsertCandle(candle: CandleInput): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO ie_candles (
        id, symbol, timeframe, open_time, close_time,
        open, high, low, close, volume,
        spread_min, spread_max, spread_avg,
        source
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13,
        $14
      )
      ON CONFLICT (symbol, timeframe, open_time) DO UPDATE SET
        close_time = EXCLUDED.close_time,
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        spread_min = EXCLUDED.spread_min,
        spread_max = EXCLUDED.spread_max,
        spread_avg = EXCLUDED.spread_avg,
        source = EXCLUDED.source,
        ingest_time = NOW()
      `,
      [
        candle.id ?? randomUUID(),
        candle.symbol,
        candle.timeframe,
        candle.openTime,
        candle.closeTime,
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume ?? 0,
        candle.spreadMin ?? null,
        candle.spreadMax ?? null,
        candle.spreadAvg ?? null,
        candle.source,
      ]
    );
  }

  async upsertCandlesBatch(candles: CandleInput[]): Promise<void> {
    for (const candle of candles) {
      await this.upsertCandle(candle);
    }
  }

  async insertMarketTick(tick: TickInput): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO ie_market_ticks (
        id, symbol, bid, ask, spread, mid_price, source, tick_time, payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb
      )
      `,
      [
        tick.id ?? randomUUID(),
        tick.symbol,
        tick.bid,
        tick.ask,
        tick.spread,
        tick.midPrice,
        tick.source,
        tick.tickTime,
        JSON.stringify(tick.payload ?? {}),
      ]
    );
  }

  async insertEconomicNews(news: EconomicNewsInput): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO ie_economic_news (
        id, provider, event_id, title, country_code, currency, impact,
        actual_value, forecast_value, previous_value,
        published_at, event_time, tags, payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13::jsonb, $14::jsonb
      )
      ON CONFLICT (id) DO NOTHING
      `,
      [
        news.id ?? randomUUID(),
        news.provider,
        news.eventId ?? null,
        news.title,
        news.countryCode ?? null,
        news.currency ?? null,
        news.impact ?? null,
        news.actualValue ?? null,
        news.forecastValue ?? null,
        news.previousValue ?? null,
        news.publishedAt,
        news.eventTime ?? null,
        JSON.stringify(news.tags ?? []),
        JSON.stringify(news.payload ?? {}),
      ]
    );
  }

  async insertSystemLog(log: SystemLogInput): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO ie_system_logs (
        id, module, level, message, context, trace_id, logged_at
      ) VALUES (
        $1, $2, $3, $4, $5::jsonb, $6, $7
      )
      `,
      [
        log.id ?? randomUUID(),
        log.module,
        log.level,
        log.message,
        JSON.stringify(log.context ?? {}),
        log.traceId ?? null,
        log.loggedAt ?? new Date(),
      ]
    );
  }

  async insertDataQualityReport(report: DataQualityReportInput): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO ie_data_quality_reports (
        id, dataset, symbol, timeframe, date_from, date_to,
        total_rows, missing_rows, duplicate_rows, invalid_rows,
        latency_ms_p95, score, status, details, generated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14::jsonb, $15
      )
      `,
      [
        report.id ?? randomUUID(),
        report.dataset,
        report.symbol ?? null,
        report.timeframe ?? null,
        report.dateFrom ?? null,
        report.dateTo ?? null,
        report.totalRows,
        report.missingRows,
        report.duplicateRows,
        report.invalidRows,
        report.latencyMsP95 ?? null,
        report.score ?? null,
        report.status,
        JSON.stringify(report.details ?? {}),
        report.generatedAt,
      ]
    );
  }

  async insertEngineDecision(decision: EngineDecisionInput): Promise<string> {
    const id = decision.id ?? randomUUID();

    await backendDatabase.query(
      `
      INSERT INTO ie_engine_decisions (
        id, decision_type, symbol, timeframe, decided_at, state, rationale, payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb
      )
      `,
      [
        id,
        decision.decisionType,
        decision.symbol ?? null,
        decision.timeframe ?? null,
        decision.decidedAt,
        decision.state,
        decision.rationale ?? null,
        JSON.stringify(decision.payload ?? {}),
      ]
    );

    return id;
  }

  async insertOperationResult(result: OperationResultInput): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO ie_operation_results (
        id, decision_id, symbol, timeframe, side, status,
        entry_price, exit_price, stop_loss, take_profit,
        quantity, pnl, executed_at, closed_at, payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15::jsonb
      )
      `,
      [
        result.id ?? randomUUID(),
        result.decisionId ?? null,
        result.symbol ?? null,
        result.timeframe ?? null,
        result.side ?? null,
        result.status,
        result.entryPrice ?? null,
        result.exitPrice ?? null,
        result.stopLoss ?? null,
        result.takeProfit ?? null,
        result.quantity ?? null,
        result.pnl ?? null,
        result.executedAt ?? null,
        result.closedAt ?? null,
        JSON.stringify(result.payload ?? {}),
      ]
    );
  }

  async insertSystemVersion(version: SystemVersionInput): Promise<void> {
    await backendDatabase.query(
      `
      INSERT INTO ie_system_versions (
        id, component, version, build_hash, release_channel, metadata, deployed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7
      )
      ON CONFLICT (component, version) DO UPDATE SET
        build_hash = EXCLUDED.build_hash,
        release_channel = EXCLUDED.release_channel,
        metadata = EXCLUDED.metadata,
        deployed_at = EXCLUDED.deployed_at,
        created_at = NOW()
      `,
      [
        version.id ?? randomUUID(),
        version.component,
        version.version,
        version.buildHash ?? null,
        version.releaseChannel ?? null,
        JSON.stringify(version.metadata ?? {}),
        version.deployedAt,
      ]
    );
  }

  async getLatestCandles(params: { symbol: string; timeframe: string; limit?: number }): Promise<CandleRecord[]> {
    const limit = clampLimit(params.limit, 200, 5000);

    const result = await backendDatabase.query<CandleRow>(
      `
      SELECT *
      FROM ie_candles
      WHERE symbol = $1
        AND timeframe = $2
      ORDER BY open_time DESC
      LIMIT $3
      `,
      [params.symbol, params.timeframe, limit]
    );

    return result.rows.map(mapCandleRow);
  }

  async getCandleHistoryBySymbol(params: {
    symbol: string;
    timeframe?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<CandleRecord[]> {
    const limit = clampLimit(params.limit, 500, 10000);

    const result = await backendDatabase.query<CandleRow>(
      `
      SELECT *
      FROM ie_candles
      WHERE symbol = $1
        AND ($2::text IS NULL OR timeframe = $2)
        AND ($3::timestamptz IS NULL OR open_time >= $3)
        AND ($4::timestamptz IS NULL OR open_time <= $4)
      ORDER BY open_time DESC
      LIMIT $5
      `,
      [params.symbol, params.timeframe ?? null, params.from ?? null, params.to ?? null, limit]
    );

    return result.rows.map(mapCandleRow);
  }

  async getCandleHistoryByTimeframe(params: {
    timeframe: string;
    symbol?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<CandleRecord[]> {
    const limit = clampLimit(params.limit, 500, 10000);

    const result = await backendDatabase.query<CandleRow>(
      `
      SELECT *
      FROM ie_candles
      WHERE timeframe = $1
        AND ($2::text IS NULL OR symbol = $2)
        AND ($3::timestamptz IS NULL OR open_time >= $3)
        AND ($4::timestamptz IS NULL OR open_time <= $4)
      ORDER BY open_time DESC
      LIMIT $5
      `,
      [params.timeframe, params.symbol ?? null, params.from ?? null, params.to ?? null, limit]
    );

    return result.rows.map(mapCandleRow);
  }

  async getCandlesByDate(params: {
    date: Date;
    symbol?: string;
    timeframe?: string;
    limit?: number;
  }): Promise<CandleRecord[]> {
    const start = new Date(params.date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const limit = clampLimit(params.limit, 1000, 20000);

    const result = await backendDatabase.query<CandleRow>(
      `
      SELECT *
      FROM ie_candles
      WHERE open_time >= $1
        AND open_time < $2
        AND ($3::text IS NULL OR symbol = $3)
        AND ($4::text IS NULL OR timeframe = $4)
      ORDER BY open_time DESC
      LIMIT $5
      `,
      [start, end, params.symbol ?? null, params.timeframe ?? null, limit]
    );

    return result.rows.map(mapCandleRow);
  }

  async getSpreadHistory(params: { symbol: string } & DateRangeQuery): Promise<TickRecord[]> {
    const limit = clampLimit(params.limit, 1000, 20000);

    const result = await backendDatabase.query<TickRow>(
      `
      SELECT *
      FROM ie_market_ticks
      WHERE symbol = $1
        AND ($2::timestamptz IS NULL OR tick_time >= $2)
        AND ($3::timestamptz IS NULL OR tick_time <= $3)
      ORDER BY tick_time DESC
      LIMIT $4
      `,
      [params.symbol, params.from ?? null, params.to ?? null, limit]
    );

    return result.rows.map(mapTickRow);
  }

  async getLogsByModule(params: {
    module: string;
    level?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<SystemLogRecord[]> {
    const limit = clampLimit(params.limit, 500, 10000);

    const result = await backendDatabase.query<SystemLogRow>(
      `
      SELECT *
      FROM ie_system_logs
      WHERE module = $1
        AND ($2::text IS NULL OR level = $2)
        AND ($3::timestamptz IS NULL OR logged_at >= $3)
        AND ($4::timestamptz IS NULL OR logged_at <= $4)
      ORDER BY logged_at DESC
      LIMIT $5
      `,
      [params.module, params.level ?? null, params.from ?? null, params.to ?? null, limit]
    );

    return result.rows.map(mapSystemLogRow);
  }
}

export const intelligenceEngineStorage = new IntelligenceEngineStorage();
