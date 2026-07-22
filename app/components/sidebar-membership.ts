export type SidebarMembership = {
  plan?: string | null;
  estado?: string | null;
  active?: boolean;
};

export function resolveSidebarMembershipLabel(membership: SidebarMembership | null | undefined): string {
  const status = String(membership?.estado ?? "").trim().toLowerCase();
  const plan = String(membership?.plan ?? "").trim().toLowerCase();

  if (status === "vencido" || status === "expirado") {
    return "Membresía vencida";
  }

  if (!membership?.active) {
    return "Sin membresía";
  }

  if (plan.includes("founder") || plan.includes("fundador")) {
    return "Fundador";
  }

  if (plan === "basic" || plan === "básico" || plan === "basico") {
    return "Básico";
  }

  if (["pro", "advanced", "premium", "enterprise", "elite"].includes(plan)) {
    return "Pro";
  }

  return "Sin membresía";
}