import "server-only";

// Utilidades para acceder a datos reales desde los módulos
// Este archivo actúa como puente entre las páginas y los servicios

import {
  membershipsService,
  paymentsService,
  alertsService,
  botService,
  capitalService,
  resultsService,
  aiSupportService,
} from "@/app/lib/modules";
import { ecosystemServices } from "@/app/backend";
import { backendDatabase } from "@/app/backend/core/database";

const EMPTY_USER = {
  id: "",
  email: "Sin datos",
  nombre: "Sin datos",
  apellido: "",
  plan: "demo" as const,
  estado: "inactivo" as const,
  fechaActivacion: new Date(0),
  permisos: {
    alertas: false,
    bot: false,
    capital: false,
    fondeo: false,
    reportes: false,
    soporte: false,
    aiBriefing: false,
    maxAlerts: 0,
    maxBots: 0,
  },
  verificado: false,
};

// ============================================================
// MEMBERSHIPS & PERMISSIONS
// ============================================================

export async function getCurrentUser() {
  try {
    return await membershipsService.getCurrentUserProfile();
  } catch {
    return EMPTY_USER;
  }
}

export async function getCurrentMembership() {
  try {
    return await membershipsService.getCurrentMembership();
  } catch {
    return {
      userId: "",
      plan: "demo" as const,
      estado: "vencido" as const,
      fechaInicio: new Date(0),
      renovacionAutomatica: false,
    };
  }
}

export async function getCurrentPlan() {
  const user = await getCurrentUser();
  return user.plan;
}

export async function hasPermission(feature: string) {
  try {
    return await membershipsService.hasPermission(
      feature as "alertas" | "bot" | "capital" | "fondeo" | "reportes" | "soporte" | "aiBriefing"
    );
  } catch {
    return false;
  }
}

// ============================================================
// PAYMENTS & PRODUCTS
// ============================================================

export async function getAllProducts() {
  try {
    return await paymentsService.getProducts();
  } catch {
    return [];
  }
}

export async function getPaymentProduct(productId: string) {
  try {
    return await paymentsService.getProduct(productId);
  } catch {
    return null;
  }
}

export async function createPaymentOrder(productId: string) {
  try {
    const user = await getCurrentUser();
    if (!user.id) {
      return null;
    }
    return await paymentsService.createOrder(user.id, productId);
  } catch {
    return null;
  }
}

export async function processPaymentOrder(orderId: string, method: "card" | "crypto" | "bank_transfer" = "card") {
  try {
    return await paymentsService.processPayment(orderId, method);
  } catch {
    return null;
  }
}

export async function getPaymentOrderHistory() {
  try {
    const user = await getCurrentUser();
    if (!user.id) {
      return [];
    }
    return await paymentsService.getOrderHistory(user.id);
  } catch {
    return [];
  }
}

export async function getBotProduct() {
  const products = await getAllProducts();
  return products.find(p => p.type === "bot");
}

export async function getCapitalProduct() {
  const products = await getAllProducts();
  return products.find(p => p.type === "capital");
}

export async function getFundeoProduct() {
  const products = await getAllProducts();
  return products.find(p => p.type === "fondeo");
}

// ============================================================
// ALERTS
// ============================================================

export async function getAlerts(limit?: number) {
  try {
    const user = await getCurrentUser();
    if (!user.id) {
      return [];
    }
    return await alertsService.getAlerts(user.id, limit);
  } catch {
    return [];
  }
}

export async function getAlertRules() {
  try {
    const user = await getCurrentUser();
    if (!user.id) {
      return [];
    }
    return await alertsService.getAlertRules(user.id);
  } catch {
    return [];
  }
}

export async function getAlertStats() {
  try {
    const user = await getCurrentUser();
    if (!user.id) {
      return { total: 0, active: 0, triggered: 0, resolved: 0 };
    }
    return await alertsService.getAlertStats(user.id);
  } catch {
    return { total: 0, active: 0, triggered: 0, resolved: 0 };
  }
}

// ============================================================
// BOT CARVIPIX
// ============================================================

export async function getBotLicense() {
  const user = await getCurrentUser();
  return await botService.getLicense(user.id);
}

export async function isBotLicenseValid() {
  const user = await getCurrentUser();
  return await botService.isLicenseValid(user.id);
}

export async function getBotInstances() {
  const user = await getCurrentUser();
  return await botService.getBotInstances(user.id);
}

export async function getLatestBotUpdates() {
  return await botService.getAvailableUpdates();
}

// ============================================================
// CAPITAL INVESTORS
// ============================================================

export async function getCapitalAccount() {
  try {
    const user = await getCurrentUser();
    if (!user.id) {
      return null;
    }
    return await capitalService.getCapitalAccount(user.id);
  } catch {
    return null;
  }
}

export async function getCapitalMovements() {
  try {
    const account = await getCapitalAccount();
    if (!account) return [];
    return await capitalService.getCapitalMovements(account.accountId);
  } catch {
    return [];
  }
}

export async function getCapitalMonthlyReports() {
  try {
    const account = await getCapitalAccount();
    if (!account) return [];
    return await capitalService.getMonthlyReports(account.accountId);
  } catch {
    return [];
  }
}

export async function getBalance() {
  try {
    const account = await getCapitalAccount();
    if (!account) {
      return {
        currentBalance: 0,
        initialCapital: 0,
        profitLoss: 0,
        monthlyReturn: 0,
        annualReturn: 0,
      };
    }

    return {
      currentBalance: Number(account.currentBalance ?? 0),
      initialCapital: Number(account.initialCapital ?? 0),
      profitLoss: Number(account.utilidad ?? 0),
      monthlyReturn: Number(account.monthlyReturn ?? 0),
      annualReturn: Number(account.annualReturn ?? 0),
    };
  } catch {
    return {
      currentBalance: 0,
      initialCapital: 0,
      profitLoss: 0,
      monthlyReturn: 0,
      annualReturn: 0,
    };
  }
}

export async function getOperations(limit = 50) {
  try {
    const user = await getCurrentUser();
    if (!user.id) {
      return [];
    }

    const { rows } = await backendDatabase.query<{
      id: string;
      user_id: string;
      account_id: string | null;
      symbol: string;
      side: string;
      status: string;
      pnl: number;
      executed_at: Date;
      metadata: unknown;
    }>(
      `
      SELECT id, user_id, account_id, symbol, side, status, pnl, executed_at, metadata
      FROM operations
      WHERE user_id = $1
      ORDER BY executed_at DESC
      LIMIT $2
      `,
      [user.id, limit]
    );

    return rows.map((item) => ({
      id: item.id,
      userId: item.user_id,
      accountId: item.account_id,
      symbol: item.symbol,
      side: item.side,
      status: item.status,
      pnl: Number(item.pnl ?? 0),
      executedAt: new Date(item.executed_at),
      metadata: typeof item.metadata === "object" && item.metadata ? item.metadata : {},
    }));
  } catch {
    return [];
  }
}

export async function getInvestorStats() {
  try {
    return await capitalService.getInvestorStats();
  } catch {
    return {
      totalCapitalManaged: 0,
      totalInvestors: 0,
      avgReturn: 0,
      topMonth: {
        month: "Sin datos",
        return: 0,
      },
    };
  }
}

export async function getFundingSnapshot() {
  return await ecosystemServices.funding.getSnapshot();
}

// ============================================================
// RESULTS
// ============================================================

export async function getPlatformResults(period: "monthly" | "yearly" | "all-time" = "monthly") {
  try {
    return await resultsService.getPlatformResults(period);
  } catch {
    return {
      period,
      generatedAt: new Date(),
      bySource: {
        alertas: {
          totalTrades: 0,
          winRate: 0,
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
      combinedStats: {
        totalTrades: 0,
        avgWinRate: 0,
        totalProfit: 0,
        userCount: 0,
      },
    };
  }
}

export async function getResultsHistory(months?: number) {
  try {
    return await resultsService.getResultsHistory(months);
  } catch {
    return [];
  }
}

export async function getResultsBySource(source: "alertas" | "bot" | "capital" | "fondeo") {
  return await resultsService.getMetricsBySource(source);
}

// ============================================================
// AI SUPPORT
// ============================================================

export async function getAIConversations() {
  const user = await getCurrentUser();
  return await aiSupportService.getConversations(user.id);
}

export async function getDailyBriefing() {
  const user = await getCurrentUser();
  return await aiSupportService.getDailyBriefing(user.id);
}

export async function getTradingSuggestions() {
  const user = await getCurrentUser();
  return await aiSupportService.getTradingSuggestions(user.id);
}
