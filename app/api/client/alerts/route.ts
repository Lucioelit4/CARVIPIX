import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { CommercialAccessError, FeatureAccessGuard } from "@/app/backend/commercial/access-control";
import { recordCommercialAuditEvent } from "@/app/backend/commercial/audit-store";
import { getAlertsCreatedToday, listAlertHistory } from "@/app/backend/commercial/portal-service";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const commercialAccess = await resolveUserCommercialAccess(auth.user.id);
    new FeatureAccessGuard().assertAccess(
      {
        membershipActive: commercialAccess.membershipActive,
        entitlements: commercialAccess.entitlements,
      },
      "alertas"
    );

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? commercialAccess.entitlements.historyLimit);
    const [alerts, stats, rules, createdToday, history] = await Promise.all([
      ecosystemServices.alerts.getAlerts({ userId: auth.user.id, limit: Number.isFinite(limit) && limit > 0 ? limit : 50 }),
      ecosystemServices.alerts.getAlertStats(auth.user.id),
      ecosystemServices.alerts.getAlertRules(auth.user.id),
      getAlertsCreatedToday(auth.user.id),
      listAlertHistory(auth.user.id, commercialAccess.entitlements.historyLimit),
    ]);

    return NextResponse.json(
      {
        data: {
          plan: commercialAccess.subscriptionPlan,
          entitlements: commercialAccess.entitlements,
          usage: {
            createdToday,
            remainingToday: Math.max(0, commercialAccess.entitlements.maxAlertsPerDay - createdToday),
          },
          alerts,
          stats,
          rules,
          history,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "No se pudo cargar alertas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "createRule" | "logAction";
    rule?: {
      name?: string;
      enabled?: boolean;
      condition?: string;
      symbols?: string[];
      alertTypes?: Array<"signal" | "risk" | "news" | "technical">;
    };
    alertId?: string;
    alertAction?: "viewed" | "dismissed" | "triggered";
  };

  try {
    const commercialAccess = await resolveUserCommercialAccess(auth.user.id);
    new FeatureAccessGuard().assertAccess(
      {
        membershipActive: commercialAccess.membershipActive,
        entitlements: commercialAccess.entitlements,
      },
      "alertas"
    );

    if (body.action === "createRule") {
      const rule = body.rule ?? {};
      const data = await ecosystemServices.alerts.createAlertRule(auth.user.id, {
        name: String(rule.name ?? "Alerta manual").trim() || "Alerta manual",
        enabled: rule.enabled ?? true,
        condition: String(rule.condition ?? "Confirmacion manual del cliente").trim() || "Confirmacion manual del cliente",
        symbols: Array.isArray(rule.symbols) ? rule.symbols : [],
        alertTypes: Array.isArray(rule.alertTypes) && rule.alertTypes.length > 0 ? rule.alertTypes : ["signal"],
      });
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: "alerts.rule.create", resource: data.id, result: "success", metadata: { symbols: data.symbols } });
      return NextResponse.json({ data }, { status: 201 });
    }

    if (body.action === "logAction") {
      const alertId = String(body.alertId ?? "").trim();
      const action = body.alertAction ?? "viewed";
      if (!alertId) {
        return NextResponse.json({ error: "alertId es requerido" }, { status: 400 });
      }
      await ecosystemServices.alerts.logAlertAction(auth.user.id, alertId, action);
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: `alerts.${action}`, resource: alertId, result: "success" });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Accion no soportada" }, { status: 400 });
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: `alerts.${body.action ?? 'unknown'}`, resource: "alerts", result: "denied", metadata: { code: error.code } });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    await recordCommercialAuditEvent({ userId: auth.user.id, actorType: "client", action: `alerts.${body.action ?? 'unknown'}`, resource: "alerts", result: "error" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo procesar alertas" }, { status: 500 });
  }
}
