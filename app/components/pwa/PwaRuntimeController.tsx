"use client";

import { useEffect, useMemo, useState } from "react";
import { registerTraderServiceWorker } from "@/app/lib/pwa-client";

type RuntimeStatus = "idle" | "update-ready" | "updating";

export default function PwaRuntimeController() {
  const [status, setStatus] = useState<RuntimeStatus>("idle");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const reg = await registerTraderServiceWorker();
      if (!mounted || !reg) {
        return;
      }

      setRegistration(reg);

      if (reg.waiting) {
        setStatus("update-ready");
      }

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) {
          return;
        }

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setStatus("update-ready");
          }
        });
      });
    };

    void setup();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const canUpdate = useMemo(() => status === "update-ready" && Boolean(registration?.waiting), [status, registration]);

  const applyUpdate = () => {
    if (!registration?.waiting) {
      return;
    }

    setStatus("updating");
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  if (!canUpdate && status !== "updating") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[90] w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-[#D4AF37]/45 bg-[#121212] p-3 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#D4AF37]">Nueva version disponible</p>
          <p className="text-xs text-white/70">Actualiza CARVIPIX Trader para usar la version mas reciente.</p>
        </div>
        <button
          type="button"
          onClick={applyUpdate}
          disabled={status === "updating"}
          className="rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
        >
          {status === "updating" ? "Actualizando..." : "Actualizar ahora"}
        </button>
      </div>
    </div>
  );
}
