import type { EngineGateway, IAlertsDomainService, ServiceAlertRecord, ServiceAlertStats } from "../contracts";
import { InMemoryServiceEventBus } from "../core/event-bus";

function mapStateToStatus(state: string): ServiceAlertRecord["status"] {
  if (state === "activa" || state === "pendiente") {
    return "active";
  }

  if (state === "tp" || state === "sl" || state === "breakeven") {
    return "triggered";
  }

  return "resolved";
}

function mapConfidenceToPriority(confidence: number): ServiceAlertRecord["priority"] {
  if (confidence >= 90) {
    return "critical";
  }

  if (confidence >= 80) {
    return "high";
  }

  if (confidence >= 65) {
    return "medium";
  }

  return "low";
}

export class AlertsDomainService implements IAlertsDomainService {
  constructor(
    private readonly engineGateway: EngineGateway,
    private readonly eventBus: InMemoryServiceEventBus
  ) {}

  async getAlerts(query?: { userId?: string; limit?: number }): Promise<ServiceAlertRecord[]> {
    const alerts = await this.engineGateway.getAlerts(query?.limit);

    const mapped = alerts.map((alert) => {
      const confidence = alert.consensusResult.overallConfidence;

      return {
        id: alert.id,
        type: "signal" as const,
        symbol: alert.symbol,
        title: `${alert.type === "compra" ? "Compra" : "Venta"} ${alert.symbol}`,
        description: alert.reasoning,
        priority: mapConfidenceToPriority(confidence),
        status: mapStateToStatus(alert.state),
        timestamp: new Date(alert.createdAt),
        actionUrl: "/alertas",
        data: {
          entryPrice: alert.entryPrice,
          stopLossPrice: alert.stopLossPrice,
          takeProfitPrice: alert.takeProfitPrice,
          riskRewardRatio: alert.riskRewardRatio,
          timeframe: alert.timeframe,
          direction: alert.type === "compra" ? "Compra" : "Venta",
          confidence,
          approvalCount: alert.consensusResult.approvalCount,
        },
      };
    });

    this.eventBus.publish("alerts.read", {
      count: mapped.length,
      queriedAt: new Date(),
    });

    return mapped;
  }

  async getAlertStats(): Promise<ServiceAlertStats> {
    const alerts = await this.engineGateway.getAlerts();

    const stats: ServiceAlertStats = {
      total: alerts.length,
      active: alerts.filter((a) => a.state === "activa" || a.state === "pendiente").length,
      triggered: alerts.filter((a) => a.state === "tp" || a.state === "sl" || a.state === "breakeven").length,
      resolved: alerts.filter((a) => a.state === "cancelada" || a.state === "caducada").length,
    };

    this.eventBus.publish("alerts.stats.read", {
      stats,
      queriedAt: new Date(),
    });

    return stats;
  }
}
