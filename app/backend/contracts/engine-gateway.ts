import type { DecisionLogEntry, EngineMetrics, EngineState, TradeAlert } from "@/app/engine/types";

export interface EngineGateway {
  getEngineState(): Promise<EngineState>;
  getAlerts(limit?: number): Promise<TradeAlert[]>;
  getDecisionLog(limit?: number): Promise<DecisionLogEntry[]>;
  getMetrics(): Promise<EngineMetrics>;
}
