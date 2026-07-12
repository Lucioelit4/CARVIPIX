import type {
  IResultsDomainService,
  ServicePlatformResults,
  ServiceResultsHistoryRecord,
} from "../contracts";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";
import { masterSignalStore } from "@/app/ai/cadpV2/masterSignalStore";
import { realSignalLifecycleService } from "./real-signal-lifecycle-service";

export class ResultsDomainService implements IResultsDomainService {
  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getPlatformResults(period: "monthly" | "yearly" | "all-time"): Promise<ServicePlatformResults> {
    const latestSignal = masterSignalStore.getLatest();
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    const [lifecycleMetrics, botMetricsResult, capitalMetricsResult, fundingMetricsResult, usersResult] = await Promise.all([
      realSignalLifecycleService.getResultsAggregate(),
      backendDatabase.query<{
        total_trades: number;
        win_rate: number;
        profit_loss: number;
      }>(
        `
        SELECT
          COALESCE(SUM((stats->>'totalTrades')::numeric), 0) AS total_trades,
          COALESCE(AVG((stats->>'winRate')::numeric), 0) AS win_rate,
          COALESCE(SUM((stats->>'profitLoss')::numeric), 0) AS profit_loss
        FROM bot_instances
        `
      ),
      backendDatabase.query<{
        investors_count: number;
        total_managed: number;
        avg_return: number;
        total_profit: number;
      }>(
        `
        SELECT
          COUNT(*) AS investors_count,
          COALESCE(SUM(current_balance), 0) AS total_managed,
          COALESCE(AVG(monthly_return), 0) AS avg_return,
          COALESCE(SUM(utilidad), 0) AS total_profit
        FROM capital_accounts
        WHERE status <> 'closed'
        `
      ),
      backendDatabase.query<{
        accounts_managed: number;
        total_capital: number;
      }>(
        `
        SELECT
          COUNT(*) AS accounts_managed,
          COALESCE(SUM(initial_capital), 0) AS total_capital
        FROM capital_accounts
        WHERE status IN ('active', 'pending')
        `
      ),
      backendDatabase.query<{ active_users: number }>(
        `
        SELECT COUNT(*) AS active_users
        FROM users
        WHERE estado = 'activo'
          AND COALESCE(exclude_from_commercial_metrics, false) = false
        `
      ),
    ]);

    const botMetrics = botMetricsResult.rows[0];
    const capitalMetrics = capitalMetricsResult.rows[0];
    const fundingMetrics = fundingMetricsResult.rows[0];
    const users = usersResult.rows[0];

    const alertsTrades = lifecycleMetrics.totalTrades;
    const alertsWinRate = lifecycleMetrics.winRate;
    const alertsProfit = lifecycleMetrics.profitLoss;

    const botTrades = Number(botMetrics?.total_trades ?? 0);
    const botProfit = Number(botMetrics?.profit_loss ?? 0);
    const botWinRate = Number(botMetrics?.win_rate ?? 0);
    const botAvgTrade = botTrades > 0 ? Number((botProfit / botTrades).toFixed(2)) : 0;

    const fundingAccounts = Number(fundingMetrics?.accounts_managed ?? 0);

    const results: ServicePlatformResults = {
      period,
      generatedAt: new Date(),
      bySource: {
        alertas: {
          totalTrades: alertsTrades,
          winRate: alertsWinRate,
          profitLoss: alertsProfit,
        },
        bot: {
          totalTrades: botTrades,
          winRate: botWinRate,
          profitLoss: botProfit,
          avgTrade: botAvgTrade,
        },
        capital: {
          investorsCount: Number(capitalMetrics?.investors_count ?? 0),
          totalManaged: Number(capitalMetrics?.total_managed ?? 0),
          avgReturn: Number(capitalMetrics?.avg_return ?? 0),
          totalProfit: Number(capitalMetrics?.total_profit ?? 0),
        },
        fondeo: {
          accountsManaged: fundingAccounts,
          successRate: fundingAccounts > 0 ? Number(((Number(capitalMetrics?.investors_count ?? 0) / fundingAccounts) * 100).toFixed(2)) : 0,
          totalCapital: Number(fundingMetrics?.total_capital ?? 0),
        },
      },
      combinedStats: {
        totalTrades: alertsTrades + botTrades,
        avgWinRate:
          alertsTrades + botTrades > 0
            ? Number((((alertsWinRate * alertsTrades) + (botWinRate * botTrades)) / (alertsTrades + botTrades)).toFixed(2))
            : 0,
        totalProfit: Number((alertsProfit + botProfit + Number(capitalMetrics?.total_profit ?? 0)).toFixed(2)),
        userCount: Number(users?.active_users ?? 0),
      },
      masterSignal: latestSignal
        ? {
            signalId: latestSignal.signal_id,
            analysisId: latestSignal.analysis_id,
            symbol: latestSignal.signal.symbol,
            decision: latestSignal.signal.direction,
            entry: latestSignal.signal.entry,
            stopLoss: latestSignal.signal.stop_loss,
            takeProfit: latestSignal.signal.take_profit,
            strategyId: latestSignal.signal.selected_strategy_id,
            status: latestSignal.signal.status,
          }
        : null,
    };

    this.eventBus.publish("results.read", {
      period,
      totalTrades: results.combinedStats.totalTrades,
      queriedAt: new Date(),
    });

    return results;
  }

  async getHistory(months = 12): Promise<ServiceResultsHistoryRecord[]> {
    const latestSignal = masterSignalStore.getLatest();
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    const [lifecycleHistory, reportsResult] = await Promise.all([
      realSignalLifecycleService.getMonthlyResults(months),
      backendDatabase.query<{
        month: string;
        investors_count: number;
        total_managed: number;
        avg_return: number;
        total_profit: number;
      }>(
        `
        SELECT
          mr.mes AS month,
          COUNT(DISTINCT mr.account_id) AS investors_count,
          COALESCE(SUM(mr.capital_final), 0) AS total_managed,
          COALESCE(AVG(mr.rendimiento), 0) AS avg_return,
          COALESCE(SUM(mr.utilidad), 0) AS total_profit
        FROM monthly_reports mr
        GROUP BY mr.mes
        ORDER BY MAX(mr.id) DESC
        LIMIT $1
        `,
        [months]
      ),
    ]);

    const operationByMonth = new Map(lifecycleHistory.map((row) => [row.month, row]));
    const reportByMonth = new Map(reportsResult.rows.map((row) => [row.month, row]));
    const monthsIndex = Array.from(new Set([...operationByMonth.keys(), ...reportByMonth.keys()])).slice(0, months);

    const history = monthsIndex.map((month, index) => {
      const operation = operationByMonth.get(month);
      const report = reportByMonth.get(month);
      const totalTrades = Number(operation?.totalTrades ?? 0);
      const winningTrades = Number(operation?.winningTrades ?? 0);
      const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0;

      return {
        id: `history-${index + 1}`,
        month,
        metrics: {
          alertas: {
            totalTrades,
            winRate,
            profitLoss: Number(operation?.profitLoss ?? 0),
          },
          bot: {
            totalTrades: 0,
            winRate: 0,
            profitLoss: 0,
            avgTrade: 0,
          },
          capital: {
            investorsCount: Number(report?.investors_count ?? 0),
            totalManaged: Number(report?.total_managed ?? 0),
            avgReturn: Number(report?.avg_return ?? 0),
            totalProfit: Number(report?.total_profit ?? 0),
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
