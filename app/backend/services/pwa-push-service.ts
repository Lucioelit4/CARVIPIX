import "server-only";

import fs from "fs/promises";
import path from "path";
import webpush, { type PushSubscription } from "web-push";

type StoredPushSubscription = {
  userId: string;
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
  lastSeenAt: string;
  userAgent: string;
  deviceLabel: string;
};

type StoredPushDelivery = {
  key: string;
  userId: string;
  endpoint: string;
  alertId: string;
  sentAt: string;
};

type StoredPushState = {
  subscriptions: StoredPushSubscription[];
  deliveries: StoredPushDelivery[];
};

type AlertPushCandidate = {
  id: string;
  symbol: string;
  direction: string;
  timestampLabel: string;
};

const STORE_FILE = path.join(process.cwd(), "data", "pwa-push-subscriptions.json");
const DEFAULT_STATE: StoredPushState = { subscriptions: [], deliveries: [] };

const DELIVERY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const DEVICE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

let writeQueue: Promise<void> = Promise.resolve();
let configuredVapid = false;

function getVapidConfig() {
  return {
    publicKey: String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim(),
    privateKey: String(process.env.VAPID_PRIVATE_KEY ?? "").trim(),
    subject: String(process.env.VAPID_SUBJECT ?? "mailto:soporte@carvipix.com").trim(),
  };
}

export function isPushConfigured(): boolean {
  const cfg = getVapidConfig();
  return Boolean(cfg.publicKey && cfg.privateKey);
}

export function getPushPublicKey(): string {
  return getVapidConfig().publicKey;
}

function ensureWebPushConfigured(): void {
  if (configuredVapid) {
    return;
  }

  const cfg = getVapidConfig();
  if (!cfg.publicKey || !cfg.privateKey) {
    return;
  }

  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  configuredVapid = true;
}

async function ensureStoreDir(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
}

async function readStateUnsafe(): Promise<StoredPushState> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredPushState>;
    const subscriptions = Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [];
    const deliveries = Array.isArray(parsed.deliveries) ? parsed.deliveries : [];
    return {
      subscriptions,
      deliveries,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { ...DEFAULT_STATE };
    }
    throw error;
  }
}

async function writeStateUnsafe(state: StoredPushState): Promise<void> {
  await ensureStoreDir();
  const temp = `${STORE_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(temp, STORE_FILE);
}

async function withStateMutation<T>(mutator: (state: StoredPushState) => Promise<T> | T): Promise<T> {
  const previous = writeQueue;
  let resolveNext: () => void = () => undefined;
  writeQueue = new Promise<void>((resolve) => {
    resolveNext = resolve;
  });

  await previous;

  try {
    const current = await readStateUnsafe();
    const result = await mutator(current);
    await writeStateUnsafe(current);
    return result;
  } finally {
    resolveNext();
  }
}

function normalizeSubscription(input: PushSubscription): PushSubscription | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const endpoint = String(input.endpoint ?? "").trim();
  const p256dh = String(input.keys?.p256dh ?? "").trim();
  const auth = String(input.keys?.auth ?? "").trim();

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    expirationTime: input.expirationTime ?? null,
    keys: {
      p256dh,
      auth,
    },
  };
}

function pruneState(state: StoredPushState, now = Date.now()): void {
  state.deliveries = state.deliveries.filter((item) => {
    const sentAt = new Date(item.sentAt).getTime();
    return Number.isFinite(sentAt) && now - sentAt <= DELIVERY_RETENTION_MS;
  });

  state.subscriptions = state.subscriptions.filter((item) => {
    const lastSeenAt = new Date(item.lastSeenAt).getTime();
    return Number.isFinite(lastSeenAt) && now - lastSeenAt <= DEVICE_RETENTION_MS;
  });
}

export async function upsertPushSubscription(input: {
  userId: string;
  subscription: PushSubscription;
  userAgent?: string;
  deviceLabel?: string;
}): Promise<{ saved: boolean; totalDevices: number }> {
  const normalized = normalizeSubscription(input.subscription);
  if (!normalized) {
    return { saved: false, totalDevices: 0 };
  }

  const nowIso = new Date().toISOString();

  return withStateMutation(async (state) => {
    pruneState(state);

    const index = state.subscriptions.findIndex(
      (item) => item.userId === input.userId && item.endpoint === normalized.endpoint
    );

    const next: StoredPushSubscription = {
      userId: input.userId,
      endpoint: normalized.endpoint,
      expirationTime: normalized.expirationTime ?? null,
      keys: {
        p256dh: normalized.keys.p256dh,
        auth: normalized.keys.auth,
      },
      createdAt: index >= 0 ? state.subscriptions[index].createdAt : nowIso,
      lastSeenAt: nowIso,
      userAgent: String(input.userAgent ?? "").slice(0, 300),
      deviceLabel: String(input.deviceLabel ?? "Dispositivo").slice(0, 80) || "Dispositivo",
    };

    if (index >= 0) {
      state.subscriptions[index] = next;
    } else {
      state.subscriptions.push(next);
    }

    const totalDevices = state.subscriptions.filter((item) => item.userId === input.userId).length;
    return { saved: true, totalDevices };
  });
}

export async function removePushSubscription(input: {
  userId: string;
  endpoint: string;
}): Promise<{ removed: boolean; totalDevices: number }> {
  const endpoint = String(input.endpoint ?? "").trim();
  if (!endpoint) {
    return { removed: false, totalDevices: 0 };
  }

  return withStateMutation(async (state) => {
    pruneState(state);

    const before = state.subscriptions.length;
    state.subscriptions = state.subscriptions.filter(
      (item) => !(item.userId === input.userId && item.endpoint === endpoint)
    );
    state.deliveries = state.deliveries.filter(
      (item) => !(item.userId === input.userId && item.endpoint === endpoint)
    );

    const removed = state.subscriptions.length < before;
    const totalDevices = state.subscriptions.filter((item) => item.userId === input.userId).length;
    return { removed, totalDevices };
  });
}

export async function listPushDevices(userId: string): Promise<Array<{ endpoint: string; lastSeenAt: string; deviceLabel: string }>> {
  const state = await readStateUnsafe();
  pruneState(state);

  return state.subscriptions
    .filter((item) => item.userId === userId)
    .map((item) => ({
      endpoint: item.endpoint,
      lastSeenAt: item.lastSeenAt,
      deviceLabel: item.deviceLabel || "Dispositivo",
    }));
}

function resolveDirection(alert: Record<string, unknown>): string {
  const data = (alert.data as Record<string, unknown> | undefined) ?? {};
  return String(data.direction ?? alert.side ?? "Alerta").trim() || "Alerta";
}

function resolveTimestampLabel(alert: Record<string, unknown>): string {
  const value = alert.timestamp;
  const parsed = new Date(value as string | number | Date);
  if (Number.isNaN(parsed.getTime())) {
    return "Ahora";
  }
  return parsed.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toPushCandidate(alert: Record<string, unknown>): AlertPushCandidate | null {
  const id = String(alert.id ?? "").trim();
  const symbol = String(alert.symbol ?? "").trim();
  if (!id || !symbol) {
    return null;
  }

  return {
    id,
    symbol,
    direction: resolveDirection(alert),
    timestampLabel: resolveTimestampLabel(alert),
  };
}

export async function dispatchAlertPushes(input: {
  userId: string;
  alerts: unknown[];
  viewedAlertIds: Set<string>;
}): Promise<{ sent: number; skipped: number; devices: number }> {
  if (!isPushConfigured()) {
    return { sent: 0, skipped: 0, devices: 0 };
  }

  ensureWebPushConfigured();

  const candidateAlerts = input.alerts
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map(toPushCandidate)
    .filter((item): item is AlertPushCandidate => Boolean(item))
    .filter((item) => !input.viewedAlertIds.has(item.id))
    .slice(0, 3);

  if (candidateAlerts.length === 0) {
    return { sent: 0, skipped: 0, devices: 0 };
  }

  const state = await readStateUnsafe();
  pruneState(state);
  const userDevices = state.subscriptions.filter((item) => item.userId === input.userId);

  if (userDevices.length === 0) {
    return { sent: 0, skipped: 0, devices: 0 };
  }

  const sentPayloads: StoredPushDelivery[] = [];
  const staleEndpoints = new Set<string>();
  let sent = 0;
  let skipped = 0;

  for (const device of userDevices) {
    for (const alert of candidateAlerts) {
      const deliveryKey = `${input.userId}::${device.endpoint}::${alert.id}`;
      const alreadySent = state.deliveries.some((item) => item.key === deliveryKey);
      if (alreadySent) {
        skipped += 1;
        continue;
      }

      const payload = JSON.stringify({
        title: "Nueva alerta disponible",
        body: `${alert.symbol} · ${alert.direction} · ${alert.timestampLabel}`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: `alert-${alert.id}`,
        data: {
          url: `/trader/alertas?alert=${encodeURIComponent(alert.id)}`,
          alertId: alert.id,
        },
        actions: [
          {
            action: "open-alert",
            title: "Ver ahora",
          },
        ],
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: device.endpoint,
            expirationTime: device.expirationTime,
            keys: {
              p256dh: device.keys.p256dh,
              auth: device.keys.auth,
            },
          },
          payload,
          {
            TTL: 60,
            urgency: "high",
          }
        );

        sent += 1;
        sentPayloads.push({
          key: deliveryKey,
          userId: input.userId,
          endpoint: device.endpoint,
          alertId: alert.id,
          sentAt: new Date().toISOString(),
        });
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.add(device.endpoint);
        }
      }
    }
  }

  await withStateMutation(async (mutable) => {
    pruneState(mutable);

    if (sentPayloads.length > 0) {
      mutable.deliveries.push(...sentPayloads);
    }

    if (staleEndpoints.size > 0) {
      mutable.subscriptions = mutable.subscriptions.filter(
        (item) => !(item.userId === input.userId && staleEndpoints.has(item.endpoint))
      );
      mutable.deliveries = mutable.deliveries.filter(
        (item) => !(item.userId === input.userId && staleEndpoints.has(item.endpoint))
      );
    }
  });

  return { sent, skipped, devices: userDevices.length };
}
