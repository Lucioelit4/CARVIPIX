/**
 * Idempotency Store — Expediente Maestro V3
 * Evita análisis duplicados del mismo contexto.
 * Clave: símbolo + timestamps de velas + strategy_version + prompt_version + scenario_version + relevant_event_hash
 */

import { createHash } from "node:crypto";
import type { CanonicalSymbol, IdempotencyKey } from "./typesMaestroV3";

export interface RelevantEventData {
  news_event_ids: string[];
  level_reached: number | null;
  atr_spike: boolean;
  trade_closed_id: string | null;
}

function buildRelevantEventHash(data: RelevantEventData): string {
  const raw = JSON.stringify({
    n: data.news_event_ids.sort(),
    l: data.level_reached,
    a: data.atr_spike,
    t: data.trade_closed_id,
  });
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function buildFullKey(
  symbol: CanonicalSymbol,
  tsH1: number | null,
  tsM30: number | null,
  tsM5: number | null,
  strategyVersion: string,
  promptVersion: string,
  scenarioVersion: number,
  eventHash: string,
): string {
  return [
    symbol,
    String(tsH1 ?? 0),
    String(tsM30 ?? 0),
    String(tsM5 ?? 0),
    strategyVersion,
    promptVersion,
    `sv${scenarioVersion}`,
    eventHash,
  ].join(":");
}

interface StoredEntry {
  full_key: string;
  created_at: number;
  analysis_id: string;
}

export class IdempotencyStore {
  /** In-memory store. Entries expire after TTL to bound memory growth. */
  private readonly store = new Map<string, StoredEntry>();
  /** Scenario version counter per canonical symbol */
  private readonly scenarioVersions = new Map<CanonicalSymbol, number>();
  /** TTL for idempotency entries: 2 hours */
  private readonly ttlMs = 2 * 60 * 60 * 1000;

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.created_at > this.ttlMs) {
        this.store.delete(key);
      }
    }
  }

  /** Build idempotency key for a given analysis context */
  buildKey(params: {
    canonical_symbol: CanonicalSymbol;
    last_closed_h1_timestamp: number | null;
    last_closed_m30_timestamp: number | null;
    last_closed_m5_timestamp: number | null;
    strategy_version: string;
    prompt_version: string;
    relevant_event_data: RelevantEventData;
  }): IdempotencyKey {
    const scenarioVersion = this.scenarioVersions.get(params.canonical_symbol) ?? 0;
    const eventHash = buildRelevantEventHash(params.relevant_event_data);

    const full_key = buildFullKey(
      params.canonical_symbol,
      params.last_closed_h1_timestamp,
      params.last_closed_m30_timestamp,
      params.last_closed_m5_timestamp,
      params.strategy_version,
      params.prompt_version,
      scenarioVersion,
      eventHash,
    );

    return {
      canonical_symbol: params.canonical_symbol,
      last_closed_h1_timestamp: params.last_closed_h1_timestamp,
      last_closed_m30_timestamp: params.last_closed_m30_timestamp,
      last_closed_m5_timestamp: params.last_closed_m5_timestamp,
      strategy_version: params.strategy_version,
      prompt_version: params.prompt_version,
      scenario_version: scenarioVersion,
      relevant_event_hash: eventHash,
      full_key,
    };
  }

  /** Check if analysis with this key already exists */
  exists(fullKey: string): boolean {
    this.prune();
    return this.store.has(fullKey);
  }

  /** Register a completed analysis */
  register(fullKey: string, analysisId: string): void {
    this.store.set(fullKey, { full_key: fullKey, created_at: Date.now(), analysis_id: analysisId });
  }

  /**
   * Increment scenario version for a symbol.
   * Called when a "wake-up event" occurs that merits a new analysis
   * even though candle timestamps haven't changed.
   */
  incrementScenarioVersion(symbol: CanonicalSymbol): number {
    const current = this.scenarioVersions.get(symbol) ?? 0;
    const next = current + 1;
    this.scenarioVersions.set(symbol, next);
    return next;
  }

  getScenarioVersion(symbol: CanonicalSymbol): number {
    return this.scenarioVersions.get(symbol) ?? 0;
  }
}

export const idempotencyStore = new IdempotencyStore();
