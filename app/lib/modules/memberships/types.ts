// Tipos para gestión de membresías y permisos

export type PlanType = "demo" | "pro" | "premium" | "enterprise";

export interface PlanPermissions {
  alertas: boolean;
  bot: boolean;
  capital: boolean;
  fondeo: boolean;
  reportes: boolean;
  soporte: boolean;
  aiBriefing: boolean;
  maxAlerts: number;
  maxBots: number;
}

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  plan: PlanType;
  estado: "activo" | "inactivo" | "suspendido";
  fechaActivacion: Date;
  fechaVencimiento?: Date;
  permisos: PlanPermissions;
  verificado: boolean;
}

export interface Membership {
  userId: string;
  plan: PlanType;
  estado: "activo" | "cancelado" | "vencido";
  fechaInicio: Date;
  fechaFin?: Date;
  renovacionAutomatica: boolean;
}

export const PLAN_PERMISSIONS: Record<PlanType, PlanPermissions> = {
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
