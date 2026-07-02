// Datos demo para Resultados

import { PlatformResults, ResultsHistory } from "./types";

export const DEMO_PLATFORM_RESULTS: PlatformResults = {
  period: "monthly",
  generatedAt: new Date(),
  bySource: {
    alertas: {
      totalTrades: 342,
      winRate: 62.3,
      profitLoss: 4850.50,
    },
    bot: {
      totalTrades: 1284,
      winRate: 65.7,
      profitLoss: 12340.75,
      avgTrade: 9.61,
    },
    capital: {
      investorsCount: 12,
      totalManaged: 350000,
      avgReturn: 4.8,
      totalProfit: 16800,
    },
    fondeo: {
      accountsManaged: 8,
      successRate: 75,
      totalCapital: 1600000,
    },
  },
  combinedStats: {
    totalTrades: 1626,
    avgWinRate: 64.3,
    totalProfit: 34017.25,
    userCount: 145,
  },
};

export const DEMO_RESULTS_HISTORY: ResultsHistory[] = [
  {
    id: "results-001",
    month: "Enero 2024",
    metrics: {
      alertas: { totalTrades: 250, winRate: 58.0, profitLoss: 2100 },
      bot: { totalTrades: 980, winRate: 62.1, profitLoss: 8450, avgTrade: 8.62 },
      capital: { investorsCount: 8, totalManaged: 200000, avgReturn: 3.2, totalProfit: 6400 },
      fondeo: { accountsManaged: 4, successRate: 75, totalCapital: 800000 },
    },
  },
  {
    id: "results-002",
    month: "Febrero 2024",
    metrics: {
      alertas: { totalTrades: 295, winRate: 61.0, profitLoss: 3600 },
      bot: { totalTrades: 1150, winRate: 64.3, profitLoss: 10200, avgTrade: 8.87 },
      capital: { investorsCount: 10, totalManaged: 280000, avgReturn: 4.1, totalProfit: 11480 },
      fondeo: { accountsManaged: 6, successRate: 75, totalCapital: 1200000 },
    },
  },
];

export function getDemoPlatformResults(): PlatformResults {
  return {
    ...DEMO_PLATFORM_RESULTS,
    bySource: { ...DEMO_PLATFORM_RESULTS.bySource },
    combinedStats: { ...DEMO_PLATFORM_RESULTS.combinedStats },
  };
}

export function getDemoResultsHistory(): ResultsHistory[] {
  return DEMO_RESULTS_HISTORY.map(h => ({
    ...h,
    metrics: { ...h.metrics },
  }));
}
