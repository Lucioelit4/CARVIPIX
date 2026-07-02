// Servicio de membresías (preparado para APIs reales)

import { UserProfile, Membership, PlanType, PLAN_PERMISSIONS } from "./types";
import { getDemoUser, DEMO_MEMBERSHIP } from "./demo-data";

export class MembershipsService {
  private isDemoMode = true;

  // Obtener perfil del usuario actual
  async getCurrentUserProfile(): Promise<UserProfile> {
    if (this.isDemoMode) {
      return getDemoUser();
    }
    // FUTURE: Conectar a API real
    // const response = await fetch('/api/user/profile');
    // return response.json();
    throw new Error("API no conectada todavía");
  }

  // Obtener membresía actual
  async getCurrentMembership(): Promise<Membership> {
    if (this.isDemoMode) {
      return { ...DEMO_MEMBERSHIP };
    }
    // FUTURE: Conectar a API real
    throw new Error("API no conectada todavía");
  }

  // Verificar si usuario tiene permiso para módulo
  async hasPermission(permission: "alertas" | "bot" | "capital" | "fondeo" | "reportes" | "soporte" | "aiBriefing"): Promise<boolean> {
    const user = await this.getCurrentUserProfile();
    const permValue = user.permisos[permission];
    return typeof permValue === "boolean" ? permValue : false;
  }

  // Obtener plan activo
  async getActivePlan(): Promise<PlanType> {
    const user = await this.getCurrentUserProfile();
    return user.plan;
  }

  // Cambiar modo demo/producción (para testing)
  setDemoMode(isDemoMode: boolean) {
    this.isDemoMode = isDemoMode;
  }
}

export const membershipsService = new MembershipsService();
