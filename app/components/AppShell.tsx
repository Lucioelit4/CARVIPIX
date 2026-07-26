"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ProtectedDashboardGuard from "./ProtectedDashboardGuard";
import WorkspaceHero from "./WorkspaceHero";
import { GlobalAlertsCenterProvider } from "./alerts/GlobalAlertsCenterProvider";
import GlobalAlertsToast from "./alerts/GlobalAlertsToast";
import PwaRuntimeController from "./pwa/PwaRuntimeController";
import InstallTraderButton from "./pwa/InstallTraderButton";

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
    pathname === "/trust-center" ||
    pathname.startsWith("/trust-center/") ||
    pathname.startsWith("/trader") ||
    isAdminRoute;

  if (isStandaloneRoute) {
    return (
      <>
        <PwaRuntimeController />
        {!isAdminRoute ? (
          <div className="fixed bottom-4 right-4 z-[85]">
            <InstallTraderButton />
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <GlobalAlertsCenterProvider>
      <PwaRuntimeController />
      {!isAdminRoute ? (
        <div className="fixed bottom-4 right-4 z-[85]">
          <InstallTraderButton />
        </div>
      ) : null}
      <Sidebar />
      <div className="cv-app-shell flex min-h-screen flex-1 flex-col pt-[76px] lg:ml-72 lg:pt-0">
        <WorkspaceHero />
        <GlobalAlertsToast />
        <div className="cv-workspace cv-page-content">
          <ProtectedDashboardGuard>{children}</ProtectedDashboardGuard>
        </div>
        <Footer />
      </div>
    </GlobalAlertsCenterProvider>
  );
}