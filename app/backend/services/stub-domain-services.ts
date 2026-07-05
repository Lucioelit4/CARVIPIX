import type {
  IAIDomainService,
  IAdminDomainService,
  IBotDomainService,
  ICapitalDomainService,
  IDashboardDomainService,
  IFundingDomainService,
  IHistoryDomainService,
  IStatsDomainService,
  ServiceAIContext,
  ServiceAdminSnapshot,
  ServiceBotSnapshot,
  ServiceCapitalSnapshot,
  ServiceDashboardSnapshot,
  ServiceFundingSnapshot,
  ServiceHistoryEntry,
  ServiceStatsSnapshot,
} from "../contracts";

export class BotDomainServiceStub implements IBotDomainService {
  async getLicense(): Promise<null> {
    return null;
  }

  async isLicenseValid(): Promise<boolean> {
    return false;
  }

  async getBotInstances(): Promise<[]> {
    return [];
  }

  async createBotInstance(): Promise<never> {
    throw new Error("Bot domain service stub does not support instance creation.");
  }

  async getAvailableUpdates(): Promise<[]> {
    return [];
  }

  async connectBroker(): Promise<boolean> {
    return false;
  }

  async getSnapshot(): Promise<ServiceBotSnapshot> {
    return {
      generatedAt: new Date(),
      runningInstances: 0,
      connectedAccounts: 0,
      health: "healthy",
    };
  }
}

export class CapitalDomainServiceStub implements ICapitalDomainService {
  async getCapitalAccount(): Promise<null> {
    return null;
  }

  async getCapitalMovements(): Promise<[]> {
    return [];
  }

  async getMonthlyReports(): Promise<[]> {
    return [];
  }

  async createCapitalAccount(): Promise<never> {
    throw new Error("Capital domain service stub does not support account creation.");
  }

  async getInvestorStats(): Promise<{
    totalCapitalManaged: number;
    totalInvestors: number;
    avgReturn: number;
    topMonth: { month: string; return: number };
  }> {
    return {
      totalCapitalManaged: 0,
      totalInvestors: 0,
      avgReturn: 0,
      topMonth: {
        month: "N/A",
        return: 0,
      },
    };
  }

  async getSnapshot(): Promise<ServiceCapitalSnapshot> {
    return {
      generatedAt: new Date(),
      investorsCount: 0,
      totalManaged: 0,
      totalProfit: 0,
    };
  }
}

export class FundingDomainServiceStub implements IFundingDomainService {
  async getSnapshot(): Promise<ServiceFundingSnapshot> {
    return {
      generatedAt: new Date(),
      activePrograms: 0,
      approvedAccounts: 0,
      totalCapital: 0,
    };
  }
}

export class DashboardDomainServiceStub implements IDashboardDomainService {
  async getSnapshot(): Promise<ServiceDashboardSnapshot> {
    return {
      generatedAt: new Date(),
      activeAlerts: 0,
      recentSignals: 0,
      engineHealth: "healthy",
    };
  }
}

export class AdminDomainServiceStub implements IAdminDomainService {
  async getSnapshot(): Promise<ServiceAdminSnapshot> {
    return {
      generatedAt: new Date(),
      engineStatus: "healthy",
      activeUsers: 0,
      pendingIncidents: 0,
    };
  }
}

export class AIDomainServiceStub implements IAIDomainService {
  async getContext(): Promise<ServiceAIContext> {
    return {
      generatedAt: new Date(),
      summary: "AI context service initialized.",
      contextVersion: "v1",
    };
  }
}

export class HistoryDomainServiceStub implements IHistoryDomainService {
  async getHistory(): Promise<ServiceHistoryEntry[]> {
    return [];
  }
}

export class StatsDomainServiceStub implements IStatsDomainService {
  async getSnapshot(): Promise<ServiceStatsSnapshot> {
    return {
      generatedAt: new Date(),
      totalEvents: 0,
      activeUsers: 0,
      avgLatencyMs: 0,
    };
  }
}
