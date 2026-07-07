export type SupportedWebhookProvider = "stripe" | "mercadopago" | "openpay" | "custom";

export function normalizeWebhookProvider(value: string | null | undefined): SupportedWebhookProvider | null {
  const provider = String(value ?? "").trim().toLowerCase();
  if (provider === "stripe" || provider === "mercadopago" || provider === "openpay" || provider === "custom") {
    return provider;
  }

  return null;
}

export function isWebhookPayloadWithinLimit(payloadRaw: string, maxBytes: number): boolean {
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    return false;
  }

  return Buffer.byteLength(payloadRaw, "utf8") <= maxBytes;
}

export function parseWebhookTimestampMillis(value: string | null | undefined): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber > 1_000_000_000_000 ? asNumber : asNumber * 1000;
  }

  const parsedDate = new Date(raw);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getTime();
  }

  return null;
}

export function isWebhookTimestampWithinTolerance(input: {
  timestampMs: number;
  nowMs: number;
  toleranceMs: number;
}): boolean {
  if (!Number.isFinite(input.timestampMs) || !Number.isFinite(input.nowMs) || !Number.isFinite(input.toleranceMs)) {
    return false;
  }

  if (input.toleranceMs <= 0) {
    return false;
  }

  return Math.abs(input.nowMs - input.timestampMs) <= input.toleranceMs;
}
