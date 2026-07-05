import type {
  IBotDomainService,
  ServiceBotInstance,
  ServiceBotLicense,
  ServiceBotSnapshot,
  ServiceBotUpdate,
} from "../contracts";
import { InMemoryServiceEventBus } from "../core/event-bus";

const DEMO_BOT_LICENSE: ServiceBotLicense = {
  userId: "demo-user-001",
  licenseKey: "CARVIPIX-DEMO-KEY-12345",
  purchaseDate: new Date(2024, 0, 1),
  active: true,
  brokerConnected: undefined,
};

const DEMO_BOT_INSTANCE: ServiceBotInstance = {
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

const DEMO_BOT_UPDATES: ServiceBotUpdate[] = [
  {
    version: "2.1.0",
    releaseDate: new Date(2024, 5, 15),
    features: ["Soporte para USDT", "Modo demo mejorado"],
    improvements: ["Performance 30% mejor", "UI mas intuitiva"],
    bugFixes: ["Corrige lag en ordenes rapidas"],
  },
  {
    version: "2.0.5",
    releaseDate: new Date(2024, 4, 1),
    features: ["Analisis de riesgo en vivo"],
    improvements: ["Conexion mas rapida"],
    bugFixes: ["Corrige desconexiones ocasionales"],
  },
];

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneInstance(instance: ServiceBotInstance): ServiceBotInstance {
  return {
    ...instance,
    configuration: { ...instance.configuration },
    createdAt: new Date(instance.createdAt),
    startedAt: instance.startedAt ? new Date(instance.startedAt) : undefined,
    stats: { ...instance.stats },
  };
}

export class BotDomainService implements IBotDomainService {
  private readonly botInstances: ServiceBotInstance[] = [cloneInstance(DEMO_BOT_INSTANCE)];

  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getLicense(userId: string): Promise<ServiceBotLicense | null> {
    const license = userId === DEMO_BOT_LICENSE.userId ? { ...DEMO_BOT_LICENSE } : null;

    this.eventBus.publish("bot.license.read", {
      userId,
      found: Boolean(license),
      queriedAt: new Date(),
    });

    return license;
  }

  async isLicenseValid(userId: string): Promise<boolean> {
    const license = await this.getLicense(userId);
    return Boolean(license?.active);
  }

  async getBotInstances(userId: string): Promise<ServiceBotInstance[]> {
    const instances = this.botInstances.filter((item) => item.userId === userId).map(cloneInstance);

    this.eventBus.publish("bot.instances.read", {
      userId,
      count: instances.length,
      queriedAt: new Date(),
    });

    return instances;
  }

  async createBotInstance(
    userId: string,
    instance: Omit<ServiceBotInstance, "id" | "userId" | "createdAt" | "stats">
  ): Promise<ServiceBotInstance> {
    const created: ServiceBotInstance = {
      ...instance,
      id: createId("bot"),
      userId,
      createdAt: new Date(),
      stats: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitLoss: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
      },
    };

    this.botInstances.unshift(created);

    this.eventBus.publish("bot.instance.created", {
      userId,
      botId: created.id,
      queriedAt: new Date(),
    });

    return cloneInstance(created);
  }

  async getAvailableUpdates(): Promise<ServiceBotUpdate[]> {
    this.eventBus.publish("bot.updates.read", {
      count: DEMO_BOT_UPDATES.length,
      queriedAt: new Date(),
    });

    return DEMO_BOT_UPDATES.map((item) => ({
      ...item,
      releaseDate: new Date(item.releaseDate),
      features: [...item.features],
      improvements: [...item.improvements],
      bugFixes: [...item.bugFixes],
    }));
  }

  async connectBroker(
    botId: string,
    brokerType: "MT4" | "MT5",
    credentials: {
      server: string;
      login: string;
      password: string;
    }
  ): Promise<boolean> {
    const bot = this.botInstances.find((item) => item.id === botId);
    if (!bot) {
      throw new Error("Bot no encontrado");
    }

    void credentials;

    this.eventBus.publish("bot.broker.connected", {
      botId,
      brokerType,
      queriedAt: new Date(),
    });

    return true;
  }

  async getSnapshot(userId?: string): Promise<ServiceBotSnapshot> {
    const source = userId ? this.botInstances.filter((item) => item.userId === userId) : this.botInstances;

    const connectedAccounts = source.filter((item) => item.status === "running" || item.status === "paused").length;
    const runningInstances = source.filter((item) => item.status === "running").length;

    return {
      generatedAt: new Date(),
      runningInstances,
      connectedAccounts,
      health: "healthy",
    };
  }
}
