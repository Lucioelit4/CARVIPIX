"use client";

import { Bell, Search, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

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

  const content = useMemo(() => {
    return (
      routeTitles[routeKey] ?? {
        title: "CARVIPIX Workspace",
        subtitle: "Plataforma premium unificada para todo el ecosistema.",
      }
    );
  }, [routeKey]);

  return (
    <section className="cv-workspace pt-4 sm:pt-6 lg:pt-8">
      <div className="cv-toolbar">
        <div className="min-w-0">
          <p className="cv-kicker">Plataforma premium</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{content.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B5B5B5] sm:text-base">{content.subtitle}</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
          <div className="cv-search flex-1 sm:w-72">
            <Search size={16} className="text-[#B5B5B5]" />
            <input
              aria-label="Buscar en CARVIPIX"
              placeholder="Buscar en CARVIPIX..."
              className="w-full bg-transparent text-sm text-white placeholder:text-[#7E7E7E] focus:outline-none"
            />
          </div>

          <button type="button" className="cv-icon-btn" aria-label="Notificaciones">
            <Bell size={16} />
          </button>

          <button type="button" className="cv-icon-btn" aria-label="Seguridad">
            <ShieldCheck size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
