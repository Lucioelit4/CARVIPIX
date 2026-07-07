import type {
  IResultsDomainService,
  ServicePlatformResults,
  ServiceResultsHistoryRecord,
} from "../contracts";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";

export class ResultsDomainService implements IResultsDomainService {
  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getPlatformResults(period: "monthly" | "yearly" | "all-time"): Promise<ServicePlatformResults> {
    const [alertsMetricsResult, botMetricsResult, capitalMetricsResult, fundingMetricsResult, usersResult] = await Promise.all([
      backendDatabase.query<{
        total_trades: number;
        win_rate: number;
        profit_loss: number;
      }>(
        `
        SELECT
          COUNT(*) AS total_trades,
          CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE pnl > 0)::numeric / COUNT(*)::numeric) * 100 ELSE 0 END AS win_rate,
          COALESCE(SUM(pnl), 0) AS profit_loss
        FROM operations
        WHERE COALESCE(metadata->>'module', '') IN ('alerts', 'trading')
        `
      ),
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
        `
      ),
    ]);

    const alertsMetrics = alertsMetricsResult.rows[0];
    const botMetrics = botMetricsResult.rows[0];
    const capitalMetrics = capitalMetricsResult.rows[0];
    const fundingMetrics = fundingMetricsResult.rows[0];
    const users = usersResult.rows[0];

    const alertsTrades = Number(alertsMetrics?.total_trades ?? 0);
    const alertsWinRate = Number(alertsMetrics?.win_rate ?? 0);
    const alertsProfit = Number(alertsMetrics?.profit_loss ?? 0);

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
    };

    this.eventBus.publish("results.read", {
      period,
      totalTrades: results.combinedStats.totalTrades,
      queriedAt: new Date(),
    });

    return results;
  }

  async getHistory(months = 12): Promise<ServiceResultsHistoryRecord[]> {
    const [operationsResult, reportsResult] = await Promise.all([
      backendDatabase.query<{
        month: string;
        total_trades: number;
        winning_trades: number;
        profit_loss: number;
      }>(
        `
        SELECT
          COALESCE(metadata->>'reportMonth', TO_CHAR(executed_at, 'YYYY-MM')) AS month,
          COUNT(*) AS total_trades,
          COUNT(*) FILTER (WHERE pnl > 0) AS winning_trades,
          COALESCE(SUM(pnl), 0) AS profit_loss
        FROM operations
        GROUP BY 1
        ORDER BY MAX(executed_at) DESC
        LIMIT $1
        `,
        [months]
      ),
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

    const operationByMonth = new Map(operationsResult.rows.map((row) => [row.month, row]));
    const reportByMonth = new Map(reportsResult.rows.map((row) => [row.month, row]));
    const monthsIndex = Array.from(new Set([...operationByMonth.keys(), ...reportByMonth.keys()])).slice(0, months);

    const history = monthsIndex.map((month, index) => {
      const operation = operationByMonth.get(month);
      const report = reportByMonth.get(month);
      const totalTrades = Number(operation?.total_trades ?? 0);
      const winningTrades = Number(operation?.winning_trades ?? 0);
      const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0;

      return {
        id: `history-${index + 1}`,
        month,
        metrics: {
          alertas: {
            totalTrades,
            winRate,
            profitLoss: Number(operation?.profit_loss ?? 0),
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
