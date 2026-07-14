import { randomUUID } from "node:crypto";
import { CadpShadowFlow } from "@/app/ai/cadpV2/shadowFlow";
import type { CadpAnalysisRequestV2, CadpShadowSignal } from "@/app/ai/cadpV2/types";
import { masterSignalStore } from "@/app/ai/cadpV2/masterSignalStore";
import { CadpSnapshotBuilder } from "@/app/ai/cadpV2/snapshotBuilder";
import { IndicatorFramework } from "@/app/engine/data/indicatorFramework";
import { MarketDataPipeline } from "@/app/engine/data/marketDataPipeline";
import { MarketDataReadinessGate } from "@/app/engine/data/marketDataReadinessGate";
import type { Asset } from "@/app/engine/types/marketData";
import type { EcosystemServiceLayer } from "../contracts";

type RealSignalDecision =
  | "ENTER_BUY"
  | "ENTER_SELL"
  | "CONDITIONAL_ENTRY"
  | "WAIT"
  | "NO_TRADE"
  | "DATA_INSUFFICIENT"
  | "ENTRY_MISSED"
  | "NEWS_VERIFICATION_REQUIRED";

type RealSignalLifecycleStatus =
  | "CREATED"
  | "CONDITIONAL"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "TP_HIT"
  | "SL_HIT"
  | "CLOSED";

export type ExecutionEngineStageName =
  | "READINESS_GATE"
  | "SNAPSHOT"
  | "CADP_OPENAI"
  | "MASTER_SIGNAL"
  | "LIFECYCLE"
  | "DELIVERY"
  | "DISTRIBUTION_AUDIT";

export type ExecutionEngineStageStatus = "STARTED" | "COMPLETED" | "FAILED" | "SKIPPED_DUPLICATE";
export type ExecutionEngineRunStatus = "COMPLETED" | "FAILED" | "SKIPPED_DUPLICATE";

export interface ExecutionEngineTransitionEvent {
  runId: string;
  stage: ExecutionEngineStageName;
  status: ExecutionEngineStageStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionEngineInput {
  analysisId: string;
  signalId: string;
  symbol: Asset;
  brokerSymbol: string;
  signalVersion: string;
  runId?: string;
}

export interface ExecutionEngineResult {
  runId: string;
  status: ExecutionEngineRunStatus;
  dedupeKey: string;
  snapshotId?: string;
  signalId?: string;
  analysisId: string;
  events: ExecutionEngineTransitionEvent[];
  failedStage?: ExecutionEngineStageName;
  errorCode?: string;
  errorMessage?: string;
}

export interface ExecutionReadinessResult {
  pass: boolean;
  reasons: string[];
  details?: Record<string, unknown>;
}

export interface ExecutionReadinessPort {
  check(input: ExecutionEngineInput): Promise<ExecutionReadinessResult>;
}

export interface ExecutionSnapshotPort {
  build(input: ExecutionEngineInput): Promise<{ request: CadpAnalysisRequestV2; snapshotId: string }>;
}

export interface ExecutionCadpPort {
  analyze(input: ExecutionEngineInput): Promise<{ signal: CadpShadowSignal; validationErrors: string[] }>;
}

export interface ExecutionMasterSignalPort {
  ensurePublished(input: { signal: CadpShadowSignal }): Promise<void>;
}

export interface ExecutionLifecyclePort {
  register(input: { signal: CadpShadowSignal }): Promise<unknown | null>;
}

export interface ExecutionDeliveryPort {
  deliver(input: { signalId: string; analysisId: string; signalVersion: string }): Promise<void>;
}

export interface ExecutionDistributionPort {
  fanOut(input: { signalId: string; analysisId: string }): Promise<void>;
}

export interface ExecutionTransitionSink {
  append(event: ExecutionEngineTransitionEvent): Promise<void>;
  listByRun(runId: string): Promise<ExecutionEngineTransitionEvent[]>;
}

export interface ExecutionEnginePorts {
  readiness: ExecutionReadinessPort;
  snapshot: ExecutionSnapshotPort;
  cadp: ExecutionCadpPort;
  masterSignal: ExecutionMasterSignalPort;
  lifecycle: ExecutionLifecyclePort;
  delivery: ExecutionDeliveryPort;
  distribution: ExecutionDistributionPort;
  transitions: ExecutionTransitionSink;
}

class StageExecutionError extends Error {
  constructor(
    readonly stage: ExecutionEngineStageName,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export class InMemoryExecutionTransitionSink implements ExecutionTransitionSink {
  private readonly events: ExecutionEngineTransitionEvent[] = [];

  async append(event: ExecutionEngineTransitionEvent): Promise<void> {
    this.events.push(event);
    if (this.events.length > 5000) {
      this.events.splice(0, this.events.length - 5000);
    }
  }

  async listByRun(runId: string): Promise<ExecutionEngineTransitionEvent[]> {
    return this.events.filter((event) => event.runId === runId);
  }
}

export class CarvipixExecutionEngine {
  private readonly processed = new Set<string>();

  constructor(private readonly ports: ExecutionEnginePorts) {}

  async run(input: ExecutionEngineInput): Promise<ExecutionEngineResult> {
    const runId = input.runId ?? `carvipix-run-${randomUUID()}`;
    const events: ExecutionEngineTransitionEvent[] = [];

    const appendTransition = async (
      stage: ExecutionEngineStageName,
      status: ExecutionEngineStageStatus,
      startedMs: number,
      errorCode?: string,
      errorMessage?: string,
      metadata?: Record<string, unknown>
    ) => {
      const event: ExecutionEngineTransitionEvent = {
        runId,
        stage,
        status,
        startedAt: new Date(startedMs).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Math.max(0, Date.now() - startedMs),
        errorCode,
        errorMessage,
        metadata,
      };
      events.push(event);
      await this.ports.transitions.append(event);
    };

    const runStage = async <T>(
      stage: ExecutionEngineStageName,
      fn: () => Promise<T>,
      metadata?: Record<string, unknown>
    ): Promise<T> => {
      const startedMs = Date.now();
      await appendTransition(stage, "STARTED", startedMs, undefined, undefined, metadata);
      try {
        const result = await fn();
        await appendTransition(stage, "COMPLETED", startedMs, undefined, undefined, metadata);
        return result;
      } catch (error) {
        const normalizedError = error instanceof StageExecutionError
          ? error
          : new StageExecutionError(
            stage,
            "UNEXPECTED_STAGE_FAILURE",
            error instanceof Error ? error.message : "Unknown execution stage failure"
          );
        const code = normalizedError.code;
        const message = normalizedError.message;
        await appendTransition(stage, "FAILED", startedMs, code, message, metadata);
        throw normalizedError;
      }
    };

    let snapshotId: string | undefined;
    let dedupeKey = `${input.analysisId}:${input.signalId}:pending_snapshot`;

    try {
      const readiness = await runStage("READINESS_GATE", async () => this.ports.readiness.check(input), {
        symbol: input.symbol,
        brokerSymbol: input.brokerSymbol,
      });

      if (!readiness.pass) {
        throw new StageExecutionError(
          "READINESS_GATE",
          "DATA_NOT_READY",
          `Readiness gate blocked execution: ${readiness.reasons.join("|")}`
        );
      }

      const snapshot = await runStage("SNAPSHOT", async () => this.ports.snapshot.build(input));
      snapshotId = snapshot.snapshotId;
      dedupeKey = `${input.analysisId}:${input.signalId}:${snapshot.snapshotId}`;

      if (this.processed.has(dedupeKey)) {
        const startedMs = Date.now();
        await appendTransition("SNAPSHOT", "SKIPPED_DUPLICATE", startedMs, undefined, undefined, {
          snapshotId: snapshot.snapshotId,
          analysisId: input.analysisId,
          signalId: input.signalId,
        });
        return {
          runId,
          status: "SKIPPED_DUPLICATE",
          dedupeKey,
          snapshotId,
          signalId: input.signalId,
          analysisId: input.analysisId,
          events,
        };
      }

      const cadp = await runStage("CADP_OPENAI", async () => this.ports.cadp.analyze(input), {
        snapshotId,
      });

      await runStage("MASTER_SIGNAL", async () => this.ports.masterSignal.ensurePublished({ signal: cadp.signal }), {
        signalId: cadp.signal.signal_id,
        analysisId: cadp.signal.analysis_id,
      });

      await runStage("LIFECYCLE", async () => this.ports.lifecycle.register({ signal: cadp.signal }), {
        signalId: cadp.signal.signal_id,
        analysisId: cadp.signal.analysis_id,
      });

      await runStage(
        "DELIVERY",
        async () =>
          this.ports.delivery.deliver({
            signalId: cadp.signal.signal_id,
            analysisId: cadp.signal.analysis_id,
            signalVersion: input.signalVersion,
          }),
        {
          signalId: cadp.signal.signal_id,
          analysisId: cadp.signal.analysis_id,
          signalVersion: input.signalVersion,
        }
      );

      await runStage(
        "DISTRIBUTION_AUDIT",
        async () => this.ports.distribution.fanOut({ signalId: cadp.signal.signal_id, analysisId: cadp.signal.analysis_id }),
        {
          signalId: cadp.signal.signal_id,
          analysisId: cadp.signal.analysis_id,
        }
      );

      this.processed.add(dedupeKey);

      return {
        runId,
        status: "COMPLETED",
        dedupeKey,
        snapshotId,
        signalId: cadp.signal.signal_id,
        analysisId: input.analysisId,
        events,
      };
    } catch (error) {
      const err = error instanceof StageExecutionError ? error : new StageExecutionError("CADP_OPENAI", "UNEXPECTED_FAILURE", error instanceof Error ? error.message : "Unexpected execution error");
      return {
        runId,
        status: "FAILED",
        dedupeKey,
        snapshotId,
        signalId: input.signalId,
        analysisId: input.analysisId,
        events,
        failedStage: err.stage,
        errorCode: err.code,
        errorMessage: err.message,
      };
    }
  }
}

function lifecycleDecisionFromSignal(signal: CadpShadowSignal): RealSignalDecision {
  if (signal.direction === "BUY") return "ENTER_BUY";
  if (signal.direction === "SELL") return "ENTER_SELL";
  return "WAIT";
}

function lifecycleStatusFromDecision(decision: RealSignalDecision): RealSignalLifecycleStatus {
  if (decision === "ENTER_BUY" || decision === "ENTER_SELL") {
    return "CREATED";
  }
  return "CLOSED";
}

export function buildDefaultExecutionEnginePorts(input: {
  ecosystemServices: EcosystemServiceLayer;
  pipeline?: MarketDataPipeline;
  indicators?: IndicatorFramework;
  transitions?: ExecutionTransitionSink;
}): ExecutionEnginePorts {
  const pipeline = input.pipeline ?? new MarketDataPipeline();
  const indicators = input.indicators ?? new IndicatorFramework();
  const snapshotBuilder = new CadpSnapshotBuilder(pipeline, indicators);
  const shadowFlow = new CadpShadowFlow(snapshotBuilder);
  const readinessGate = new MarketDataReadinessGate();

  return {
    readiness: {
      check: async (request) => {
        const tick = pipeline.getLatestTick(request.symbol);
        const timeframeSeries = (["1H", "30M", "5M"] as const).map((tf) => {
          const candles = pipeline.getRecentCandles(request.symbol, tf, 360);
          const latest = indicators.getLatest(request.symbol, tf);
          return {
            timeframe: tf,
            closedCandles: candles.filter((c) => c.complete).length,
            latestTimestamp: candles.filter((c) => c.complete).at(-1)?.timestamp ?? null,
            indicators: {
              ema200: latest?.ema200 ?? 0,
              atr: latest?.atr ?? 0,
              adx: latest?.adx ?? 0,
            },
            chartImagePresent: candles.length > 0,
            candles,
          };
        });

        const evaluated = readinessGate.evaluate({
          asset: request.symbol,
          snapshotUtc: new Date().toISOString(),
          tick,
          requiredTimeframes: timeframeSeries,
        });

        return {
          pass: evaluated.pass,
          reasons: evaluated.reasons,
          details: {
            status: evaluated.status,
            snapshotAgeMs: evaluated.details.snapshotAgeMs,
            tickAgeMs: evaluated.details.tickAgeMs,
            marketActive: evaluated.details.marketActive,
          },
        };
      },
    },
    snapshot: {
      build: async (request) => {
        const built = snapshotBuilder.build({
          analysisId: request.analysisId,
          symbol: request.symbol,
          brokerSymbol: request.brokerSymbol,
        });
        return {
          request: built,
          snapshotId: built.final_context_hash,
        };
      },
    },
    cadp: {
      analyze: async (request) => {
        try {
          const result = await shadowFlow.build({
            analysisId: request.analysisId,
            signalId: request.signalId,
            symbol: request.symbol,
            brokerSymbol: request.brokerSymbol,
          });
          return {
            signal: result.signal,
            validationErrors: result.validation.errors,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown CADP/OpenAI failure";
          const code = message.includes("OPENAI") ? "OPENAI_DOWN" : message.includes("TIMEOUT") ? "OPENAI_TIMEOUT" : "CADP_FAILURE";
          throw new StageExecutionError("CADP_OPENAI", code, message);
        }
      },
    },
    masterSignal: {
      ensurePublished: async ({ signal }) => {
        const latest = masterSignalStore.getLatest();
        if (!latest || latest.signal_id !== signal.signal_id || latest.analysis_id !== signal.analysis_id) {
          throw new StageExecutionError("MASTER_SIGNAL", "MASTER_SIGNAL_HANDOFF_FAILED", "Master signal handoff integrity check failed");
        }
      },
    },
    lifecycle: {
      register: async ({ signal }) => {
        const lifecycleModule = await import("../services/real-signal-lifecycle-service");
        const lifecycleService = lifecycleModule.realSignalLifecycleService;
        const decision = lifecycleDecisionFromSignal(signal);
        return lifecycleService.upsertSignal({
          signalId: signal.signal_id,
          analysisId: signal.analysis_id,
          symbol: signal.symbol,
          decision,
          entry: signal.entry,
          stopLoss: signal.stop_loss,
          takeProfit: signal.take_profit,
          strategyId: signal.selected_strategy_id,
          status: lifecycleStatusFromDecision(decision),
          source: "CARVIPIX_EXECUTION_ENGINE",
          dataOrigin: "REAL",
          trackingAccount: "UNASSIGNED",
          signalTimestamp: new Date(),
          metadata: {
            direction: signal.direction,
            autoExecutionEligible: signal.auto_execution_eligible,
            humanReviewRequired: signal.human_review_required,
            signalStatus: signal.status,
          },
        });
      },
    },
    delivery: {
      deliver: async ({ signalId, analysisId, signalVersion }) => {
        await input.ecosystemServices.delivery.enqueueReference({
          signalId,
          analysisId,
          signalVersion,
        });
        await input.ecosystemServices.delivery.processNext();
      },
    },
    distribution: {
      fanOut: async () => {
        await Promise.all([
          input.ecosystemServices.alerts.getAlerts({ limit: 20 }),
          input.ecosystemServices.dashboard.getSnapshot(),
          input.ecosystemServices.results.getPlatformResults("monthly"),
          input.ecosystemServices.bot.getSnapshot(),
          input.ecosystemServices.history.getHistory(undefined, 20),
        ]);
      },
    },
    transitions: input.transitions ?? new InMemoryExecutionTransitionSink(),
  };
}