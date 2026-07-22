import type {
  IBotDomainService,
  ServiceBotInstance,
  ServiceBotLicense,
  ServiceBotSnapshot,
  ServiceBotUpdate,
} from "../contracts";
import { BotLimitGuard, PairAccessGuard } from "../commercial/access-control";
import { resolveUserCommercialAccess } from "../commercial/plan-entitlements-store";
import { backendDatabase } from "../core/database";
import {
  getLocalBotInstanceById,
  getLocalBotLicense,
  listLocalBotConnections,
  listLocalBotInstances,
  listLocalBotUpdates,
  upsertLocalBotInstance,
  upsertLocalBotLicense,
} from "../core/local-bot-store";
import { InMemoryServiceEventBus } from "../core/event-bus";
import { realSignalLifecycleService } from "./real-signal-lifecycle-service";
import { getFounderAccess } from "../founder-access/service";
import { isFounderAccessSnapshotActive } from "../founder-access/types";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type BotLicenseRow = {
  user_id: string;
  license_key: string;
  purchase_date: Date;
  expiry_date: Date | null;
  active: boolean;
  broker_connected: "MT4" | "MT5" | null;
};

type BotInstanceRow = {
  id: string;
  user_id: string;
  name: string;
  strategy: ServiceBotInstance["strategy"];
  status: ServiceBotInstance["status"];
  symbol: string;
  risk_level: ServiceBotInstance["riskLevel"];
  configuration: unknown;
  created_at: Date;
  started_at: Date | null;
  stats: unknown;
};

function toLicense(row: BotLicenseRow): ServiceBotLicense {
  return {
    userId: row.user_id,
    licenseKey: row.license_key,
    purchaseDate: new Date(row.purchase_date),
    expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
    active: row.active,
    brokerConnected: row.broker_connected ?? undefined,
  };
}

function toInstance(row: BotInstanceRow): ServiceBotInstance {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    strategy: row.strategy,
    status: row.status,
    symbol: row.symbol,
    riskLevel: row.risk_level,
    configuration: typeof row.configuration === "object" && row.configuration ? (row.configuration as Record<string, unknown>) : {},
    createdAt: new Date(row.created_at),
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    stats: typeof row.stats === "object" && row.stats
      ? (row.stats as ServiceBotInstance["stats"])
      : {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          profitLoss: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
        },
  };
}

export class BotDomainService implements IBotDomainService {
  private readonly botLimitGuard = new BotLimitGuard();

  private readonly pairAccessGuard = new PairAccessGuard();

  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getLicense(userId: string): Promise<ServiceBotLicense | null> {
    const founderAccess = await getFounderAccess(userId);
    if (isFounderAccessSnapshotActive(founderAccess) && founderAccess.licenseId) {
      return {
        userId,
        licenseKey: founderAccess.licenseId,
        purchaseDate: founderAccess.activatedAt,
        active: true,
        licenseType: "FOUNDER",
        paymentRequired: false,
      };
    }

    if (!backendDatabase.enabled) {
      const license = await getLocalBotLicense(userId);
      return license
        ? {
            userId: license.userId,
            licenseKey: license.licenseKey,
            purchaseDate: new Date(license.purchaseDate),
            expiryDate: license.expiryDate ? new Date(license.expiryDate) : undefined,
            active: license.active,
            brokerConnected: license.brokerConnected ?? undefined,
          }
        : null;
    }

    const { rows } = await backendDatabase.query<BotLicenseRow>(
      `
      SELECT user_id, license_key, purchase_date, expiry_date, active, broker_connected
      FROM bot_licenses
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );
    const license = rows[0] ? toLicense(rows[0]) : null;

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
    if (!backendDatabase.enabled) {
      const instances = await listLocalBotInstances(userId);
      return instances.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        startedAt: item.startedAt ? new Date(item.startedAt) : undefined,
      }));
    }

    const { rows } = await backendDatabase.query<BotInstanceRow>(
      `
      SELECT id, user_id, name, strategy, status, symbol, risk_level, configuration, created_at, started_at, stats
      FROM bot_instances
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );
    const instances = rows.map(toInstance);

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
    const commercialAccess = await resolveUserCommercialAccess(userId);
    const guardContext = {
      membershipActive: commercialAccess.membershipActive,
      entitlements: commercialAccess.entitlements,
    };
    const existingInstances = await this.getBotInstances(userId);
    this.botLimitGuard.assertCanCreateBot(guardContext, existingInstances.length);

    const normalizedSymbol = String(instance.symbol ?? "").trim().toUpperCase();
    this.pairAccessGuard.assertPairAccess(guardContext, {
      feature: "bot",
      pair: normalizedSymbol,
      existingPairs: existingInstances.map((item) => item.symbol),
    });

    const created: ServiceBotInstance = {
      ...instance,
      id: createId("bot"),
      userId,
      symbol: normalizedSymbol,
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

    if (!backendDatabase.enabled) {
      await upsertLocalBotInstance({
        ...created,
        createdAt: created.createdAt.toISOString(),
        startedAt: created.startedAt ? created.startedAt.toISOString() : null,
      });

      this.eventBus.publish("bot.instance.created", {
        userId,
        botId: created.id,
        queriedAt: new Date(),
      });

      return created;
    }

    await backendDatabase.query(
      `
      INSERT INTO bot_instances (
        id,
        user_id,
        name,
        strategy,
        status,
        symbol,
        risk_level,
        configuration,
        created_at,
        started_at,
        stats
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb)
      `,
      [
        created.id,
        created.userId,
        created.name,
        created.strategy,
        created.status,
        created.symbol,
        created.riskLevel,
        JSON.stringify(created.configuration),
        created.createdAt,
        created.startedAt ?? null,
        JSON.stringify(created.stats),
      ]
    );

    this.eventBus.publish("bot.instance.created", {
      userId,
      botId: created.id,
      queriedAt: new Date(),
    });

    return created;
  }

  async getAvailableUpdates(): Promise<ServiceBotUpdate[]> {
    if (!backendDatabase.enabled) {
      const updates = await listLocalBotUpdates();
      return updates.map((item) => ({
        version: item.version,
        releaseDate: new Date(item.releaseDate),
        features: item.features,
        improvements: item.improvements,
        bugFixes: item.bugFixes,
      }));
    }

    const { rows } = await backendDatabase.query<{
      version: string;
      release_date: Date;
      features: unknown;
      improvements: unknown;
      bug_fixes: unknown;
    }>(
      `
      SELECT version, release_date, features, improvements, bug_fixes
      FROM bot_updates
      ORDER BY release_date DESC
      `
    );

    const updates = rows.map((item) => ({
      version: item.version,
      releaseDate: new Date(item.release_date),
      features: Array.isArray(item.features) ? (item.features as string[]) : [],
      improvements: Array.isArray(item.improvements) ? (item.improvements as string[]) : [],
      bugFixes: Array.isArray(item.bug_fixes) ? (item.bug_fixes as string[]) : [],
    }));

    this.eventBus.publish("bot.updates.read", {
      count: updates.length,
      queriedAt: new Date(),
    });

    return updates;
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
    if (!backendDatabase.enabled) {
      const localBot = await getLocalBotInstanceById(botId);
      if (!localBot) {
        throw new Error("Bot no encontrado");
      }

      void credentials;
      await upsertLocalBotLicense({
        userId: localBot.userId,
        licenseKey: `CARVIPIX-${localBot.userId.toUpperCase()}-LICENSE`,
        purchaseDate: new Date().toISOString(),
        expiryDate: null,
        active: true,
        brokerConnected: brokerType,
      });

      this.eventBus.publish("bot.broker.connected", {
        botId,
        brokerType,
        queriedAt: new Date(),
      });

      return true;
    }

    const botResult = await backendDatabase.query<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM bot_instances WHERE id = $1 LIMIT 1`,
      [botId]
    );
    const bot = botResult.rows[0];

    if (!bot) {
      throw new Error("Bot no encontrado");
    }

    void credentials;

    await backendDatabase.query(
      `
      INSERT INTO bot_licenses (user_id, license_key, purchase_date, active, broker_connected)
      VALUES ($1, $2, NOW(), true, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET broker_connected = EXCLUDED.broker_connected, active = true
      `,
      [bot.user_id, `CARVIPIX-${bot.user_id.toUpperCase()}-LICENSE`, brokerType]
    );

    this.eventBus.publish("bot.broker.connected", {
      botId,
      brokerType,
      queriedAt: new Date(),
    });

    return true;
  }

  async getSnapshot(userId?: string): Promise<ServiceBotSnapshot> {
    await realSignalLifecycleService.ensureLatestMasterSignalRegistered();
    if (!backendDatabase.enabled) {
      const instances = userId ? await listLocalBotInstances(userId) : [];
      const connections = userId ? await listLocalBotConnections(userId) : [];
      return {
        generatedAt: new Date(),
        runningInstances: instances.filter((item) => item.status === "running").length,
        connectedAccounts: connections.filter((item) => item.connectionStatus === "connected").length,
        health: instances.length > 0 ? "healthy" : "degraded",
      };
    }

    const [{ rows }, lifecycleSignals] = await Promise.all([
      backendDatabase.query<{ running_instances: number; connected_accounts: number }>(
      userId
        ? `
          SELECT
            COUNT(*) FILTER (WHERE status = 'running') AS running_instances,
            COUNT(*) FILTER (WHERE status IN ('running', 'paused')) AS connected_accounts
          FROM bot_instances
          WHERE user_id = $1
          `
        : `
          SELECT
            COUNT(*) FILTER (WHERE status = 'running') AS running_instances,
            COUNT(*) FILTER (WHERE status IN ('running', 'paused')) AS connected_accounts
          FROM bot_instances
          `,
      userId ? [userId] : []
      ),
      backendDatabase.query<{ active_signals: number }>(
        `
        SELECT COUNT(*)::int AS active_signals
        FROM real_signal_lifecycle
        WHERE signal_status IN ('CREATED', 'CONDITIONAL', 'ACTIVE')
          AND decision NOT IN ('WAIT', 'NO_TRADE', 'DATA_INSUFFICIENT')
        `
      ),
    ]);

    const snapshot = rows[0] ?? { running_instances: 0, connected_accounts: 0 };
    const signals = lifecycleSignals.rows[0];

    return {
      generatedAt: new Date(),
      runningInstances: Math.max(Number(snapshot.running_instances ?? 0), Number(signals?.active_signals ?? 0)),
      connectedAccounts: Number(snapshot.connected_accounts ?? 0),
      health: "healthy",
    };
  }
}
