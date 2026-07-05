import type {
  EngineGateway,
  IResultsDomainService,
  ServicePlatformResults,
  ServiceResultsHistoryRecord,
} from "../contracts";
import { InMemoryServiceEventBus } from "../core/event-bus";

function inferProfitFromState(state: string, rr: number): number {
  if (state === "tp") {
    return rr * 100;
  }

  if (state === "sl") {
    return -100;
  }

  return 0;
}

export class ResultsDomainService implements IResultsDomainService {
  constructor(
    private readonly engineGateway: EngineGateway,
    private readonly eventBus: InMemoryServiceEventBus
  ) {}

  async getPlatformResults(period: "monthly" | "yearly" | "all-time"): Promise<ServicePlatformResults> {
    const [alerts, metrics, state] = await Promise.all([
      this.engineGateway.getAlerts(),
      this.engineGateway.getMetrics(),
      this.engineGateway.getEngineState(),
    ]);

    const profitLoss = Number(
      alerts
        .reduce((acc, item) => acc + inferProfitFromState(item.state, item.riskRewardRatio), 0)
        .toFixed(2)
    );

    const results: ServicePlatformResults = {
      period,
      generatedAt: new Date(state.lastUpdate),
      bySource: {
        alertas: {
          totalTrades: alerts.length,
          winRate: metrics.averageWinRate,
          profitLoss,
        },
        bot: {
          totalTrades: 0,
          winRate: 0,
          profitLoss: 0,
          avgTrade: 0,
        },
        capital: {
          investorsCount: 0,
          totalManaged: 0,
          avgReturn: 0,
          totalProfit: 0,
        },
        fondeo: {
          accountsManaged: 0,
          successRate: 0,
          totalCapital: 0,
        },
      },
      combinedStats: {
        totalTrades: alerts.length,
        avgWinRate: metrics.averageWinRate,
        totalProfit: profitLoss,
        userCount: metrics.activeAlerts,
      },
    };

    this.eventBus.publish("results.read", {
      period,
      totalTrades: results.combinedStats.totalTrades,
      queriedAt: new Date(),
    });

    return results;
  }

  async getHistory(months = 12): Promise<ServiceResultsHistoryRecord[]> {
    const state = await this.engineGateway.getEngineState();
    if (state.decisionLog.length === 0) {
      return [];
    }

    const grouped = new Map<string, typeof state.decisionLog>();
    state.decisionLog.forEach((entry) => {
      const key = new Date(entry.timestamp).toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });

      const arr = grouped.get(key) ?? [];
      arr.push(entry);
      grouped.set(key, arr);
    });

    const history = Array.from(grouped.entries()).map(([month, entries], index) => {
      const totalTrades = entries.length;
      const approved = entries.filter((entry) => entry.consensus.outcome === "approved").length;
      const winRate = totalTrades > 0 ? Number(((approved / totalTrades) * 100).toFixed(2)) : 0;

      return {
        id: `history-${index + 1}`,
        month,
        metrics: {
          alertas: {
            totalTrades,
            winRate,
            profitLoss: 0,
          },
          bot: {
            totalTrades: 0,
            winRate: 0,
            profitLoss: 0,
            avgTrade: 0,
          },
          capital: {
            investorsCount: 0,
            totalManaged: 0,
            avgReturn: 0,
            totalProfit: 0,
          },
          fondeo: {
            accountsManaged: 0,
            successRate: 0,
            totalCapital: 0,
          },
        },
      };
    });

    this.eventBus.publish("results.history.read", {
      months,
      count: history.length,
      queriedAt: new Date(),
    });

    return history.slice(0, months);
  }
}
