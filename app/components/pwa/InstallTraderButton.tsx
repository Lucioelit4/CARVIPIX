"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSavedInstallPrompt,
  isIosBrowser,
  isStandaloneMode,
  setSavedInstallPrompt,
} from "@/app/lib/pwa-client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallTraderButtonProps = {
  compact?: boolean;
  label?: string;
};

export default function InstallTraderButton({ compact = false, label = "Descargar aplicación CARVIPIX" }: InstallTraderButtonProps) {
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return isStandaloneMode();
  });
  const [hasPrompt, setHasPrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(getSavedInstallPrompt());
  });
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setSavedInstallPrompt(event as BeforeInstallPromptEvent);
      setHasPrompt(true);
    };

    const onDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode());
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.matchMedia?.("(display-mode: standalone)").addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.matchMedia?.("(display-mode: standalone)").removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const visible = useMemo(() => {
    return !isInstalled;
  }, [isInstalled]);

  const handleInstall = async () => {
    const promptEvent = getSavedInstallPrompt();

    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setSavedInstallPrompt(null);
      setHasPrompt(false);
      return;
    }

    if (isIosBrowser()) {
      setShowIosHelp(true);
      return;
    }

    setShowIosHelp(true);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className={compact
          ? "rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black"
          : "rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-black"
        }
      >
        {hasPrompt ? label : label}
      </button>

      {showIosHelp ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#101010] p-5">
            <p className="text-sm font-semibold text-[#D4AF37]">Descarga en iPhone</p>
            <p className="mt-2 text-sm text-white/80">
              {isIosBrowser()
                ? "En Safari toca Compartir y luego Agregar a pantalla de inicio para abrir CARVIPIX desde el navegador."
                : "Si el navegador no muestra descarga directa, abre el menu del navegador y selecciona Instalar aplicacion o Agregar a escritorio."}
            </p>
            <button
              type="button"
              onClick={() => setShowIosHelp(false)}
              className="mt-4 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
