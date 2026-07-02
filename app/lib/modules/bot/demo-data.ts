// Datos demo para Bot CARVIPIX

import { BotLicense, BotInstance, BotStats, BotUpdate } from "./types";

export const DEMO_BOT_LICENSE: BotLicense = {
  userId: "demo-user-001",
  licenseKey: "CARVIPIX-DEMO-KEY-12345",
  purchaseDate: new Date(2024, 0, 1),
  active: true,
  brokerConnected: undefined,
};

export const DEMO_BOT_INSTANCE: BotInstance = {
  id: "bot-demo-001",
  userId: "demo-user-001",
  name: "Grid Trading EURUSD",
  strategy: "grid",
  status: "running",
  symbol: "EURUSD",
  riskLevel: "medium",
  configuration: {
    gridLevels: 10,
    orderSize: 0.1,
    profitTarget: 100,
  },
  createdAt: new Date(2024, 0, 1),
  startedAt: new Date(Date.now() - 24 * 3600000),
  stats: {
    totalTrades: 145,
    winningTrades: 98,
    losingTrades: 47,
    profitLoss: 2450.75,
    winRate: 0.676,
    avgWin: 25.0,
    avgLoss: -12.5,
  },
};

export const DEMO_BOT_UPDATES: BotUpdate[] = [
  {
    version: "2.1.0",
    releaseDate: new Date(2024, 5, 15),
    features: ["Soporte para USDT", "Modo demo mejorado"],
    improvements: ["Performance 30% mejor", "UI más intuitiva"],
    bugFixes: ["Corrige lag en órdenes rápidas"],
  },
  {
    version: "2.0.5",
    releaseDate: new Date(2024, 4, 1),
    features: ["Análisis de riesgo en vivo"],
    improvements: ["Conexión más rápida"],
    bugFixes: ["Corrige desconexiones ocasionales"],
  },
];

export function getDemoBotLicense(): BotLicense {
  return { ...DEMO_BOT_LICENSE };
}

export function getDemoBotInstance(): BotInstance {
  return {
    ...DEMO_BOT_INSTANCE,
    stats: { ...DEMO_BOT_INSTANCE.stats },
  };
}

export function getLatestBotUpdate(): BotUpdate {
  return { ...DEMO_BOT_UPDATES[0] };
}
