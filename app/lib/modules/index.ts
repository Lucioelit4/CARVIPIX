// Central module index - Expone todos los servicios modulares

import { membershipsService } from "./memberships/service";
import { paymentsService } from "./payments/service";
import { alertsService } from "./alerts/service";
import { botService } from "./bot/service";
import { capitalService } from "./capital/service";
import { resultsService } from "./results/service";
import { aiSupportService } from "./ai-support/service";

export { membershipsService, MembershipsService } from "./memberships/service";
export { paymentsService, PaymentsService } from "./payments/service";
export { alertsService, AlertsService } from "./alerts/service";
export { botService, BotService } from "./bot/service";
export { capitalService, CapitalService } from "./capital/service";
export { resultsService, ResultsService } from "./results/service";
export { aiSupportService, AISupportService } from "./ai-support/service";

// Types exports
export type { UserProfile, Membership, PlanType, PlanPermissions } from "./memberships/types";
export type { Product, Payment, Order } from "./payments/types";
export type { Alert, AlertRule, AlertHistory } from "./alerts/types";
export type { BotLicense, BotInstance, BotStats, BotUpdate } from "./bot/types";
export type { CapitalAccount, CapitalMovement, MonthlyReport, InvestorStats } from "./capital/types";
export type { PlatformResults, ResultsBySource, ResultsHistory } from "./results/types";
export type { AIConversation, AIBriefing, AISuggestion, AIMessage } from "./ai-support/types";

// Helper to get all demo data
export function initializeDemo() {
  membershipsService.setDemoMode(true);
  paymentsService.setDemoMode(true);
  alertsService.setDemoMode(true);
  botService.setDemoMode(true);
  capitalService.setDemoMode(true);
  resultsService.setDemoMode(true);
  aiSupportService.setDemoMode(true);
}

// Helper to connect to production APIs (when ready)
export function initializeProduction() {
  membershipsService.setDemoMode(false);
  paymentsService.setDemoMode(false);
  alertsService.setDemoMode(false);
  botService.setDemoMode(false);
  capitalService.setDemoMode(false);
  resultsService.setDemoMode(false);
  aiSupportService.setDemoMode(false);
}
