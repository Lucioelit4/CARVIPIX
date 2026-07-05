/* eslint-disable @typescript-eslint/no-explicit-any */
// Tipos para Bot CARVIPIX

export type BotStatus = "inactive" | "running" | "paused" | "error";
export type BotStrategy = "grid" | "momentum" | "breakout" | "scalping";

export interface BotLicense {
  userId: string;
  licenseKey: string;
  purchaseDate: Date;
  expiryDate?: Date;
  active: boolean;
  brokerConnected?: "MT4" | "MT5";
}

export interface BotInstance {
  id: string;
  userId: string;
  name: string;
  strategy: BotStrategy;
  status: BotStatus;
  symbol: string;
  riskLevel: "low" | "medium" | "high";
  configuration: Record<string, any>;
  createdAt: Date;
  startedAt?: Date;
  stats: BotStats;
}

export interface BotStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export interface BotUpdate {
  version: string;
  releaseDate: Date;
  features: string[];
  improvements: string[];
  bugFixes: string[];
}

