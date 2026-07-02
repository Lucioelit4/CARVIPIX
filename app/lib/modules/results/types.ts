// Tipos para Resultados

export interface ResultsMetric {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "neutral";
}

export interface ResultsBySource {
  alertas: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
  };
  bot: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    avgTrade: number;
  };
  capital: {
    investorsCount: number;
    totalManaged: number;
    avgReturn: number;
    totalProfit: number;
  };
  fondeo: {
    accountsManaged: number;
    successRate: number;
    totalCapital: number;
  };
}

export interface PlatformResults {
  period: string; // "monthly", "yearly", "all-time"
  generatedAt: Date;
  bySource: ResultsBySource;
  combinedStats: {
    totalTrades: number;
    avgWinRate: number;
    totalProfit: number;
    userCount: number;
  };
}

export interface ResultsHistory {
  id: string;
  month: string;
  metrics: ResultsBySource;
}
