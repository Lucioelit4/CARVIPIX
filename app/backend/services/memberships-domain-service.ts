import type {
  IMembershipsDomainService,
  ServiceMembership,
  ServicePlanPermissions,
  ServicePlanType,
  ServiceUserProfile,
} from "../contracts";
import { InMemoryServiceEventBus } from "../core/event-bus";

const PLAN_PERMISSIONS: Record<ServicePlanType, ServicePlanPermissions> = {
  demo: {
    alertas: true,
    bot: false,
    capital: false,
    fondeo: false,
    reportes: false,
    soporte: false,
    aiBriefing: false,
    maxAlerts: 5,
    maxBots: 0,
  },
  pro: {
    alertas: true,
    bot: true,
    capital: false,
    fondeo: false,
    reportes: true,
    soporte: true,
    aiBriefing: false,
    maxAlerts: 50,
    maxBots: 1,
  },
  premium: {
    alertas: true,
    bot: true,
    capital: true,
    fondeo: false,
    reportes: true,
    soporte: true,
    aiBriefing: true,
    maxAlerts: 100,
    maxBots: 3,
  },
  enterprise: {
    alertas: true,
    bot: true,
    capital: true,
    fondeo: true,
    reportes: true,
    soporte: true,
    aiBriefing: true,
    maxAlerts: 1000,
    maxBots: 10,
  },
};

const DEMO_USER: ServiceUserProfile = {
  id: "demo-user-001",
  email: "demo@carvipix.com",
  nombre: "Usuario",
  apellido: "Demo",
  plan: "demo",
  estado: "activo",
  fechaActivacion: new Date(2024, 0, 1),
  permisos: PLAN_PERMISSIONS.demo,
  verificado: true,
};

const DEMO_MEMBERSHIP: ServiceMembership = {
  userId: DEMO_USER.id,
  plan: "demo",
  estado: "activo",
  fechaInicio: new Date(2024, 0, 1),
  renovacionAutomatica: false,
};

function cloneUserProfile(profile: ServiceUserProfile): ServiceUserProfile {
  return {
    ...profile,
    fechaActivacion: new Date(profile.fechaActivacion),
    fechaVencimiento: profile.fechaVencimiento ? new Date(profile.fechaVencimiento) : undefined,
    permisos: {
      ...profile.permisos,
    },
  };
}

function cloneMembership(membership: ServiceMembership): ServiceMembership {
  return {
    ...membership,
    fechaInicio: new Date(membership.fechaInicio),
    fechaFin: membership.fechaFin ? new Date(membership.fechaFin) : undefined,
  };
}

export class MembershipsDomainService implements IMembershipsDomainService {
  constructor(private readonly eventBus: InMemoryServiceEventBus) {}

  async getCurrentUserProfile(): Promise<ServiceUserProfile> {
    const user = cloneUserProfile(DEMO_USER);

    this.eventBus.publish("memberships.user.read", {
      userId: user.id,
      queriedAt: new Date(),
    });

    return user;
  }

  async getCurrentMembership(): Promise<ServiceMembership> {
    const membership = cloneMembership(DEMO_MEMBERSHIP);

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
    const value = user.permisos[permission];

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

    this.eventBus.publish("memberships.active-plan.read", {
      userId: user.id,
      plan: user.plan,
      queriedAt: new Date(),
    });

    return user.plan;
  }
}
