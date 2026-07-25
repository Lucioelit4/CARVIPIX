"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { mapExternalAlerts, type AlertSignal } from "@/app/alertas/alertas-view-model";
import { getAlertNotificationsEnabled, getAlertSoundEnabled } from "@/app/lib/alerts-client-preferences";

type AlertsApiPayload = {
  data?: {
    alerts?: unknown[];
    history?: Array<{
      alertId?: string;
      action?: string;
    }>;
  };
  error?: string;
};

type GlobalAlertsCenterContextValue = {
  alerts: AlertSignal[];
  isLoading: boolean;
  loadError: string | null;
  unreadCount: number;
  unreadIds: string[];
  lastSyncLabel: string;
  panelOpen: boolean;
  toastAlert: AlertSignal | null;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  togglePanel: () => void;
  closePanel: () => void;
  dismissToast: () => void;
  markAlertViewed: (alertId: string) => void;
  viewAlertFromAnywhere: (alertId: string) => void;
};

const GlobalAlertsCenterContext = createContext<GlobalAlertsCenterContextValue | null>(null);

function safeErrorMessage(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
}

function formatSyncLabel(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function playAlertSound(): void {
  if (typeof window === "undefined") {
    return;
  }

  const countKey = "__carvipixAlertSoundCount";
  const currentCount = Number((window as typeof window & { [key: string]: unknown })[countKey] ?? 0);
  (window as typeof window & { [key: string]: unknown })[countKey] = Number.isFinite(currentCount) ? currentCount + 1 : 1;

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  try {
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.18);

    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.21);

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 350);
  } catch {
    // Ignore unsupported audio environments.
  }
}

export function GlobalAlertsCenterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertSignal[]>([]);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSyncLabel, setLastSyncLabel] = useState<string>("");
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [toastAlert, setToastAlert] = useState<AlertSignal | null>(null);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => getAlertNotificationsEnabled());
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => getAlertSoundEnabled());

  const knownAlertIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const unreadIds = useMemo(() => alerts.filter((item) => !viewedIds.includes(item.id)).map((item) => item.id), [alerts, viewedIds]);
  const unreadCount = unreadIds.length;

  const markAlertViewed = useCallback((alertId: string) => {
    if (!alertId) {
      return;
    }

    setViewedIds((current) => (current.includes(alertId) ? current : [...current, alertId]));

    void fetch("/api/client/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "logAction",
        alertId,
        alertAction: "viewed",
      }),
    }).catch(() => undefined);
  }, []);

  const dismissToast = useCallback(() => {
    setToastAlert(null);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((current) => !current);
  }, []);

  const viewAlertFromAnywhere = useCallback(
    (alertId: string) => {
      if (!alertId) {
        return;
      }

      markAlertViewed(alertId);
      setPanelOpen(false);
      setToastAlert(null);
      router.push(`/alertas?alert=${encodeURIComponent(alertId)}`);
    },
    [markAlertViewed, router]
  );

  const syncAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/client/alerts?limit=40", {
        cache: "no-store",
      });

      if (response.status === 401) {
        setAlerts([]);
        setViewedIds([]);
        setLoadError(null);
        return;
      }

      if (!response.ok) {
        const failedPayload = (await response.json().catch(() => ({}))) as AlertsApiPayload;
        setLoadError(safeErrorMessage(failedPayload.error, "No se pudieron sincronizar alertas globales."));
        return;
      }

      const payload = (await response.json()) as AlertsApiPayload;
      const rawAlerts = Array.isArray(payload.data?.alerts) ? payload.data?.alerts : [];
      const mappedAlerts = mapExternalAlerts(rawAlerts);
      const viewedFromHistory = new Set(
        (Array.isArray(payload.data?.history) ? payload.data?.history : [])
          .filter((item) => item.action === "viewed")
          .map((item) => String(item.alertId ?? "").trim())
          .filter(Boolean)
      );

      setAlerts(mappedAlerts);
      setViewedIds(Array.from(viewedFromHistory));
      setLoadError(null);
      setLastSyncLabel(formatSyncLabel(new Date()));

      const unreadNewIds = mappedAlerts
        .filter((item) => !viewedFromHistory.has(item.id))
        .map((item) => item.id)
        .filter((id) => !knownAlertIdsRef.current.has(id));

      if (initializedRef.current && notificationsEnabled && unreadNewIds.length > 0) {
        const nextAlert = mappedAlerts.find((item) => item.id === unreadNewIds[0]) ?? null;
        if (nextAlert) {
          setToastAlert(nextAlert);
          if (soundEnabled) {
            playAlertSound();
          }
        }
      }

      mappedAlerts.forEach((item) => {
        knownAlertIdsRef.current.add(item.id);
      });

      initializedRef.current = true;
    } catch {
      setLoadError("No se pudieron sincronizar alertas globales.");
    } finally {
      setIsLoading(false);
    }
  }, [notificationsEnabled, soundEnabled]);

  useEffect(() => {
    const onPreferencesUpdated = () => {
      setNotificationsEnabledState(getAlertNotificationsEnabled());
      setSoundEnabledState(getAlertSoundEnabled());
    };

    window.addEventListener("carvipix:alerts-preferences-updated", onPreferencesUpdated as EventListener);

    return () => {
      window.removeEventListener("carvipix:alerts-preferences-updated", onPreferencesUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutHandle: number | undefined;

    const run = async () => {
      await syncAlerts();

      if (cancelled) {
        return;
      }

      const intervalMs = document.hidden ? 20000 : 6000;
      timeoutHandle = window.setTimeout(run, intervalMs);
    };

    void run();

    return () => {
      cancelled = true;
      if (timeoutHandle !== undefined) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, [syncAlerts]);

  const value = useMemo<GlobalAlertsCenterContextValue>(
    () => ({
      alerts,
      isLoading,
      loadError,
      unreadCount,
      unreadIds,
      lastSyncLabel,
      panelOpen,
      toastAlert,
      notificationsEnabled,
      soundEnabled,
      togglePanel,
      closePanel,
      dismissToast,
      markAlertViewed,
      viewAlertFromAnywhere,
    }),
    [
      alerts,
      isLoading,
      loadError,
      unreadCount,
      unreadIds,
      lastSyncLabel,
      panelOpen,
      toastAlert,
      notificationsEnabled,
      soundEnabled,
      togglePanel,
      closePanel,
      dismissToast,
      markAlertViewed,
      viewAlertFromAnywhere,
    ]
  );

  return <GlobalAlertsCenterContext.Provider value={value}>{children}</GlobalAlertsCenterContext.Provider>;
}

export function useGlobalAlertsCenter() {
  const context = useContext(GlobalAlertsCenterContext);
  if (!context) {
    throw new Error("useGlobalAlertsCenter must be used within GlobalAlertsCenterProvider");
  }
  return context;
}
