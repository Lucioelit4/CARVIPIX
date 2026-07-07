"use client";

import type { Alert } from "@/app/lib/modules/alerts/types";
import type { AIBriefing, AISuggestion } from "@/app/lib/modules/ai-support/types";
import type { BotInstance, BotLicense } from "@/app/lib/modules/bot/types";
import type { CapitalAccount, CapitalMovement, MonthlyReport } from "@/app/lib/modules/capital/types";
import type { Membership, UserProfile } from "@/app/lib/modules/memberships/types";
import type { Order, Payment, Product } from "@/app/lib/modules/payments/types";
import type { PlatformResults, ResultsHistory } from "@/app/lib/modules/results/types";

type DataAction =
  | "getCurrentUser"
  | "getCurrentMembership"
  | "getAlerts"
  | "getAlertStats"
  | "getBotLicense"
  | "getBotInstances"
  | "getCapitalAccount"
  | "getBalance"
  | "getCapitalMovements"
  | "getCapitalMonthlyReports"
  | "getPlatformResults"
  | "getResultsHistory"
  | "getOperations"
  | "getAllProducts"
  | "getPaymentProduct"
  | "createPaymentOrder"
  | "processPaymentOrder"
  | "getPaymentOrderHistory"
  | "getFundingSnapshot"
  | "getDailyBriefing"
  | "getTradingSuggestions";

type FundingSnapshot = {
  activePrograms: number;
  approvedAccounts: number;
  totalCapital: number;
};

type AlertStats = {
  total: number;
  active: number;
  triggered: number;
  resolved: number;
};

type DataActionMap = {
  getCurrentUser: UserProfile;
  getCurrentMembership: Membership;
  getAlerts: Alert[];
  getAlertStats: AlertStats;
  getBotLicense: BotLicense | null;
  getBotInstances: BotInstance[];
  getCapitalAccount: CapitalAccount | null;
  getBalance: {
    currentBalance: number;
    initialCapital: number;
    profitLoss: number;
    monthlyReturn: number;
    annualReturn: number;
  };
  getCapitalMovements: CapitalMovement[];
  getCapitalMonthlyReports: MonthlyReport[];
  getPlatformResults: PlatformResults;
  getResultsHistory: ResultsHistory[];
  getOperations: Array<{
    id: string;
    userId: string;
    accountId: string | null;
    symbol: string;
    side: string;
    status: string;
    pnl: number;
    executedAt: Date;
    metadata: unknown;
  }>;
  getAllProducts: Product[];
  getPaymentProduct: Product | null;
  createPaymentOrder: Order | null;
  processPaymentOrder: Payment | null;
  getPaymentOrderHistory: Order[];
  getFundingSnapshot: FundingSnapshot;
  getDailyBriefing: AIBriefing | null;
  getTradingSuggestions: AISuggestion[];
};

async function callDataApi<K extends keyof DataActionMap>(action: K, payload?: Record<string, unknown>): Promise<DataActionMap[K]> {
  const response = await fetch("/api/client/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Data API error: ${response.status}`);
  }

  const data = (await response.json()) as { data: DataActionMap[K] };
  return data.data;
}

export async function getCurrentUser() {
  return callDataApi("getCurrentUser");
}

export async function getCurrentMembership() {
  return callDataApi("getCurrentMembership");
}

export async function getAlerts(limit?: number) {
  return callDataApi("getAlerts", { limit });
}

export async function getAlertStats() {
  return callDataApi("getAlertStats");
}

export async function getBotLicense() {
  return callDataApi("getBotLicense");
}

export async function getBotInstances() {
  return callDataApi("getBotInstances");
}

export async function getCapitalAccount() {
  return callDataApi("getCapitalAccount");
}

export async function getBalance() {
  return callDataApi("getBalance");
}

export async function getCapitalMovements() {
  return callDataApi("getCapitalMovements");
}

export async function getCapitalMonthlyReports() {
  return callDataApi("getCapitalMonthlyReports");
}

export async function getPlatformResults(period: "monthly" | "yearly" | "all-time" = "monthly") {
  return callDataApi("getPlatformResults", { period });
}

export async function getResultsHistory(months?: number) {
  return callDataApi("getResultsHistory", { months });
}

export async function getOperations(limit?: number) {
  return callDataApi("getOperations", { limit });
}

export async function getAllProducts() {
  return callDataApi("getAllProducts");
}

export async function getPaymentProduct(productId: string) {
  return callDataApi("getPaymentProduct", { productId });
}

export async function createPaymentOrder(productId: string) {
  return callDataApi("createPaymentOrder", { productId });
}

export async function processPaymentOrder(
  orderId: string,
  method: "card" | "crypto" | "bank_transfer" = "card"
) {
  return callDataApi("processPaymentOrder", { orderId, method });
}

export async function getPaymentOrderHistory() {
  return callDataApi("getPaymentOrderHistory");
}

export async function getFundingSnapshot() {
  return callDataApi("getFundingSnapshot");
}

export async function getDailyBriefing() {
  return callDataApi("getDailyBriefing");
}

export async function getTradingSuggestions() {
  return callDataApi("getTradingSuggestions");
}
