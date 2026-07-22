/**
 * Shadow Flow V3 — Orquestador principal del Expediente Maestro V3
 * Coordina el ciclo completo: snapshot → calidad → idempotencia → AI → dispatcher → observer
 *
 * FILOSOFÍA: CARVIPIX construye el mejor expediente posible. ChatGPT razona. El disparador distribuye.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import type { IndicatorFramework } from "../../engine/data/indicatorFramework";
import type { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import type { Asset } from "../../engine/types/marketData";
import { getOpenAIRuntimeConfig } from "../openAIConfig";
import { getOpenAIRetryAfterMs, OpenAIAdapterV2 } from "./openAIAdapterV2";
import { CadpCostManager } from "./costManager";
import { MaestroV3SnapshotBuilder } from "./snapshotBuilderV3";
import { NarrativeContextBuilder } from "./narrativeContextBuilder";
import { ExecutiveSummaryBuilder } from "./executiveSummaryBuilder";
import { MaestroV3PromptBuilder } from "./promptBuilderV3";
import { MaestroV3Verifier } from "./verifierV3";
import { scenarioMemoryStore } from "./scenarioMemoryStore";
import { idempotencyStore } from "./idempotencyStore";
import { adaptiveScheduler } from "./schedulerAdaptativo";
import { disparadorModulos } from "./disparadorModulos";
import { paperTradeMonitor } from "./paperTradeMonitor";
import { observerV3 } from "./observerV3";
import { analysisStore } from "./analysisStore";
import { telegramNotificationService } from "./telegramNotificationService";
import { CadpMasterSignalBuilder } from "./masterSignalBuilder";
import { masterSignalStore } from "./masterSignalStore";
import { OpenAICircuitBreaker } from "./openAICircuitBreaker";
import type {
  CanonicalSymbol,
  PreAnalysisTriggerReason,
  ExpedienteMaestroV3,
} from "./typesMaestroV3";
import type { ScenarioMemoryEntry } from "./scenarioMemoryStore";

interface ShadowFlowV3Result {
  analysis_id: string;
  canonical_symbol: CanonicalSymbol;
  status: "COMPLETED" | "SKIPPED_BEFORE_AI" | "REUSED_PREVIOUS_ANALYSIS" | "AI_ERROR";
  decision: string | null;
  cost_usd: number;
  latency_ms: number;
}

function isClientAlertAsset(symbol: CanonicalSymbol): symbol is Asset {
  return symbol === "XAUUSD" || symbol === "EURUSD" || symbol === "GBPUSD" || symbol === "BTCUSD";
}

export class ShadowFlowV3 {
  private readonly snapshotBuilder: MaestroV3SnapshotBuilder;
  private readonly narrativeBuilder = new NarrativeContextBuilder();
  private readonly summaryBuilder = new ExecutiveSummaryBuilder();
  private readonly promptBuilder = new MaestroV3PromptBuilder();
  private readonly verifier = new MaestroV3Verifier();
  private readonly masterSignalBuilder = new CadpMasterSignalBuilder();
  private readonly openAI = new OpenAIAdapterV2();
  private readonly costManager = new CadpCostManager();
  private readonly openAICircuit = new OpenAICircuitBreaker();

  /** Expose pipeline for monitoring/data access */
  public readonly pipeline: MarketDataPipeline;
  public readonly indicators: IndicatorFramework;

  constructor(pipeline: MarketDataPipeline, indicators: IndicatorFramework) {
    this.pipeline = pipeline;
    this.indicators = indicators;
    this.snapshotBuilder = new MaestroV3SnapshotBuilder(pipeline, indicators);
  }

  async analyzeInstrument(
    canonical_symbol: CanonicalSymbol,
    trigger_reason: PreAnalysisTriggerReason,
  ): Promise<ShadowFlowV3Result> {
    const started = Date.now();
    const analysis_id = `anal-${canonical_symbol}-${Date.now()}-${randomUUID()}`;
    const signal_id = `sig-${canonical_symbol}-${Date.now()}-${randomUUID()}`;

    try {
      // ── PASO 1: Build snapshot (Secciones 1-13 + trigger)
      const { expediente: partialExpediente, idempotency_key } = await this.snapshotBuilder.build({
        analysis_id,
        signal_id,
        canonical_symbol,
        trigger_reason,
      });

      // ── PASO 2: Quality gate — ¿Debe skipearse antes de llamar a AI?
      if (partialExpediente.quality.skip_before_ai !== null) {
        const record = observerV3.recordSkipped({
          analysis_id,
          signal_id,
          canonical_symbol,
          skip: partialExpediente.quality.skip_before_ai,
          expediente: partialExpediente as ExpedienteMaestroV3,
        });

        // Record to analysis store
        analysisStore.record({
          analysis_id,
          signal_id,
          canonical_symbol,
          timestamp_utc_ms: partialExpediente.identity.timestamp_utc_ms,
          trigger_reason,
          expediente: partialExpediente as ExpedienteMaestroV3,
          prompt_text: "",
          prompt_hash: "",
          estimated_tokens: 0,
          respuesta_maestra: null,
          response_latency_ms: 0,
          response_cost_usd: 0,
          response_valid: false,
          dispatch_result: null,
          status: "SKIPPED_BEFORE_AI",
          skip_reason: partialExpediente.quality.skip_before_ai.skip_reason,
          paper_balance_before_usd: paperTradeMonitor.getAccountState().current_balance_usd,
          paper_balance_after_usd: paperTradeMonitor.getAccountState().current_balance_usd,
        });

        return {
          analysis_id,
          canonical_symbol,
          status: record.status as "SKIPPED_BEFORE_AI" | "REUSED_PREVIOUS_ANALYSIS",
          decision: null,
          cost_usd: 0,
          latency_ms: Date.now() - started,
        };
      }

      // ── PASO 3: Build Secciones 15-16 (narrativa + resumen ejecutivo)
      const narrative_context = this.narrativeBuilder.build(partialExpediente);
      const expedienteWithNarrative = { ...partialExpediente, narrative_context };
      const executive_summary = this.summaryBuilder.build(expedienteWithNarrative);
      const expediente: ExpedienteMaestroV3 = { ...expedienteWithNarrative, executive_summary };

      // ── PASO 4: Build prompt (16 secciones + Pregunta Maestra)
        const { prompt_text, prompt_hash } = this.promptBuilder.build(expediente);

      // ── PASO 5: Call OpenAI
      const config = getOpenAIRuntimeConfig();
      const aiStarted = Date.now();
      let aiLatency = 0;

      let rawResponse: unknown;
      let usage: { input_tokens: number; output_tokens: number; cached_tokens: number; reasoning_tokens: number; };

      if (!this.openAICircuit.allowRequest()) {
        return { analysis_id, canonical_symbol, status: "SKIPPED_BEFORE_AI", decision: null, cost_usd: 0, latency_ms: 0 };
      }

      try {
        const result = await this.openAI.analyze({
          promptText: prompt_text,
          responseSchemaName: "RespuestaMaestraV3",
          responseSchema: this.buildResponseSchema(),
          promptCacheKey: prompt_hash,
        });
        rawResponse = result.response;
        usage = {
          input_tokens: result.usage.promptTokens ?? 0,
          output_tokens: result.usage.completionTokens ?? 0,
          cached_tokens: 0,
          reasoning_tokens: 0,
        };
        aiLatency = Date.now() - aiStarted;
        this.openAICircuit.recordSuccess();
      } catch (err) {
        this.openAICircuit.recordFailure(getOpenAIRetryAfterMs(err));
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[ShadowFlowV3] OpenAI ERROR for ${canonical_symbol}: ${errorMsg}`);
        const record = observerV3.recordError({
          analysis_id, signal_id, canonical_symbol,
          expediente, prompt_sent: prompt_text,
          error_message: errorMsg,
          idempotency_key: idempotency_key.full_key,
          latency_ms: Date.now() - aiStarted,
        });

        // Record to analysis store
        analysisStore.record({
          analysis_id,
          signal_id,
          canonical_symbol,
          timestamp_utc_ms: expediente.identity.timestamp_utc_ms,
          trigger_reason,
          expediente,
          prompt_text,
          prompt_hash: "",
          estimated_tokens: 0,
          respuesta_maestra: null,
          response_latency_ms: aiLatency ?? 0,
          response_cost_usd: 0,
          response_valid: false,
          response_errors: [err instanceof Error ? err.message : String(err)],
          dispatch_result: null,
          status: "AI_ERROR",
          paper_balance_before_usd: paperTradeMonitor.getAccountState().current_balance_usd,
          paper_balance_after_usd: paperTradeMonitor.getAccountState().current_balance_usd,
        });

        return {
          analysis_id, canonical_symbol, status: "AI_ERROR",
          decision: null, cost_usd: 0, latency_ms: record.latency_ms,
        };
      }

      // ── PASO 6: Verify response
      const verification = this.verifier.verify(
        rawResponse,
        new Set(expediente.authorized_strategies.map(strategy => strategy.strategy_id)),
      );
      if (!verification.valid || !verification.repaired) {
        const record = observerV3.recordError({
          analysis_id, signal_id, canonical_symbol,
          expediente, prompt_sent: prompt_text,
          error_message: `VERIFICATION_FAILED: ${verification.errors.join(", ")}`,
          idempotency_key: idempotency_key.full_key,
          latency_ms: aiLatency!,
        });
        return {
          analysis_id, canonical_symbol, status: "AI_ERROR",
          decision: null, cost_usd: 0, latency_ms: record.latency_ms,
        };
      }

      const response = verification.repaired!;

      // ── PASO 7: Calculate cost
      const costEstimate = this.costManager.estimate(config.model, usage);
      const cost_usd = costEstimate.locally_estimated_cost_usd;

      // ── PASO 8: Attach metadata
      response._meta = {
        analysis_id,
        canonical_symbol,
        snapshot_utc: expediente.identity.timestamp_iso,
        model_used: config.model,
        tokens_in: usage.input_tokens,
        tokens_out: usage.output_tokens,
        tokens_cached: usage.cached_tokens,
        cost_usd_estimated: cost_usd,
        latency_ms: aiLatency!,
        prompt_version: expediente.identity.version_prompt,
        cadp_version: "maestro-v3",
        response_schema_version: "maestro_v3_response",
        human_review_required: true,
        auto_execution_eligible: false,
      };

      if (
        response.master_decision.decision === "ENTER_BUY"
        || response.master_decision.decision === "ENTER_SELL"
      ) {
        if (!isClientAlertAsset(canonical_symbol)) {
          throw new Error(`CLIENT_ALERT_ASSET_NOT_SUPPORTED:${canonical_symbol}`);
        }
        const masterSignal = this.masterSignalBuilder.buildV3({
          signalId: signal_id,
          analysisId: analysis_id,
          symbol: canonical_symbol,
          response,
        });
        masterSignalStore.save(masterSignal);
      }

      // ── PASO 9: Save to idempotency store
      idempotencyStore.register(idempotency_key.full_key, analysis_id);

      // ── PASO 10: Update paper trade monitor
        const _paperTradeOpened = paperTradeMonitor.openTrade(response, canonical_symbol, analysis_id);

      // ── PASO 11: Update scenario memory store
      const scenarioFirstSeen = scenarioMemoryStore.resolveScenarioFirstSeen(
        canonical_symbol,
        response.adaptive_state.scenario_classification,
        Date.now(),
      );

      const memoryEntry: ScenarioMemoryEntry = {
        analysis_id,
        signal_id,
        canonical_symbol,
        timestamp_iso: expediente.identity.timestamp_iso,
        timestamp_ms: expediente.identity.timestamp_utc_ms,
        decision: response.master_decision.decision,
        scenario_classification: response.adaptive_state.scenario_classification,
        probability_estimated: response.master_decision.probability_estimated,
        conviction: response.master_decision.conviction,
        order_plan: response.order_plan,
        adaptive_state: {
          proximity_to_entry: response.adaptive_state.proximity_to_entry,
          recheck_minutes: response.adaptive_state.recheck_minutes,
          watch_conditions: response.adaptive_state.watch_conditions,
          wake_up_triggers: response.adaptive_state.wake_up_triggers,
          missing_for_entry: response.adaptive_state.missing_for_entry,
        },
        scenario_type_key: `${canonical_symbol}:${response.adaptive_state.scenario_classification}`,
        scenario_first_seen_ms: scenarioFirstSeen,
        strategy_version: "1.0.0",
        prompt_version: expediente.identity.version_prompt,
      };
      scenarioMemoryStore.save(memoryEntry);

      // ── PASO 12: Update adaptive scheduler
      adaptiveScheduler.updateFromAdaptiveState(canonical_symbol, response.adaptive_state);

      // ── PASO 13: Dispatch to all modules (resilient — failed destinations don't block others)
      const paperAccount = paperTradeMonitor.getAccountState();
      const dispatchResult = disparadorModulos.dispatch(response, expediente, paperAccount);

      // ── PASO 13b: Send Telegram notification (resilient — failure doesn't block analysis)
      if (dispatchResult.output.telegram) {
        try {
          const telegramResult = await telegramNotificationService.sendTradeAlert(
            dispatchResult.output.telegram,
            canonical_symbol,
            response.master_decision.decision,
            dispatchResult.output.alerta_premium ?? undefined,
            {
              analysis_id,
              signal_id,
              event_id: `evt-${analysis_id}`,
              test_only: false,
            },
          );

          if (!telegramResult.success) {
            console.warn(
              `[ShadowFlow] Telegram send failed for ${canonical_symbol}: ${telegramResult.error}`,
            );
          } else if (telegramResult.skipped) {
            console.log(
              `[CommunicationEngine] Telegram skipped for ${canonical_symbol}`,
            );
          } else {
            console.log(
              `[ShadowFlow] Telegram sent for ${canonical_symbol} (${telegramResult.latency_ms}ms)`,
            );
          }
        } catch (err) {
          console.warn("[ShadowFlow] Telegram error:", err instanceof Error ? err.message : String(err));
          // Do NOT rethrow — analysis succeeds even if Telegram fails
        }
      }

      // ── PASO 14: Update observer
      const analysisRecord = observerV3.recordCompleted({
        analysis_id,
        signal_id,
        canonical_symbol,
        expediente,
        prompt_sent: prompt_text,
        response,
        idempotency_key: idempotency_key.full_key,
        cost_usd,
        latency_ms: aiLatency!,
      });

      observerV3.saveObservadorPayload(canonical_symbol, dispatchResult.output.observador);
      observerV3.updatePaperAccount(paperAccount);

      // Record to analysis store
      analysisStore.record({
        analysis_id,
        signal_id,
        canonical_symbol,
        timestamp_utc_ms: expediente.identity.timestamp_utc_ms,
        trigger_reason,
        expediente,
        prompt_text,
        prompt_hash,
        estimated_tokens: this.promptBuilder.build(expediente).estimated_tokens,
        pregunta_maestra: prompt_text.split("### PREGUNTA MAESTRA").at(-1)?.slice(0, 500) ?? "",
        respuesta_maestra: response,
        response_latency_ms: aiLatency!,
        response_cost_usd: cost_usd,
        response_valid: true,
        dispatch_result: dispatchResult,
        status: "COMPLETED",
        paper_trade_opened: _paperTradeOpened
          ? {
              trade_id: analysis_id,
              direction: response.master_decision.direction === "BUY" ? "BUY" : "SELL",
              entry_price: response.order_plan?.entry_price ?? 0,
              tp: response.order_plan?.take_profit ?? 0,
              sl: response.order_plan?.stop_loss ?? 0,
              timestamp_utc_ms: Date.now(),
            }
          : undefined,
        paper_balance_before_usd: 10000, // Initial account balance
        paper_balance_after_usd: paperAccount.current_balance_usd,
        paper_pnl_usd: paperAccount.current_balance_usd - 10000,
      });

      return {
        analysis_id,
        canonical_symbol,
        status: "COMPLETED",
        decision: response.master_decision.decision,
        cost_usd,
        latency_ms: analysisRecord.latency_ms,
      };

    } catch (err) {
      this.openAICircuit.recordFailure();
      return {
        analysis_id,
        canonical_symbol,
        status: "AI_ERROR",
        decision: null,
        cost_usd: 0,
        latency_ms: Date.now() - started,
      };
    }
  }

  isCircuitOpen(): boolean {
    return this.openAICircuit.isBlockingRequests();
  }

  getCircuitState(): ReturnType<OpenAICircuitBreaker["getSnapshot"]> {
    return this.openAICircuit.getSnapshot();
  }

  private buildResponseSchema(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        master_decision: {
          type: "object",
          additionalProperties: false,
          properties: {
            decision: { type: "string" },
            direction: { type: ["string", "null"] },
            strategy_selected: { type: ["string", "null"] },
            conviction: { type: "string" },
            probability_estimated: { type: ["number", "null"] },
            probability_basis: { type: ["string", "null"] },
          },
          required: [
            "decision",
            "direction",
            "strategy_selected",
            "conviction",
            "probability_estimated",
            "probability_basis",
          ],
        },
        analysis_private: {
          type: "object",
          additionalProperties: false,
          properties: {
            analysis_summary: { type: "string" },
            decisive_evidence: { type: "array", items: { type: "string" } },
            opposing_evidence: { type: "array", items: { type: "string" } },
            primary_risk: { type: "string" },
            missing_condition: { type: ["string", "null"] },
            market_context_observed: { type: "string" },
            what_must_change: { type: "string" },
            probability_detail: {
              type: "object",
              additionalProperties: false,
              properties: {
                estimated: { type: ["number", "null"] },
                basis: { type: ["string", "null"] },
                confidence_in_estimate: { type: ["string", "null"] },
                disclaimer: { type: "string" },
              },
              required: ["estimated", "basis", "confidence_in_estimate", "disclaimer"],
            },
          },
          required: [
            "analysis_summary",
            "decisive_evidence",
            "opposing_evidence",
            "primary_risk",
            "missing_condition",
            "market_context_observed",
            "what_must_change",
            "probability_detail",
          ],
        },
        analysis_public: {
          type: "object",
          additionalProperties: false,
          properties: {
            market_visual_state: { type: "string" },
            supporting_facts: { type: "array", items: { type: "string" } },
            public_summary: { type: "string" },
            action_taken: { type: "string" },
            public_warning: { type: ["string", "null"] },
          },
          required: [
            "market_visual_state",
            "supporting_facts",
            "public_summary",
            "action_taken",
            "public_warning",
          ],
        },
        order_plan: {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                entry_type: { type: "string" },
                entry_price: { type: ["number", "null"] },
                entry_zone_min: { type: ["number", "null"] },
                entry_zone_max: { type: ["number", "null"] },
                stop_loss: { type: ["number", "null"] },
                stop_loss_anchor: { type: ["string", "null"] },
                take_profit: { type: ["number", "null"] },
                take_profit_anchor: { type: ["string", "null"] },
                risk_reward_ratio: { type: ["number", "null"] },
                validity_minutes: { type: ["number", "null"] },
                cancellation_condition: { type: ["string", "null"] },
              },
              required: [
                "entry_type",
                "entry_price",
                "entry_zone_min",
                "entry_zone_max",
                "stop_loss",
                "stop_loss_anchor",
                "take_profit",
                "take_profit_anchor",
                "risk_reward_ratio",
                "validity_minutes",
                "cancellation_condition",
              ],
            },
            { type: "null" },
          ],
        },
        adaptive_state: {
          type: "object",
          additionalProperties: false,
          properties: {
            proximity_to_entry: { type: "string" },
            recheck_minutes: { type: "number" },
            watch_conditions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  condition: { type: "string" },
                  level: { type: ["number", "null"] },
                  timeframe: { type: ["string", "null"] },
                },
                required: ["condition", "level", "timeframe"],
              },
            },
            wake_up_triggers: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  trigger: { type: "string" },
                  level: { type: ["number", "null"] },
                  description: { type: "string" },
                },
                required: ["trigger", "level", "description"],
              },
            },
            missing_for_entry: { type: ["string", "null"] },
            scenario_classification: { type: "string" },
          },
          required: [
            "proximity_to_entry",
            "recheck_minutes",
            "watch_conditions",
            "wake_up_triggers",
            "missing_for_entry",
            "scenario_classification",
          ],
        },
        analyst_observations: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            scenario_narrative: { type: "string" },
            key_observation: { type: ["string", "null"] },
          },
          required: ["summary", "scenario_narrative", "key_observation"],
        },
      },
      required: ["master_decision", "analysis_private", "analysis_public", "order_plan", "adaptive_state", "analyst_observations"],
      additionalProperties: false,
    };
  }
}
