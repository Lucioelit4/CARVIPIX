import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/app/backend";
import { PaymentOrchestrator } from "@/app/backend/payments/core/orchestrator";
import {
  isWebhookPayloadWithinLimit,
  isWebhookTimestampWithinTolerance,
  normalizeWebhookProvider,
  parseWebhookTimestampMillis,
} from "@/app/backend/payments/core/webhook-security-logic";

const orchestrator = new PaymentOrchestrator();

function headersToRecord(request: NextRequest): Record<string, string> {
  const record: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const payloadRaw = await request.text();
  const rawProvider = request.headers.get("x-provider") ?? request.nextUrl.searchParams.get("provider") ?? "custom";
  const provider = normalizeWebhookProvider(rawProvider);

  if (!provider) {
    return NextResponse.json({ ok: false, error: "Unsupported provider" }, { status: 400 });
  }

  const maxPayloadBytes = Number(process.env.PAYMENT_WEBHOOK_MAX_PAYLOAD_BYTES ?? 256 * 1024);
  if (!isWebhookPayloadWithinLimit(payloadRaw, maxPayloadBytes)) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  const webhookRateLimit = rateLimiter.check({
    scope: "payments.webhook",
    key: `${provider}:${getClientIp(request)}`,
    limit: Number(process.env.PAYMENT_WEBHOOK_RATE_LIMIT ?? 120),
    windowMs: 60 * 1000,
  });

  if (!webhookRateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many webhook requests",
        retryAfter: webhookRateLimit.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  const hasMockSignature = Boolean(request.headers.get("x-mock-signature"));
  if (provider === "custom" && hasMockSignature) {
    const requireTimestamp = String(process.env.PAYMENT_WEBHOOK_REQUIRE_TIMESTAMP ?? "true").toLowerCase() !== "false";
    const timestampRaw = request.headers.get("x-mock-timestamp");
    const timestampMs = parseWebhookTimestampMillis(timestampRaw);

    if (requireTimestamp && timestampMs === null) {
      return NextResponse.json({ ok: false, error: "Missing webhook timestamp" }, { status: 400 });
    }

    if (timestampMs !== null) {
      const toleranceMs = Number(process.env.PAYMENT_WEBHOOK_TIMESTAMP_TOLERANCE_MS ?? 5 * 60 * 1000);
      const validTimestamp = isWebhookTimestampWithinTolerance({
        timestampMs,
        nowMs: Date.now(),
        toleranceMs,
      });

      if (!validTimestamp) {
        return NextResponse.json({ ok: false, error: "Webhook timestamp out of tolerance" }, { status: 400 });
      }
    }
  }

  try {
    const result = await orchestrator.processWebhook({
      provider,
      payloadRaw,
      headers: headersToRecord(request),
    });

    if (result.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    if (!result.ok && result.processStatus === "failed") {
      return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        duplicate: false,
        processStatus: result.processStatus,
        providerEventId: result.providerEventId,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
