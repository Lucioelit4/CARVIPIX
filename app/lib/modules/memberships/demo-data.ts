// Datos demo para membresías

import { UserProfile, Membership, PLAN_PERMISSIONS } from "./types";

export const DEMO_USER: UserProfile = {
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

export const DEMO_MEMBERSHIP: Membership = {
  userId: DEMO_USER.id,
  plan: "demo",
  estado: "activo",
  fechaInicio: new Date(2024, 0, 1),
  renovacionAutomatica: false,
};

export function getDemoUser(): UserProfile {
  return { ...DEMO_USER };
}

export function getUserPermissions(plan: string): typeof PLAN_PERMISSIONS[keyof typeof PLAN_PERMISSIONS] | null {
  return PLAN_PERMISSIONS[plan as keyof typeof PLAN_PERMISSIONS] || null;
}
