"use client";

import { useEffect, useState } from "react";
import {
  fetchPushSnapshot,
  subscribeCurrentDeviceToPush,
  unsubscribeCurrentDeviceFromPush,
} from "@/app/lib/pwa-client";
import {
  readAlertPreferences,
  setAlertNotificationsEnabled,
  setAlertSoundEnabled,
} from "@/app/lib/alerts-client-preferences";

export default function TraderConfiguracionPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => readAlertPreferences().notificationsEnabled);
  const [soundEnabled, setSoundEnabled] = useState(() => readAlertPreferences().soundEnabled);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [devices, setDevices] = useState<Array<{ endpoint: string; lastSeenAt: string; deviceLabel: string }>>([]);
  const [message, setMessage] = useState("");

  const reloadPushState = async () => {
    try {
      const snapshot = await fetchPushSnapshot();
      setPushConfigured(Boolean(snapshot?.configured));
      setDevices(snapshot?.devices ?? []);
    } catch {
      setPushConfigured(false);
      setDevices([]);
    }
  };

  useEffect(() => {
    let active = true;

    void fetchPushSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }
        setPushConfigured(Boolean(snapshot?.configured));
        setDevices(snapshot?.devices ?? []);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setPushConfigured(false);
        setDevices([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const onToggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    setAlertNotificationsEnabled(next);
  };

  const onToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAlertSoundEnabled(next);
  };

  const onEnablePush = async () => {
    const ok = await subscribeCurrentDeviceToPush();
    setMessage(ok ? "Push activado para este dispositivo." : "No fue posible activar push.");
    await reloadPushState();
  };

  const onDisablePush = async () => {
    const ok = await unsubscribeCurrentDeviceFromPush();
    setMessage(ok ? "Push desactivado para este dispositivo." : "No fue posible desactivar push.");
    await reloadPushState();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">Configuracion</h1>
      <p className="text-sm text-white/70">Notificaciones, sonido y dispositivos conectados.</p>

      <div className="rounded-xl border border-white/10 bg-[#0D1624] p-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <p className="text-sm font-semibold">Notificaciones in-app</p>
            <p className="text-xs text-white/65">Centro global de alertas y badges de nuevas alertas.</p>
          </div>
          <button
            type="button"
            onClick={onToggleNotifications}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              notificationsEnabled
                ? "border-[#D4AF37]/45 bg-[#D4AF37] text-black"
                : "border-white/20 bg-white/5 text-white"
            }`}
          >
            {notificationsEnabled ? "Activo" : "Inactivo"}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <p className="text-sm font-semibold">Sonido</p>
            <p className="text-xs text-white/65">Alerta sonora cuando llega una senal nueva.</p>
          </div>
          <button
            type="button"
            onClick={onToggleSound}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              soundEnabled
                ? "border-[#D4AF37]/45 bg-[#D4AF37] text-black"
                : "border-white/20 bg-white/5 text-white"
            }`}
          >
            {soundEnabled ? "Activo" : "Inactivo"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Push del sistema</p>
            <p className="text-xs text-white/65">Notificaciones con navegador en segundo plano o app instalada.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEnablePush}
              disabled={!pushConfigured}
              className="rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
            >
              Activar push
            </button>
            <button
              type="button"
              onClick={onDisablePush}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
            >
              Desactivar
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-white/65">
          Estado servidor push: {pushConfigured ? "Configurado" : "No configurado"}
        </p>

        {message ? <p className="mt-2 text-xs text-[#D4AF37]">{message}</p> : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0D1624] p-4">
        <p className="text-sm font-semibold">Dispositivos conectados</p>
        {devices.length === 0 ? (
          <p className="mt-2 text-sm text-white/70">No hay dispositivos registrados para push.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {devices.map((device) => (
              <div key={device.endpoint} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs">
                <p className="font-semibold text-white">{device.deviceLabel || "Dispositivo"}</p>
                <p className="text-white/60">Ultima actividad: {new Date(device.lastSeenAt).toLocaleString("es-ES")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
