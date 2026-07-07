import type { AuthRole } from "./session";

export type MembershipStatus = "activo" | "cancelado" | "vencido" | "inactivo";
export type AccessTier = "visitante" | "usuario_registrado" | "miembro_activo" | "administrador";

export type RouteAccessContext = {
  role: AuthRole;
  isAdminSession: boolean;
  membershipStatus?: MembershipStatus | null;
};

export function resolveAccessTier(context: RouteAccessContext): AccessTier {
  if (context.isAdminSession) {
    return "administrador";
  }

  if (context.role !== "cliente") {
    return "visitante";
  }

  if (context.membershipStatus === "activo") {
    return "miembro_activo";
  }

  return "usuario_registrado";
}

export function canAccessRoute(pathname: string, context: RouteAccessContext): boolean {
  if (pathname.startsWith("/admin")) {
    return context.isAdminSession;
  }

  const tier = resolveAccessTier(context);

  if (pathname.startsWith("/dashboard")) {
    return tier === "miembro_activo" || tier === "administrador";
  }

  const memberOnlyRoutes = ["/alertas", "/bot", "/capital", "/fondeo", "/gestion-capital", "/resultados", "/analisis", "/comunidad", "/herramientas", "/perfil", "/soporte"];
  if (memberOnlyRoutes.some((route) => pathname.startsWith(route))) {
    return tier === "miembro_activo";
  }

  return true;
}
