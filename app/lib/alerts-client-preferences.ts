"use client";

const ALERT_NOTIFICATIONS_KEY = "cvx_alert_notifications_enabled";
const ALERT_SOUND_KEY = "cvx_alert_sound_enabled";

function readBooleanPreference(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    return fallback;
  }

  return raw === "1";
}

function writeBooleanPreference(key: string, value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value ? "1" : "0");
  window.dispatchEvent(
    new CustomEvent("carvipix:alerts-preferences-updated", {
      detail: {
        notificationsEnabled: getAlertNotificationsEnabled(),
        soundEnabled: getAlertSoundEnabled(),
      },
    })
  );
}

export function getAlertNotificationsEnabled(): boolean {
  return readBooleanPreference(ALERT_NOTIFICATIONS_KEY, true);
}

export function setAlertNotificationsEnabled(value: boolean): void {
  writeBooleanPreference(ALERT_NOTIFICATIONS_KEY, value);
}

export function getAlertSoundEnabled(): boolean {
  return readBooleanPreference(ALERT_SOUND_KEY, true);
}

export function setAlertSoundEnabled(value: boolean): void {
  writeBooleanPreference(ALERT_SOUND_KEY, value);
}

export type AlertPreferencesSnapshot = {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
};

export function readAlertPreferences(): AlertPreferencesSnapshot {
  return {
    notificationsEnabled: getAlertNotificationsEnabled(),
    soundEnabled: getAlertSoundEnabled(),
  };
}
