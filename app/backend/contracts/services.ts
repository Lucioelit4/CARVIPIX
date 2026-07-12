import type {
  ServiceAdminSnapshot,
  ServiceAIContext,
  ServiceAlertRecord,
  ServiceAlertRule,
  ServiceAlertStats,
  ServiceAlertHistory,
  ServiceBotInstance,
  ServiceBotLicense,
  ServiceBotUpdate,
  ServiceBotSnapshot,
  ServiceCapitalAccount,
  ServiceCapitalMovement,
  ServiceCapitalSnapshot,
  ServiceDashboardSnapshot,
  ServiceFundingSnapshot,
  ServiceHistoryEntry,
  ServiceDeliveryJob,
  ServiceDeliveryReference,
  ServiceMasterSignal,
  ServiceInvestorStats,
  ServiceMembership,
  ServiceMonthlyReport,
  ServiceOrder,
  ServiceOperationRecord,
  ServiceOperationSummary,
  ServicePlatformResults,
  ServiceProduct,
  ServicePayment,
  ServicePaymentMethod,
  ServicePlanType,
  ServiceResultsHistoryRecord,
  ServiceStatsSnapshot,
  ServiceUserProfile,
} from "./domain";

export interface AlertsQuery {
  userId?: string;
  limit?: number;
}

export interface IAlertsDomainService {
  getAlerts(query?: AlertsQuery): Promise<ServiceAlertRecord[]>;
  getAlertStats(userId?: string): Promise<ServiceAlertStats>;
  getAlertRules(userId: string): Promise<ServiceAlertRule[]>;
  createAlertRule(userId: string, rule: Omit<ServiceAlertRule, "id" | "userId" | "createdAt">): Promise<ServiceAlertRule>;
  logAlertAction(
    userId: string,
    alertId: string,
    action: ServiceAlertHistory["action"]
  ): Promise<void>;
}

export interface IResultsDomainService {
  getPlatformResults(period: "monthly" | "yearly" | "all-time"): Promise<ServicePlatformResults>;
  getHistory(months?: number): Promise<ServiceResultsHistoryRecord[]>;
}

export interface IMembershipsDomainService {
  getCurrentUserProfile(): Promise<ServiceUserProfile>;
  getCurrentMembership(): Promise<ServiceMembership>;
  hasPermission(
    permission: "alertas" | "bot" | "capital" | "fondeo" | "reportes" | "soporte" | "aiBriefing"
  ): Promise<boolean>;
  getActivePlan(): Promise<ServicePlanType>;
}

export interface IPaymentsDomainService {
  getProducts(): Promise<ServiceProduct[]>;
  getProduct(productId: string): Promise<ServiceProduct | null>;
  createOrder(userId: string, productId: string): Promise<ServiceOrder>;
  processPayment(orderId: string, method: ServicePaymentMethod): Promise<ServicePayment>;
  getOrderHistory(userId: string): Promise<ServiceOrder[]>;
}

export interface IBotDomainService {
  getLicense(userId: string): Promise<ServiceBotLicense | null>;
  isLicenseValid(userId: string): Promise<boolean>;
  getBotInstances(userId: string): Promise<ServiceBotInstance[]>;
  createBotInstance(
    userId: string,
    instance: Omit<ServiceBotInstance, "id" | "userId" | "createdAt" | "stats">
  ): Promise<ServiceBotInstance>;
  getAvailableUpdates(): Promise<ServiceBotUpdate[]>;
  connectBroker(
    botId: string,
    brokerType: "MT4" | "MT5",
    credentials: {
      server: string;
      login: string;
      password: string;
    }
  ): Promise<boolean>;
  getSnapshot(userId?: string): Promise<ServiceBotSnapshot>;
}

export interface ICapitalDomainService {
  getCapitalAccount(userId: string): Promise<ServiceCapitalAccount | null>;
  getCapitalMovements(accountId: string): Promise<ServiceCapitalMovement[]>;
  getMonthlyReports(accountId: string): Promise<ServiceMonthlyReport[]>;
  createCapitalAccount(userId: string, initialCapital: number): Promise<ServiceCapitalAccount>;
  getInvestorStats(): Promise<ServiceInvestorStats>;
  getSnapshot(userId?: string): Promise<ServiceCapitalSnapshot>;
}

export interface IOperationsDomainService {
  getOperations(userId?: string, limit?: number): Promise<ServiceOperationRecord[]>;
  createOperation(
    operation: Omit<ServiceOperationRecord, "id" | "executedAt"> & { id?: string; executedAt?: Date }
  ): Promise<ServiceOperationRecord>;
  getSummary(userId?: string): Promise<ServiceOperationSummary>;
}

export interface IFundingDomainService {
  getSnapshot(userId?: string): Promise<ServiceFundingSnapshot>;
}

export interface IDashboardDomainService {
  getSnapshot(userId?: string): Promise<ServiceDashboardSnapshot>;
}

export interface IAdminDomainService {
  getSnapshot(): Promise<ServiceAdminSnapshot>;
}

export interface IAIDomainService {
  getContext(userId?: string): Promise<ServiceAIContext>;
}

export interface IHistoryDomainService {
  getHistory(userId?: string, limit?: number): Promise<ServiceHistoryEntry[]>;
}

export interface IMasterSignalDomainService {
  getLatestSignal(): Promise<ServiceMasterSignal | null>;
}

export interface IDeliveryDomainService {
  enqueueFromLatestSignal(signalVersion: string): Promise<ServiceDeliveryJob | null>;
  enqueueReference(reference: ServiceDeliveryReference): Promise<ServiceDeliveryJob>;
  peek(limit?: number): Promise<ServiceDeliveryJob[]>;
  processNext(): Promise<ServiceDeliveryJob | null>;
}

export interface IStatsDomainService {
  getSnapshot(): Promise<ServiceStatsSnapshot>;
}

export interface EcosystemServiceLayer {
  alerts: IAlertsDomainService;
  memberships: IMembershipsDomainService;
  payments: IPaymentsDomainService;
  bot: IBotDomainService;
  capital: ICapitalDomainService;
  operations: IOperationsDomainService;
  funding: IFundingDomainService;
  dashboard: IDashboardDomainService;
  results: IResultsDomainService;
  admin: IAdminDomainService;
  ai: IAIDomainService;
  history: IHistoryDomainService;
  masterSignal: IMasterSignalDomainService;
  delivery: IDeliveryDomainService;
  stats: IStatsDomainService;
}
