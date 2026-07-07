import type {
  ICapitalDomainService,
  ServiceCapitalAccount,
  ServiceCapitalMovement,
  ServiceCapitalSnapshot,
  ServiceInvestorStats,
  ServiceMonthlyReport,
} from "../contracts";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";

type CapitalAccountRow = {
  account_id: string;
  user_id: string;
  initial_capital: number;
  current_balance: number;
  utilidad: number;
  participacion_cliente: number;
  participacion_carvipix: number;
  status: ServiceCapitalAccount["status"];
  fecha_inicio: Date;
  monthly_return: number;
  annual_return: number;
};

type CapitalMovementRow = {
  id: string;
  account_id: string;
  type: ServiceCapitalMovement["type"];
  amount: number;
  fecha: Date;
  description: string;
  balance_after: number;
};

function mapAccount(row: CapitalAccountRow): ServiceCapitalAccount {
  return {
    accountId: row.account_id,
    userId: row.user_id,
    initialCapital: Number(row.initial_capital),
    currentBalance: Number(row.current_balance),
    utilidad: Number(row.utilidad),
    participacionCliente: Number(row.participacion_cliente),
    participacionCARVIPIX: Number(row.participacion_carvipix),
    status: row.status,
    fechaInicio: new Date(row.fecha_inicio),
    monthlyReturn: Number(row.monthly_return),
    annualReturn: Number(row.annual_return),
  };
}

function mapMovement(row: CapitalMovementRow): ServiceCapitalMovement {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type,
    amount: Number(row.amount),
    fecha: new Date(row.fecha),
    description: row.description,
    balanceAfter: Number(row.balance_after),
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CapitalDomainService implements ICapitalDomainService {
  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getCapitalAccount(userId: string): Promise<ServiceCapitalAccount | null> {
    const { rows } = await backendDatabase.query<CapitalAccountRow>(
      `
      SELECT
        ca.account_id,
        ca.user_id,
        ca.initial_capital,
        ca.current_balance,
        ca.utilidad,
        ca.participacion_cliente,
        ca.participacion_carvipix,
        ca.status,
        ca.fecha_inicio,
        ca.monthly_return,
        ca.annual_return
      FROM capital_accounts ca
      INNER JOIN users u ON u.id = ca.user_id
      LEFT JOIN memberships m ON m.user_id = ca.user_id
      WHERE ca.user_id = $1
        AND u.estado = 'activo'
        AND COALESCE(m.estado, 'activo') <> 'cancelado'
      ORDER BY fecha_inicio DESC
      LIMIT 1
      `,
      [userId]
    );
    const account = rows[0] ? mapAccount(rows[0]) : null;

    this.eventBus.publish("capital.account.read", {
      userId,
      found: Boolean(account),
      queriedAt: new Date(),
    });

    return account;
  }

  async getCapitalMovements(accountId: string): Promise<ServiceCapitalMovement[]> {
    const { rows } = await backendDatabase.query<CapitalMovementRow>(
      `
      SELECT id, account_id, type, amount, fecha, description, balance_after
      FROM capital_movements
      WHERE account_id = $1
      ORDER BY fecha DESC
      `,
      [accountId]
    );
    const movements = rows.map(mapMovement);

    this.eventBus.publish("capital.movements.read", {
      accountId,
      count: movements.length,
      queriedAt: new Date(),
    });

    return movements;
  }

  async getMonthlyReports(accountId: string): Promise<ServiceMonthlyReport[]> {
    const { rows } = await backendDatabase.query<{
      account_id: string;
      mes: string;
      capital_inicial: number;
      capital_final: number;
      utilidad: number;
      participacion_cliente: number;
      participacion_carvipix: number;
      rendimiento: number;
    }>(
      `
      SELECT
        account_id,
        mes,
        capital_inicial,
        capital_final,
        utilidad,
        participacion_cliente,
        participacion_carvipix,
        rendimiento
      FROM monthly_reports
      WHERE account_id = $1
      ORDER BY id DESC
      `,
      [accountId]
    );

    const reports = rows.map((item) => ({
      accountId: item.account_id,
      mes: item.mes,
      capitalInicial: Number(item.capital_inicial),
      capitalFinal: Number(item.capital_final),
      utilidad: Number(item.utilidad),
      participacionCliente: Number(item.participacion_cliente),
      participacionCARVIPIX: Number(item.participacion_carvipix),
      rendimiento: Number(item.rendimiento),
    }));

    this.eventBus.publish("capital.reports.read", {
      accountId,
      count: reports.length,
      queriedAt: new Date(),
    });

    return reports;
  }

  async createCapitalAccount(userId: string, initialCapital: number): Promise<ServiceCapitalAccount> {
    const account = await backendDatabase.withTransaction<ServiceCapitalAccount>(async (client) => {
      const userResult = await client.query<{ id: string; plan: string }>(
        `
        SELECT u.id, COALESCE(m.plan, u.plan, 'demo') AS plan
        FROM users u
        LEFT JOIN memberships m ON m.user_id = u.id
        WHERE u.id = $1 AND u.estado = 'activo'
        LIMIT 1
        `,
        [userId]
      );

      const userRow = userResult.rows[0];
      if (!userRow) {
        throw new Error("Usuario no encontrado o inactivo para crear cuenta de capital");
      }

      await client.query(
        `
        INSERT INTO memberships (user_id, plan, estado, fecha_inicio, renovacion_automatica)
        VALUES ($1, $2, 'activo', NOW(), true)
        ON CONFLICT (user_id) DO NOTHING
        `,
        [userId, userRow.plan]
      );

      const accountId = createId("capital");
      const movementId = createId("mov");
      const operationId = createId("op");
      const now = new Date();
      const reportMonth = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

      await client.query(
        `
        INSERT INTO capital_accounts (
          account_id,
          user_id,
          initial_capital,
          current_balance,
          utilidad,
          participacion_cliente,
          participacion_carvipix,
          status,
          fecha_inicio,
          monthly_return,
          annual_return
        )
        VALUES ($1, $2, $3, $3, 0, 0, 0, 'pending', $4, 0, 0)
        `,
        [accountId, userId, initialCapital, now]
      );

      await client.query(
        `
        INSERT INTO capital_movements (id, account_id, type, amount, fecha, description, balance_after)
        VALUES ($1, $2, 'deposit', $3, $4, 'Capital inicial asignado', $3)
        `,
        [movementId, accountId, initialCapital, now]
      );

      await client.query(
        `
        INSERT INTO operations (id, user_id, account_id, symbol, side, status, pnl, executed_at, metadata)
        VALUES ($1, $2, $3, 'CAPITAL', 'deposit', 'completed', 0, $4, $5::jsonb)
        `,
        [
          operationId,
          userId,
          accountId,
          now,
          JSON.stringify({
            module: "capital",
            movementId,
            reportMonth,
          }),
        ]
      );

      await client.query(
        `
        INSERT INTO monthly_reports (
          account_id,
          mes,
          capital_inicial,
          capital_final,
          utilidad,
          participacion_cliente,
          participacion_carvipix,
          rendimiento
        )
        VALUES ($1, $2, $3, $3, 0, 0, 0, 0)
        ON CONFLICT (account_id, mes) DO NOTHING
        `,
        [accountId, reportMonth, initialCapital]
      );

      return {
        accountId,
        userId,
        initialCapital,
        currentBalance: initialCapital,
        utilidad: 0,
        participacionCliente: 0,
        participacionCARVIPIX: 0,
        status: "pending",
        fechaInicio: now,
        monthlyReturn: 0,
        annualReturn: 0,
      };
    });

    this.eventBus.publish("capital.account.created", {
      userId,
      accountId: account.accountId,
      queriedAt: new Date(),
    });

    return account;
  }

  async getInvestorStats(): Promise<ServiceInvestorStats> {
    const [aggregateResult, topMonthResult] = await Promise.all([
      backendDatabase.query<{
        total_capital_managed: number;
        total_investors: number;
        avg_return: number;
      }>(
        `
        SELECT
          COALESCE(SUM(ca.current_balance), 0) AS total_capital_managed,
          COUNT(*) AS total_investors,
          COALESCE(AVG(ca.monthly_return), 0) AS avg_return
        FROM capital_accounts ca
        INNER JOIN users u ON u.id = ca.user_id
        LEFT JOIN memberships m ON m.user_id = ca.user_id
        WHERE ca.status <> 'closed'
          AND u.estado = 'activo'
          AND COALESCE(m.estado, 'activo') <> 'cancelado'
        `
      ),
      backendDatabase.query<{ month: string; return_value: number }>(
        `
        SELECT mes AS month, rendimiento AS return_value
        FROM monthly_reports
        ORDER BY rendimiento DESC
        LIMIT 1
        `
      ),
    ]);

    const aggregate = aggregateResult.rows[0];
    const top = topMonthResult.rows[0];

    const stats: ServiceInvestorStats = {
      totalCapitalManaged: Number(aggregate?.total_capital_managed ?? 0),
      totalInvestors: Number(aggregate?.total_investors ?? 0),
      avgReturn: Number(aggregate?.avg_return ?? 0),
      topMonth: {
        month: top?.month ?? "Sin datos",
        return: Number(top?.return_value ?? 0),
      },
    };

    this.eventBus.publish("capital.stats.read", {
      queriedAt: new Date(),
    });

    return stats;
  }

  async getSnapshot(userId?: string): Promise<ServiceCapitalSnapshot> {
    const [aggregateResult, accountResult] = await Promise.all([
      backendDatabase.query<{ investors_count: number; total_managed: number; total_profit: number }>(
        `
        SELECT
          COUNT(*) AS investors_count,
          COALESCE(SUM(ca.current_balance), 0) AS total_managed,
          COALESCE(SUM(ca.utilidad), 0) AS total_profit
        FROM capital_accounts ca
        INNER JOIN users u ON u.id = ca.user_id
        LEFT JOIN memberships m ON m.user_id = ca.user_id
        WHERE ca.status <> 'closed'
          AND u.estado = 'activo'
          AND COALESCE(m.estado, 'activo') <> 'cancelado'
        `
      ),
      userId
        ? backendDatabase.query<{ total_managed: number; total_profit: number }>(
            `
            SELECT current_balance AS total_managed, utilidad AS total_profit
            FROM capital_accounts
            WHERE user_id = $1
            ORDER BY fecha_inicio DESC
            LIMIT 1
            `,
            [userId]
          )
        : Promise.resolve({ rows: [] } as { rows: { total_managed: number; total_profit: number }[] }),
    ]);

    const aggregate = aggregateResult.rows[0];
    const account = accountResult.rows[0];

    return {
      generatedAt: new Date(),
      investorsCount: Number(aggregate?.investors_count ?? 0),
      totalManaged: Number(account?.total_managed ?? aggregate?.total_managed ?? 0),
      totalProfit: Number(account?.total_profit ?? aggregate?.total_profit ?? 0),
    };
  }
}
