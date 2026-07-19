"use client";

import { useEffect, useState } from "react";

type ServiceStatus = {
  id: string;
  label: string;
  endpoint: string;
  state: "checking" | "online" | "degraded" | "offline";
  detail: string;
};

const BASE_SERVICES: ServiceStatus[] = [
  { id: "platform", label: "Plataforma", endpoint: "/", state: "checking", detail: "Verificando" },
  { id: "api", label: "API", endpoint: "/api/health", state: "checking", detail: "Verificando" },
  { id: "dashboard", label: "Dashboard", endpoint: "/dashboard", state: "checking", detail: "Verificando" },
  { id: "alerts", label: "Alertas", endpoint: "/alertas", state: "checking", detail: "Verificando" },
  { id: "bot", label: "Bot", endpoint: "/bot", state: "checking", detail: "Verificando" },
  { id: "payments", label: "Sistema de pagos", endpoint: "/checkout?product=plan-basic", state: "checking", detail: "Verificando" },
];

export default function StatusBoard() {
  const [services, setServices] = useState<ServiceStatus[]>(BASE_SERVICES);
  const [lastCheck, setLastCheck] = useState<string>("-");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const next = await Promise.all(
        BASE_SERVICES.map(async (svc) => {
          const started = performance.now();
          try {
            const response = await fetch(svc.endpoint, { method: "GET", cache: "no-store" });
            const elapsed = Math.round(performance.now() - started);

            if (!response.ok) {
              return { ...svc, state: "degraded" as const, detail: `HTTP ${response.status}` };
            }

            const fast = elapsed < 1200;
            return {
              ...svc,
              state: fast ? ("online" as const) : ("degraded" as const),
              detail: fast ? `${elapsed} ms` : `Lento (${elapsed} ms)`,
            };
          } catch {
            return { ...svc, state: "offline" as const, detail: "Sin respuesta" };
          }
        })
      );

      if (!cancelled) {
        setServices(next);
        setLastCheck(new Date().toLocaleString("es-ES"));
      }
    }

    check();
    const interval = setInterval(check, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const summary = services.every((item) => item.state === "online")
    ? "Operativo"
    : services.some((item) => item.state === "offline")
      ? "Incidencia detectada"
      : "Operando con degradacion";

  return (
    <>
      <p className="mt-3 text-zinc-300">Monitoreo publico basico de componentes principales. Ultima verificacion: {lastCheck}.</p>

      <div className="mt-5 inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200">
        Estado general: <span className="ml-2 font-semibold text-[#F4C542]">{summary}</span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <div key={service.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-zinc-400">{service.label}</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {service.state === "online" && "Online"}
              {service.state === "degraded" && "Degraded"}
              {service.state === "offline" && "Offline"}
              {service.state === "checking" && "Checking"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{service.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Este tablero es informativo y no reemplaza monitoreo interno de operaciones ni alertas administrativas.
      </p>
    </>
  );
}
