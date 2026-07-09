import type {
  IMembershipsDomainService,
  ServiceMembership,
  ServicePlanPermissions,
  ServicePlanType,
  ServiceUserProfile,
} from "../contracts";
import { resolveUserCommercialAccess } from "../commercial/plan-entitlements-store";
import { backendDatabase } from "../core/database";
import { InMemoryServiceEventBus } from "../core/event-bus";

type MembershipRow = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  plan: ServicePlanType;
  estado: ServiceUserProfile["estado"];
  fecha_activacion: Date;
  fecha_vencimiento: Date | null;
  verificado: boolean;
  membership_estado: ServiceMembership["estado"] | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  renovacion_automatica: boolean | null;
};

function getDefaultUserId() {
  return process.env.BACKEND_DEFAULT_USER_ID ?? "user-001";
}

function normalizePlan(plan: string | null | undefined): ServicePlanType {
  if (plan === "pro" || plan === "premium" || plan === "enterprise") {
    return plan;
  }

  return "demo";
}

function buildEmptyProfile(userId: string): ServiceUserProfile {
  return {
    id: userId,
    email: "Sin datos",
    nombre: "Sin datos",
    apellido: "",
    plan: "demo",
    estado: "inactivo",
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
}

function mapServicePlanPermissions(input: {
  subscriptionPlan: "free" | "basic" | "advanced";
  membershipActive: boolean;
  entitlements: {
    alertsEnabled: boolean;
    botEnabled: boolean;
    maxAlertsPerDay: number;
    maxBots: number;
  };
}): ServicePlanPermissions {
  const hasReports = input.subscriptionPlan === "basic" || input.subscriptionPlan === "advanced";
  const hasSupport = input.subscriptionPlan === "basic" || input.subscriptionPlan === "advanced";
  const hasAiBriefing = input.subscriptionPlan === "advanced";

  return {
    alertas: input.membershipActive && input.entitlements.alertsEnabled,
    bot: input.membershipActive && input.entitlements.botEnabled,
    capital: false,
    fondeo: false,
    reportes: input.membershipActive && hasReports,
    soporte: input.membershipActive && hasSupport,
    aiBriefing: input.membershipActive && hasAiBriefing,
    maxAlerts: input.membershipActive ? input.entitlements.maxAlertsPerDay : 0,
    maxBots: input.membershipActive ? input.entitlements.maxBots : 0,
  };
}

export class MembershipsDomainService implements IMembershipsDomainService {
  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getCurrentUserProfile(): Promise<ServiceUserProfile> {
    const defaultUserId = getDefaultUserId();

    const { rows } = await backendDatabase.query<MembershipRow>(
      `
      SELECT
        u.id,
        u.email,
        u.nombre,
        u.apellido,
        COALESCE(m.plan, u.plan, 'demo') AS plan,
        u.estado,
        u.fecha_activacion,
        u.fecha_vencimiento,
        u.verificado,
        m.estado AS membership_estado,
        m.fecha_inicio,
        m.fecha_fin,
        m.renovacion_automatica
      FROM users u
      LEFT JOIN memberships m ON m.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
      `,
      [defaultUserId]
    );

    if (rows.length === 0) {
      return buildEmptyProfile(defaultUserId);
    }

    const row = rows[0];
    const plan = normalizePlan(row.plan);
    const commercialAccess = await resolveUserCommercialAccess(row.id);
    const user: ServiceUserProfile = {
      id: row.id,
      email: row.email,
      nombre: row.nombre,
      apellido: row.apellido,
      plan,
      estado: row.estado,
      fechaActivacion: new Date(row.fecha_activacion),
      fechaVencimiento: row.fecha_vencimiento ? new Date(row.fecha_vencimiento) : undefined,
      permisos: mapServicePlanPermissions(commercialAccess),
      verificado: row.verificado,
    };

    this.eventBus.publish("memberships.user.read", {
      userId: user.id,
      queriedAt: new Date(),
    });

    return user;
  }

  async getCurrentMembership(): Promise<ServiceMembership> {
    const user = await this.getCurrentUserProfile();
    const queryMembership = async () =>
      backendDatabase.query<{
        plan: ServicePlanType;
        estado: ServiceMembership["estado"];
        fecha_inicio: Date;
        fecha_fin: Date | null;
        renovacion_automatica: boolean;
      }>(
        `
        SELECT plan, estado, fecha_inicio, fecha_fin, renovacion_automatica
        FROM memberships
        WHERE user_id = $1
        LIMIT 1
        `,
        [user.id]
      );

    let { rows } = await queryMembership();

    if (rows.length === 0) {
      await backendDatabase.query(
        `
        INSERT INTO memberships (user_id, plan, estado, fecha_inicio, renovacion_automatica)
        VALUES ($1, $2, 'inactivo', NOW(), false)
        ON CONFLICT (user_id) DO NOTHING
        `,
        [user.id, user.plan]
      );
      ({ rows } = await queryMembership());
    }

    const row = rows[0];
    const isActive = row?.estado === "activo" && (!row?.fecha_fin || row.fecha_fin > new Date());
    const resolvedStatus = isActive ? "activo" : row?.estado === "activo" ? "vencido" : row?.estado ?? "inactivo";
    const membership: ServiceMembership = {
      userId: user.id,
      plan: normalizePlan(row?.plan ?? user.plan),
      estado: resolvedStatus,
      fechaInicio: row?.fecha_inicio ? new Date(row.fecha_inicio) : new Date(user.fechaActivacion),
      fechaFin: row?.fecha_fin ? new Date(row.fecha_fin) : undefined,
      renovacionAutomatica: row?.renovacion_automatica ?? false,
    };

    this.eventBus.publish("memberships.plan.read", {
      userId: membership.userId,
      plan: membership.plan,
      queriedAt: new Date(),
    });

    return membership;
  }

  async hasPermission(
    permission: "alertas" | "bot" | "capital" | "fondeo" | "reportes" | "soporte" | "aiBriefing"
  ): Promise<boolean> {
    const user = await this.getCurrentUserProfile();
    const membership = await this.getCurrentMembership();
    const value = membership.estado === "activo" && user.permisos[permission];

    this.eventBus.publish("memberships.permission.read", {
      userId: user.id,
      permission,
      allowed: value,
      queriedAt: new Date(),
    });

    return value;
  }

  async getActivePlan(): Promise<ServicePlanType> {
    const user = await this.getCurrentUserProfile();
    const membership = await this.getCurrentMembership();

    this.eventBus.publish("memberships.active-plan.read", {
      userId: user.id,
      plan: membership.estado === "activo" ? user.plan : "demo",
      queriedAt: new Date(),
    });

    return membership.estado === "activo" ? user.plan : "demo";
  }
}
