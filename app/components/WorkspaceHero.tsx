"use client";

import { Bell, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGlobalAlertsCenter } from "./alerts/GlobalAlertsCenterProvider";
import { formatRelativeAgeLabel, getFreshnessTone, getOutcomeTone } from "@/app/alertas/alertas-view-model";

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard CARVIPIX",
    subtitle: "Bienvenido de vuelta. Centro operativo premium con acceso a toda la plataforma.",
  },
  "/alertas": {
    title: "Alertas en Vivo",
    subtitle: "Senales priorizadas y lectura operativa en una superficie unica y coherente.",
  },
  "/resultados": {
    title: "Resultados",
    subtitle: "Desempeno verificado con trazabilidad clara y visual premium consistente.",
  },
  "/comunidad": {
    title: "Comunidad",
    subtitle: "Actividad y colaboracion dentro del ecosistema CARVIPIX.",
  },
  "/bot": {
    title: "Bot CARVIPIX",
    subtitle: "Control y supervision de automatizacion bajo la identidad oficial.",
  },
  "/socios-estrategicos": {
    title: "Socios Estrategicos CARVIPIX",
    subtitle: "Modulo privado para evaluacion de alianzas comerciales y de comunidad.",
  },
  "/fondeo": {
    title: "Cuentas Fondeadas",
    subtitle: "Servicio en desarrollo. Proximamente y sin flujo de venta activo por ahora.",
  },
  "/perfil": {
    title: "Perfil",
    subtitle: "Configuracion de cuenta, membresia y seguridad en una sola experiencia.",
  },
  "/herramientas": {
    title: "Herramientas",
    subtitle: "Utilidades operativas bajo el mismo estandar visual de CARVIPIX.",
  },
  "/soporte": {
    title: "Soporte",
    subtitle: "Atencion y asistencia con lenguaje visual consistente en toda la plataforma.",
  },
  "/admin": {
    title: "Area Administrativa",
    subtitle: "Gestion interna y gobierno operativo con identidad visual unica.",
  },
};

function normalizePath(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }

  return `/${segments[0]}`;
}

export default function WorkspaceHero() {
  const pathname = usePathname();
  const routeKey = normalizePath(pathname);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const {
    alerts,
    unreadIds,
    unreadCount,
    panelOpen,
    togglePanel,
    closePanel,
    markAlertViewed,
    viewAlertFromAnywhere,
  } = useGlobalAlertsCenter();

  const content = useMemo(() => {
    return (
      routeTitles[routeKey] ?? {
        title: "CARVIPIX Workspace",
        subtitle: "Plataforma premium unificada para todo el ecosistema.",
      }
    );
  }, [routeKey]);

  const visibleAlerts = useMemo(() => alerts.slice(0, 6), [alerts]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current) {
        return;
      }

      if (!panelRef.current.contains(event.target as Node)) {
        closePanel();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [panelOpen, closePanel]);

  return (
    <section className="cv-workspace pt-4 sm:pt-6 lg:pt-8">
      <div className="cv-toolbar">
        <div className="min-w-0">
          <p className="cv-kicker">Plataforma premium</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{content.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B5B5B5] sm:text-base">{content.subtitle}</p>
        </div>

        <div className="relative flex w-full items-center gap-3 sm:w-auto" ref={panelRef}>
          <div className="cv-search flex-1 sm:w-72">
            <Search size={16} className="text-[#B5B5B5]" />
            <input
              aria-label="Buscar en CARVIPIX"
              placeholder="Buscar en CARVIPIX..."
              className="w-full bg-transparent text-sm text-white placeholder:text-[#7E7E7E] focus:outline-none"
            />
          </div>

          <button type="button" className="cv-icon-btn relative" aria-label="Notificaciones" onClick={togglePanel}>
            <Bell size={16} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border border-rose-300/55 bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {panelOpen ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-[#0A111D]/95 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Centro de notificaciones</p>
                  <p className="text-xs text-white/60">{unreadCount} nueva{unreadCount === 1 ? "" : "s"} pendiente{unreadCount === 1 ? "" : "s"}</p>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/65 transition hover:border-white/35 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              {visibleAlerts.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                  Sin alertas nuevas por ahora.
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleAlerts.map((alert) => {
                    const isUnread = unreadIds.includes(alert.id);
                    const freshness = getFreshnessTone(alert.freshnessState);
                    const outcome = getOutcomeTone(alert.lifecycleState);
                    return (
                      <div key={alert.id} className="rounded-xl border border-white/10 bg-[#111B2B] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {alert.symbol} · {alert.direction}
                            </p>
                            <p className="text-[11px] text-white/65">{formatRelativeAgeLabel(alert.timestampMs)}</p>
                          </div>
                          {isUnread ? (
                            <span className="inline-flex items-center rounded-full border border-rose-300/50 bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-100">
                              Nueva
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/75">
                              Vista
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${outcome.className}`}>
                            {outcome.label}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${freshness.className}`}>
                            {freshness.label}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/85">
                            {alert.actionabilityLabel}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => markAlertViewed(alert.id)}
                            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white/75 transition hover:border-white/35 hover:text-white"
                          >
                            Marcar vista
                          </button>
                          <button
                            type="button"
                            onClick={() => viewAlertFromAnywhere(alert.id)}
                            className="rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37] px-2.5 py-1.5 text-[11px] font-semibold text-black transition hover:brightness-105"
                          >
                            Ver ahora
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <button type="button" className="cv-icon-btn" aria-label="Seguridad">
            <ShieldCheck size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
