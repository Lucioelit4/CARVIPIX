import type {
  ICapitalDomainService,
  ServiceCapitalAccount,
  ServiceCapitalMovement,
  ServiceCapitalSnapshot,
  ServiceInvestorStats,
  ServiceMonthlyReport,
} from "../contracts";
import { InMemoryServiceEventBus } from "../core/event-bus";

const DEMO_CAPITAL_ACCOUNT: ServiceCapitalAccount = {
  accountId: "capital-demo-001",
  userId: "demo-user-001",
  initialCapital: 25000,
  currentBalance: 29340,
  utilidad: 4340,
  participacionCliente: 2604,
  participacionCARVIPIX: 1736,
  status: "active",
  fechaInicio: new Date(2024, 0, 1),
  monthlyReturn: 3.2,
  annualReturn: 38.4,
};

const DEMO_CAPITAL_MOVEMENTS: ServiceCapitalMovement[] = [
  {
    id: "mov-001",
    accountId: "capital-demo-001",
    type: "deposit",
    amount: 25000,
    fecha: new Date(2024, 0, 1),
    description: "Deposito inicial",
    balanceAfter: 25000,
  },
  {
    id: "mov-002",
    accountId: "capital-demo-001",
    type: "profit",
    amount: 1250,
    fecha: new Date(2024, 0, 15),
    description: "Utilidad mes enero",
    balanceAfter: 26250,
  },
  {
    id: "mov-003",
    accountId: "capital-demo-001",
    type: "profit",
    amount: 1850,
    fecha: new Date(2024, 1, 15),
    description: "Utilidad mes febrero",
    balanceAfter: 28100,
  },
  {
    id: "mov-004",
    accountId: "capital-demo-001",
    type: "profit",
    amount: 1240,
    fecha: new Date(2024, 2, 15),
    description: "Utilidad mes marzo",
    balanceAfter: 29340,
  },
];

const DEMO_MONTHLY_REPORTS: ServiceMonthlyReport[] = [
  {
    accountId: "capital-demo-001",
    mes: "Enero 2024",
    capitalInicial: 25000,
    capitalFinal: 26250,
    utilidad: 1250,
    participacionCliente: 750,
    participacionCARVIPIX: 500,
    rendimiento: 5.0,
  },
  {
    accountId: "capital-demo-001",
    mes: "Febrero 2024",
    capitalInicial: 26250,
    capitalFinal: 28100,
    utilidad: 1850,
    participacionCliente: 1110,
    participacionCARVIPIX: 740,
    rendimiento: 7.04,
  },
  {
    accountId: "capital-demo-001",
    mes: "Marzo 2024",
    capitalInicial: 28100,
    capitalFinal: 29340,
    utilidad: 1240,
    participacionCliente: 744,
    participacionCARVIPIX: 496,
    rendimiento: 4.41,
  },
];

function cloneAccount(account: ServiceCapitalAccount): ServiceCapitalAccount {
  return {
    ...account,
    fechaInicio: new Date(account.fechaInicio),
  };
}

function cloneMovement(movement: ServiceCapitalMovement): ServiceCapitalMovement {
  return {
    ...movement,
    fecha: new Date(movement.fecha),
  };
}

export class CapitalDomainService implements ICapitalDomainService {
  private readonly accounts: ServiceCapitalAccount[] = [cloneAccount(DEMO_CAPITAL_ACCOUNT)];

  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getCapitalAccount(userId: string): Promise<ServiceCapitalAccount | null> {
    const account = this.accounts.find((item) => item.userId === userId);

    this.eventBus.publish("capital.account.read", {
      userId,
      found: Boolean(account),
      queriedAt: new Date(),
    });

    return account ? cloneAccount(account) : null;
  }

  async getCapitalMovements(accountId: string): Promise<ServiceCapitalMovement[]> {
    const movements = DEMO_CAPITAL_MOVEMENTS.filter((item) => item.accountId === accountId).map(cloneMovement);

    this.eventBus.publish("capital.movements.read", {
      accountId,
      count: movements.length,
      queriedAt: new Date(),
    });

    return movements;
  }

  async getMonthlyReports(accountId: string): Promise<ServiceMonthlyReport[]> {
    const reports = DEMO_MONTHLY_REPORTS.filter((item) => item.accountId === accountId).map((item) => ({ ...item }));

    this.eventBus.publish("capital.reports.read", {
      accountId,
      count: reports.length,
      queriedAt: new Date(),
    });

    return reports;
  }

  async createCapitalAccount(userId: string, initialCapital: number): Promise<ServiceCapitalAccount> {
    const account: ServiceCapitalAccount = {
      accountId: `capital-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      initialCapital,
      currentBalance: initialCapital,
      utilidad: 0,
      participacionCliente: 0,
      participacionCARVIPIX: 0,
      status: "pending",
      fechaInicio: new Date(),
      monthlyReturn: 0,
      annualReturn: 0,
    };

    this.accounts.unshift(account);

    this.eventBus.publish("capital.account.created", {
      userId,
      accountId: account.accountId,
      queriedAt: new Date(),
    });

    return cloneAccount(account);
  }

  async getInvestorStats(): Promise<ServiceInvestorStats> {
    const stats: ServiceInvestorStats = {
      totalCapitalManaged: 150000,
      totalInvestors: 12,
      avgReturn: 4.2,
      topMonth: {
        month: "Febrero 2024",
        return: 7.04,
      },
    };

    this.eventBus.publish("capital.stats.read", {
      queriedAt: new Date(),
    });

    return stats;
  }

  async getSnapshot(userId?: string): Promise<ServiceCapitalSnapshot> {
    const account = userId ? this.accounts.find((item) => item.userId === userId) : this.accounts[0];

    return {
      generatedAt: new Date(),
      investorsCount: this.accounts.length,
      totalManaged: account?.currentBalance ?? 0,
      totalProfit: account?.utilidad ?? 0,
    };
  }
}
