import { engine } from "@/app/engine/core/engine";
import { getDemoScenarios } from "@/app/engine/demo/scenarios";
import type { DecisionLogEntry, EngineMetrics, EngineState, TradeAlert } from "@/app/engine/types";
import type { EngineGateway } from "../contracts";
import { backendConfig } from "../core/config";
import { normalizeBackendError } from "../core/errors";
import type { BackendLogger } from "../core/logger";
import type { BackendObservability } from "../core/observability";

type AdapterOptions = {
  seedFromScenarios?: boolean;
  logger?: BackendLogger;
  observability?: BackendObservability;
};

export class TradingEngineGatewayAdapter implements EngineGateway {
  private seeded = false;
  private readonly seedFromScenarios: boolean;
  private readonly logger?: BackendLogger;
  private readonly observability?: BackendObservability;

  constructor(options?: AdapterOptions) {
    this.seedFromScenarios = options?.seedFromScenarios ?? true;
    this.logger = options?.logger;
    this.observability = options?.observability;
  }

  private async runEngineCall<T>(method: string, action: () => T | Promise<T>): Promise<T> {
    const metric = `backend.engine.${method}`;
    this.observability?.increment(`${metric}.calls`, "engine.usage", 1, { method });
    const stopTimer = this.observability?.startTimer(metric, "response.time", { method });

    try {
      const result = await Promise.resolve(action());
      stopTimer?.({ status: "ok" });
      this.logger?.performance("engine.call", "Engine call completed", { method });
      return result;
    } catch (error) {
      const normalized = normalizeBackendError(error, {
        category: "engine",
        code: "ENGINE_GATEWAY_CALL_FAILED",
        source: `adapter.trading-engine.${method}`,
      });

      stopTimer?.({ status: "error" });
      this.observability?.increment(`${metric}.errors`, "engine.usage", 1, { method });
      this.logger?.error(
        "engine.call",
        "Engine call failed",
        normalized.toPayload(backendConfig.errors.includeStackInPayload),
        { method }
      );

      throw normalized;
    }
  }

  private ensureSeeded(): void {
    if (!this.seedFromScenarios || this.seeded) {
      return;
    }

    const current = engine.getState();
    if (current.alerts.length > 0 || current.decisionLog.length > 0) {
      this.seeded = true;
      return;
    }

    const scenarios = getDemoScenarios();
    [scenarios.scenario1, scenarios.scenario2, scenarios.scenario3].forEach((scenario) => {
      engine.createAlert(scenario.signal, scenario.consensus);
    });

    this.seeded = true;
  }

  async getEngineState(): Promise<EngineState> {
    return this.runEngineCall("getEngineState", () => {
      this.ensureSeeded();
      return engine.getState();
    });
  }

  async getAlerts(limit?: number): Promise<TradeAlert[]> {
    return this.runEngineCall("getAlerts", () => {
      this.ensureSeeded();
      const alerts = engine.getAlerts().sort((a, b) => b.createdAt - a.createdAt);
      return typeof limit === "number" ? alerts.slice(0, limit) : alerts;
    });
  }

  async getDecisionLog(limit?: number): Promise<DecisionLogEntry[]> {
    return this.runEngineCall("getDecisionLog", () => {
      this.ensureSeeded();
      const log = engine.getDecisionLog().slice().sort((a, b) => b.timestamp - a.timestamp);
      return typeof limit === "number" ? log.slice(0, limit) : log;
    });
  }

  async getMetrics(): Promise<EngineMetrics> {
    return this.runEngineCall("getMetrics", () => {
      this.ensureSeeded();
      return engine.getState().metrics;
    });
  }
}
