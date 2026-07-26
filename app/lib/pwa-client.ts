"use client";

export type PushApiSnapshot = {
  configured: boolean;
  publicKey: string;
  devices: Array<{ endpoint: string; lastSeenAt: string; deviceLabel: string }>;
};

type PushEnvelope = {
  data?: PushApiSnapshot;
  error?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let installPromptEvent: BeforeInstallPromptEvent | null = null;

export function getSavedInstallPrompt(): BeforeInstallPromptEvent | null {
  return installPromptEvent;
}

export function setSavedInstallPrompt(event: BeforeInstallPromptEvent | null): void {
  installPromptEvent = event;
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const media = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const ios = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return media || ios;
}

export function isIosBrowser(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !/crios|fxios|edgios/.test(ua);
}

export async function registerTraderServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

export async function fetchPushSnapshot(): Promise<PushApiSnapshot | null> {
  const response = await fetch("/api/client/pwa/push", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PushEnvelope;
  return payload.data ?? null;
}

export async function subscribeCurrentDeviceToPush(deviceLabel?: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return false;
  }

  const snapshot = await fetchPushSnapshot();
  if (!snapshot || !snapshot.configured || !snapshot.publicKey) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(snapshot.publicKey) as unknown as BufferSource,
    }));

  const serialized = subscription.toJSON();
  const response = await fetch("/api/client/pwa/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "subscribe",
      subscription: serialized,
      deviceLabel:
        deviceLabel ||
        (window.matchMedia("(display-mode: standalone)").matches ? "App instalada" : "Navegador"),
    }),
  });

  return response.ok;
}

export async function unsubscribeCurrentDeviceFromPush(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return true;
  }

  const serialized = subscription.toJSON();
  await fetch("/api/client/pwa/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "unsubscribe", subscription: serialized }),
  }).catch(() => undefined);

  await subscription.unsubscribe();
  return true;
}
