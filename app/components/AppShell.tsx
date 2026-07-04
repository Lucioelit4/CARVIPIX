"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ProtectedDashboardGuard from "./ProtectedDashboardGuard";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pt-20 lg:ml-72 lg:pt-0">
        <ProtectedDashboardGuard>{children}</ProtectedDashboardGuard>
        <Footer />
      </div>
    </>
  );
}