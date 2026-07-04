"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import PlansModal from "./PlansModal";
import AdminMenuItem from "./AdminMenuItem";

const menuItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Alertas en Vivo", href: "/alertas" },
  { name: "Resultados", href: "/resultados" },
  { name: "Análisis Diario", href: "/analisis" },
  { name: "Comunidad", href: "/comunidad" },
  { name: "Bot CARVIPIX", href: "/bot" },
  { name: "Gestión de Capital", href: "/capital" },
  { name: "Programa de Fondeo", href: "/fondeo" },
  { name: "Herramientas", href: "/herramientas" },
  { name: "Perfil", href: "/perfil" },
  { name: "Soporte", href: "/soporte" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#070A0F]/95 px-4 py-3 text-white lg:hidden">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo/logo carvipix.png"
            alt="CARVIPIX"
            width={180}
            height={50}
            priority
            style={{ width: "160px", height: "auto" }}
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0F1117]/95 text-white transition hover:bg-white/10"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-[#070A0F]/95 lg:flex lg:flex-col">
        <div className="flex h-full flex-col justify-between p-6">
          <div>
            <div className="mb-10 rounded-[2rem] border border-white/5 bg-[#10141D]/90 p-5 text-center shadow-[0_25px_80px_rgba(0,0,0,0.15)]">
              <Image
                src="/logo/logo carvipix.png"
                alt="CARVIPIX"
                width={200}
                height={60}
                priority
                style={{ width: "200px", height: "auto" }}
              />
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">
                Plataforma premium
              </p>
            </div>

            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm transition duration-300 ${
                      isActive
                        ? "border-l-4 border-[#D4AF37] bg-white/5 text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                        : "text-zinc-300 hover:border-l-4 hover:border-[#D4AF37]/50 hover:bg-white/5 hover:text-[#D4AF37]"
                    }`}
                  >
                    <span className="flex-1">{item.name}</span>
                    {isActive ? <span className="h-2 w-2 rounded-full bg-[#D4AF37]" /> : null}
                  </Link>
                );
              })}
              <AdminMenuItem />
            </nav>
          </div>

          <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#10141D]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <p className="text-sm text-zinc-400">Plan actual</p>
            <p className="mt-2 text-xl font-semibold text-[#D4AF37]">CARVIPIX PRO</p>
            <button
              onClick={() => setShowPlans(true)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] px-4 py-3 text-sm font-bold text-black shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110"
            >
              Ver planes
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden">
          <div className="fixed left-0 top-0 h-full w-[280px] border-r border-white/10 bg-[#070A0F]/95 p-6 shadow-xl">
            <div className="mb-10 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo/logo carvipix.png"
                  alt="CARVIPIX"
                  width={160}
                  height={50}
                  priority
                  style={{ width: "140px", height: "auto" }}
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0F1117]/95 text-white transition hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-2xl border border-white/10 px-4 py-3 text-sm transition ${
                      isActive
                        ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                        : "text-zinc-300 hover:bg-white/5 hover:text-[#D4AF37]"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <AdminMenuItem />
            </nav>
          </div>
        </div>
      ) : null}
      <PlansModal open={showPlans} onClose={() => setShowPlans(false)} />
    </>
  );
}
