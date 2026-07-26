import { NextRequest, NextResponse } from "next/server";
import { requireClientSession } from "@/app/api/client/_auth";
import {
  getPushPublicKey,
  isPushConfigured,
  listPushDevices,
  removePushSubscription,
  upsertPushSubscription,
} from "@/app/backend/services/pwa-push-service";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const devices = await listPushDevices(auth.user.id);

  return NextResponse.json(
    {
      data: {
        configured: isPushConfigured(),
        publicKey: getPushPublicKey(),
        devices,
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "subscribe" | "unsubscribe";
    subscription?: {
      endpoint?: string;
      expirationTime?: number | null;
      keys?: {
        p256dh?: string;
        auth?: string;
      };
    };
    deviceLabel?: string;
  };

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push no configurado en servidor" }, { status: 503 });
  }

  if (body.action === "subscribe") {
    if (!body.subscription) {
      return NextResponse.json({ error: "subscription requerida" }, { status: 400 });
    }

    const result = await upsertPushSubscription({
      userId: auth.user.id,
      subscription: {
        endpoint: String(body.subscription.endpoint ?? "").trim(),
        expirationTime: body.subscription.expirationTime ?? null,
        keys: {
          p256dh: String(body.subscription.keys?.p256dh ?? "").trim(),
          auth: String(body.subscription.keys?.auth ?? "").trim(),
        },
      },
      userAgent: request.headers.get("user-agent") ?? "",
      deviceLabel: body.deviceLabel,
    });

    if (!result.saved) {
      return NextResponse.json({ error: "Subscription invalida" }, { status: 400 });
    }

    return NextResponse.json({ data: result }, { status: 201 });
  }

  if (body.action === "unsubscribe") {
    const endpoint = String(body.subscription?.endpoint ?? "").trim();
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint requerido" }, { status: 400 });
    }

    const result = await removePushSubscription({
      userId: auth.user.id,
      endpoint,
    });

    return NextResponse.json({ data: result }, { status: 200 });
  }

  return NextResponse.json({ error: "Accion no soportada" }, { status: 400 });
}
