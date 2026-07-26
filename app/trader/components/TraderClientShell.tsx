"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Bell, Bot, ChartColumn, House, Settings, ShieldCheck } from "lucide-react";
import ProtectedDashboardGuard from "@/app/components/ProtectedDashboardGuard";
import { GlobalAlertsCenterProvider, useGlobalAlertsCenter } from "@/app/components/alerts/GlobalAlertsCenterProvider";
import GlobalAlertsToast from "@/app/components/alerts/GlobalAlertsToast";
import InstallTraderButton from "@/app/components/pwa/InstallTraderButton";

const NAV_ITEMS = [
  { href: "/trader", label: "Inicio", icon: House },
  { href: "/trader/alertas", label: "Alertas", icon: Bell },
  { href: "/trader/resultados", label: "Resultados", icon: ChartColumn },
  { href: "/trader/bot", label: "Bot", icon: Bot },
  { href: "/trader/membresia", label: "Membresia", icon: ShieldCheck },
  { href: "/trader/configuracion", label: "Config", icon: Settings },
];

function TraderNavigation() {
  const pathname = usePathname();
  const { unreadCount } = useGlobalAlertsCenter();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#D4AF37]/20 bg-[#060606]/95 backdrop-blur">
        <div className="mx-auto hidden w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">CARVIPIX Trader</p>
            <p className="text-sm text-white/70">Alertas primero. Flujo minimo para decidir y abrir.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#D4AF37]">
              {unreadCount} nueva{unreadCount === 1 ? "" : "s"}
            </span>
            <InstallTraderButton compact />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-2 md:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">CARVIPIX Trader</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2 py-1 text-[10px] font-semibold text-[#D4AF37]">
              {unreadCount}
            </span>
            <InstallTraderButton compact />
          </div>
        </div>
        <nav className="mx-auto hidden w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-[#D4AF37]/45 bg-[#D4AF37] text-black"
                    : "border-white/15 bg-white/5 text-white/85 hover:border-[#D4AF37]/45 hover:text-[#D4AF37]"
                }`}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#060606]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-6 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const showUnread = item.href === "/trader/alertas" && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-[52px] flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition ${
                  active
                    ? "border-[#D4AF37]/55 bg-[#D4AF37] text-black"
                    : "border-white/10 bg-white/5 text-white/85"
                }`}
              >
                <item.icon size={14} />
                <span className="mt-1">{item.label}</span>
                {showUnread ? (
                  <span className="absolute right-1.5 top-1.5 rounded-full border border-rose-300/60 bg-rose-500 px-1 text-[9px] leading-4 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default function TraderClientShell({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <GlobalAlertsCenterProvider>
      <ProtectedDashboardGuard>
        <div className="cv-trader-shell min-h-screen bg-[#030303] text-white">
          {showSplash ? (
            <div className="fixed inset-0 z-[140] grid place-items-center bg-[#050505]">
              <div className="cv-trader-splash flex flex-col items-center gap-3">
                <Image
                  src="/logo/carvipix-logo.png"
                  alt="CARVIPIX"
                  width={56}
                  height={56}
                  className="rounded-2xl border border-[#D4AF37]/25 bg-black/40 p-2"
                  priority
                />
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">CARVIPIX Trader</p>
              </div>
            </div>
          ) : null}
          <TraderNavigation />
          <GlobalAlertsToast />
          <main className="cv-trader-page mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-6">{children}</main>
        </div>
      </ProtectedDashboardGuard>
    </GlobalAlertsCenterProvider>
  );
}
