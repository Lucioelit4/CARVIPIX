"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PlansModal from "./PlansModal";
import AdminMenuItem from "./AdminMenuItem";
import { clearAuthSession } from "@/app/lib/auth/session";
import { resolveSidebarMembershipLabel, type SidebarMembership } from "./sidebar-membership";

const menuItems = [
  { name: "Inicio", href: "/servicios" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Alertas en Vivo", href: "/alertas" },
  { name: "Resultados", href: "/resultados" },
  { name: "Análisis Diario", href: "/analisis" },
  { name: "Comunidad", href: "/comunidad" },
  { name: "Bot CARVIPIX", href: "/bot" },
  { name: "Socios Estratégicos", href: "/socios-estrategicos" },
  { name: "Cuentas Fondeadas (Próximamente)", href: "/fondeo" },
  { name: "Academia", href: "/academia" },
  { name: "Herramientas", href: "/herramientas" },
  { name: "Perfil", href: "/perfil" },
  { name: "Soporte", href: "/soporte" },
  { name: "Trust Center", href: "/trust-center" },
];

const BRAND_PREVIEW_VIDEO_SRC = "/media/carvipix-premium-opening-mobile.mp4";

function BrandMotionPreview({ compact = false }: { compact?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loopPoint, setLoopPoint] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(loopPoint) || loopPoint <= 0) {
      return;
    }

    let rafId = 0;
    const tick = () => {
      const current = video.currentTime;
      if (Number.isFinite(current) && current >= loopPoint) {
        // Manual seamless loop to avoid white flash on some mobile decoders.
        video.currentTime = 0.06;
        void video.play().catch(() => undefined);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [loopPoint]);

  return (
    <div className={`mt-4 overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-black/30 ${compact ? "h-[94px]" : "h-[112px]"}`}>
      <div className="relative h-full w-full">
        <div className="pointer-events-none absolute inset-0 bg-black/35" />
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration;
            if (Number.isFinite(duration) && duration > 0) {
              setLoopPoint(Math.max(duration - 0.18, 0.12));
            }
          }}
          className="h-full w-full object-cover brightness-[0.78] contrast-110 saturate-90"
          aria-label="Portada premium animada CARVIPIX"
        >
          <source src={BRAND_PREVIEW_VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [membershipLabel, setMembershipLabel] = useState("Consultando...");

  useEffect(() => {
    let active = true;

    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as { membership?: SidebarMembership | null };
        return payload.membership ?? null;
      })
      .then((membership) => {
        if (active) {
          setMembershipLabel(resolveSidebarMembershipLabel(membership));
        }
      })
      .catch(() => {
        if (active) {
          setMembershipLabel("Sin membresía");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // No-op: local cleanup is always applied.
    } finally {
      clearAuthSession();
      setMobileOpen(false);
      router.replace('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-[#2A2A2A] bg-[#030303]/95 px-4 py-3 text-white lg:hidden">
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
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#121212] text-white transition hover:border-[#D4AF37]/40 hover:bg-[#181818]"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-[#2A2A2A] bg-[#030303] lg:flex lg:flex-col">
        <div className="flex h-full flex-col p-6">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="mb-10 rounded-[2rem] border border-[#2A2A2A] bg-[#121212] px-5 py-6 text-center shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
              <Image
                src="/logo/logo carvipix.png"
                alt="CARVIPIX"
                width={200}
                height={60}
                priority
                className="mx-auto w-[168px] xl:w-[190px]"
                style={{ height: "auto" }}
              />
              <BrandMotionPreview />
              <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />
              <p className="mt-3 whitespace-nowrap text-[11px] uppercase tracking-[0.18em] text-[#C7C0B4]">
                Plataforma Premium
              </p>
            </div>

            <div className="mb-3 px-4 text-[11px] uppercase tracking-[0.24em] text-[#B5B5B5]">Navegación</div>
            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex min-h-[44px] items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-[15px] leading-5 transition duration-200 ${
                      isActive
                        ? "border-l-4 border-[#D4AF37] bg-[#181818] text-[#F4C542] shadow-[0_0_30px_rgba(212,175,55,0.14)]"
                        : "text-[#B5B5B5] hover:border-l-4 hover:border-[#D4AF37]/50 hover:bg-[#121212] hover:text-[#F4C542]"
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

          <div className="mt-6 rounded-[1.75rem] border border-[#2A2A2A] bg-[#121212] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <p className="text-sm text-[#B5B5B5]">Plan actual</p>
            <p className="mt-2 text-xl font-semibold text-[#D4AF37]">{membershipLabel}</p>
            <button
              onClick={() => setShowPlans(true)}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4C542] px-4 py-3 text-sm font-bold text-black shadow-lg shadow-[#D4AF37]/20 transition duration-200 hover:brightness-110"
            >
              Ver planes
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/15 bg-transparent px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="fixed left-0 top-0 h-full w-[320px] max-w-[92vw] overflow-y-auto border-r border-[#2A2A2A] bg-[#030303] p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-8 rounded-3xl border border-[#2A2A2A] bg-[#121212] px-4 py-5">
              <div className="flex items-start justify-between gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo/logo carvipix.png"
                  alt="CARVIPIX"
                  width={160}
                  height={50}
                  priority
                  className="w-[132px]"
                  style={{ height: "auto" }}
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#121212] text-white transition hover:border-[#D4AF37]/40 hover:bg-[#181818]"
              >
                <X size={20} />
              </button>
              </div>
              <BrandMotionPreview compact />
              <div className="mx-auto mt-4 h-px w-14 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
              <p className="mt-3 text-center whitespace-nowrap text-[10px] uppercase tracking-[0.17em] text-[#C7C0B4]">
                Plataforma Premium
              </p>
            </div>

            <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.24em] text-[#B5B5B5]">Navegación</div>
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
                    className={`flex min-h-[44px] items-center rounded-2xl border border-white/10 px-4 py-3 text-sm leading-5 break-words transition duration-200 ${
                      isActive
                        ? "bg-[#181818] text-[#F4C542]"
                        : "text-[#B5B5B5] hover:bg-[#121212] hover:text-[#F4C542]"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <AdminMenuItem onNavigate={() => setMobileOpen(false)} compact />
              <div className="mt-3 rounded-2xl border border-white/10 bg-[#121212] px-4 py-3">
                <p className="text-xs text-[#B5B5B5]">Plan actual</p>
                <p className="mt-1 text-base font-semibold text-[#D4AF37]">{membershipLabel}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </button>
            </nav>
          </div>
        </div>
      ) : null}
      <PlansModal open={showPlans} onClose={() => setShowPlans(false)} />
    </>
  );
}
