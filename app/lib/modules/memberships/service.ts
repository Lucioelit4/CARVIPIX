// Servicio de membresias delegado al Backend Enterprise

import { UserProfile, Membership, PlanType } from "./types";
import { ecosystemServices } from "@/app/backend";

export class MembershipsService {
  // Obtener perfil del usuario actual
  async getCurrentUserProfile(): Promise<UserProfile> {
    return ecosystemServices.memberships.getCurrentUserProfile();
  }

  // Obtener membresía actual
  async getCurrentMembership(): Promise<Membership> {
    return ecosystemServices.memberships.getCurrentMembership();
  }

  // Verificar si usuario tiene permiso para módulo
  async hasPermission(permission: "alertas" | "bot" | "capital" | "fondeo" | "reportes" | "soporte" | "aiBriefing"): Promise<boolean> {
    return ecosystemServices.memberships.hasPermission(permission);
  }

  // Obtener plan activo
  async getActivePlan(): Promise<PlanType> {
    return ecosystemServices.memberships.getActivePlan();
  }

  // Compatibilidad con el API previo sin cambiar el frontend.
  setDemoMode(_isDemoMode: boolean) {
    // No-op: la fuente de datos oficial es Backend Enterprise.
  }
}

export const membershipsService = new MembershipsService();
