// Utilidades para acceder a datos demo desde los módulos
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

// Inicializar en modo demo por defecto
if (typeof window === "undefined") {
  // Solo en servidor
  membershipsService.setDemoMode(true);
  paymentsService.setDemoMode(true);
  alertsService.setDemoMode(true);
  botService.setDemoMode(true);
  capitalService.setDemoMode(true);
  resultsService.setDemoMode(true);
  aiSupportService.setDemoMode(true);
}

// ============================================================
// MEMBERSHIPS & PERMISSIONS
// ============================================================

export async function getCurrentUser() {
  return await membershipsService.getCurrentUserProfile();
}

export async function getCurrentPlan() {
  const user = await getCurrentUser();
  return user.plan;
}

export async function hasPermission(feature: string) {
  return await membershipsService.hasPermission(
    feature as "alertas" | "bot" | "capital" | "fondeo" | "reportes" | "soporte" | "aiBriefing"
  );
}

// ============================================================
// PAYMENTS & PRODUCTS
// ============================================================

export async function getAllProducts() {
  return await paymentsService.getProducts();
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
  const user = await getCurrentUser();
  return await alertsService.getAlerts(user.id, limit);
}

export async function getAlertRules() {
  const user = await getCurrentUser();
  return await alertsService.getAlertRules(user.id);
}

export async function getAlertStats() {
  const user = await getCurrentUser();
  return await alertsService.getAlertStats(user.id);
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
  const user = await getCurrentUser();
  return await capitalService.getCapitalAccount(user.id);
}

export async function getCapitalMovements() {
  const account = await getCapitalAccount();
  if (!account) return [];
  return await capitalService.getCapitalMovements(account.accountId);
}

export async function getCapitalMonthlyReports() {
  const account = await getCapitalAccount();
  if (!account) return [];
  return await capitalService.getMonthlyReports(account.accountId);
}

export async function getInvestorStats() {
  return await capitalService.getInvestorStats();
}

// ============================================================
// RESULTS
// ============================================================

export async function getPlatformResults(period: "monthly" | "yearly" | "all-time" = "monthly") {
  return await resultsService.getPlatformResults(period);
}

export async function getResultsHistory(months?: number) {
  return await resultsService.getResultsHistory(months);
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
