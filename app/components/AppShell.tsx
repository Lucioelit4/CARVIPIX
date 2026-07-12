"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ProtectedDashboardGuard from "./ProtectedDashboardGuard";
import WorkspaceHero from "./WorkspaceHero";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isStandaloneRoute =
    pathname === "/" ||
    pathname === "/servicios" ||
    pathname.startsWith("/servicios/") ||
    pathname.startsWith("/checkout") ||
    pathname === "/login" ||
    pathname === "/crear-cuenta" ||
    pathname === "/registro" ||
    pathname === "/recuperar-password" ||
    pathname === "/verificar-correo" ||
    pathname === "/legal" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/risk-disclosure" ||
    pathname === "/cookies" ||
    pathname === "/cancelacion" ||
    pathname === "/reembolsos" ||
    pathname === "/pagos-recurrentes" ||
    isAdminRoute;

  if (isStandaloneRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="cv-app-shell flex min-h-screen flex-1 flex-col pt-[76px] lg:ml-72 lg:pt-0">
        <WorkspaceHero />
        <div className="cv-workspace cv-page-content">
          <ProtectedDashboardGuard>{children}</ProtectedDashboardGuard>
        </div>
        <Footer />
      </div>
    </>
  );
}