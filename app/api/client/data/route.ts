import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { CommercialAccessError, FeatureAccessGuard } from "@/app/backend/commercial/access-control";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { findMembershipByUserId } from "@/app/lib/auth/server";
import { aiSupportService } from "@/app/lib/modules";
import { requireClientSession } from "@/app/api/client/_auth";

type DataAction =
  | "getCurrentUser"
  | "getCurrentMembership"
  | "getAlerts"
  | "getAlertStats"
  | "getBotLicense"
  | "getBotInstances"
  | "getCapitalAccount"
  | "getBalance"
  | "getCapitalMovements"
  | "getCapitalMonthlyReports"
  | "getPlatformResults"
  | "getResultsHistory"
  | "getOperations"
  | "getAllProducts"
  | "getPaymentProduct"
  | "createPaymentOrder"
  | "processPaymentOrder"
  | "getPaymentOrderHistory"
  | "getFundingSnapshot"
  | "getDailyBriefing"
  | "getTradingSuggestions";

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const featureAccessGuard = new FeatureAccessGuard();
    const assertFeatureAccess = async (feature: "alertas" | "bot") => {
      const commercialAccess = await resolveUserCommercialAccess(auth.user.id);
      featureAccessGuard.assertAccess(
        {
          membershipActive: commercialAccess.membershipActive,
          entitlements: commercialAccess.entitlements,
        },
        feature
      );
    };

    const body = (await request.json()) as {
      action?: DataAction;
      payload?: Record<string, unknown>;
    };

    const action = body.action;
    const payload = body.payload ?? {};

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "getCurrentUser":
        return NextResponse.json({
          data: {
            id: auth.user.id,
            email: auth.user.email,
            nombre: auth.user.nombre,
            apellido: auth.user.apellido,
            plan: auth.user.plan,
            estado: auth.user.estado,
            verificado: auth.user.verificado,
          },
        });
      case "getCurrentMembership": {
        const membership = await findMembershipByUserId(auth.user.id);
        return NextResponse.json({
          data:
            membership ?? {
              userId: auth.user.id,
              plan: auth.user.plan,
              estado: "inactivo" as const,
              fechaInicio: new Date(0),
              renovacionAutomatica: false,
              active: false,
            },
        });
      }
      case "getAlerts":
        await assertFeatureAccess("alertas");
        return NextResponse.json({ data: await ecosystemServices.alerts.getAlerts({ userId: auth.user.id, limit: Number(payload.limit ?? 0) || undefined }) });
      case "getAlertStats":
        await assertFeatureAccess("alertas");
        return NextResponse.json({ data: await ecosystemServices.alerts.getAlertStats(auth.user.id) });
      case "getBotLicense":
        await assertFeatureAccess("bot");
        return NextResponse.json({ data: await ecosystemServices.bot.getLicense(auth.user.id) });
      case "getBotInstances":
        await assertFeatureAccess("bot");
        return NextResponse.json({ data: await ecosystemServices.bot.getBotInstances(auth.user.id) });
      case "getCapitalAccount":
        return NextResponse.json({ error: "Modulo reemplazado por Socios Estrategicos CARVIPIX" }, { status: 410 });
      case "getBalance": {
        return NextResponse.json({ error: "Modulo reemplazado por Socios Estrategicos CARVIPIX" }, { status: 410 });
      }
      case "getCapitalMovements": {
        return NextResponse.json({ error: "Modulo reemplazado por Socios Estrategicos CARVIPIX" }, { status: 410 });
      }
      case "getCapitalMonthlyReports": {
        return NextResponse.json({ error: "Modulo reemplazado por Socios Estrategicos CARVIPIX" }, { status: 410 });
      }
      case "getPlatformResults":
        return NextResponse.json({
          data: await ecosystemServices.results.getPlatformResults((payload.period as "monthly" | "yearly" | "all-time") ?? "monthly"),
        });
      case "getResultsHistory":
        return NextResponse.json({ data: await ecosystemServices.results.getHistory(Number(payload.months ?? 0) || undefined) });
      case "getOperations":
        return NextResponse.json({ data: await ecosystemServices.operations.getOperations(auth.user.id, Number(payload.limit ?? 50) || 50) });
      case "getAllProducts":
        return NextResponse.json({ data: await ecosystemServices.payments.getProducts() });
      case "getPaymentProduct":
        return NextResponse.json({ data: await ecosystemServices.payments.getProduct(String(payload.productId ?? "")) });
      case "createPaymentOrder":
        return NextResponse.json({ data: await ecosystemServices.payments.createOrder(auth.user.id, String(payload.productId ?? "")) });
      case "processPaymentOrder": {
        const orderId = String(payload.orderId ?? "");
        const orders = await ecosystemServices.payments.getOrderHistory(auth.user.id);
        if (!orders.some((order) => order.id === orderId)) {
          return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        return NextResponse.json({
          data: await ecosystemServices.payments.processPayment(
            orderId,
            (payload.method as "card" | "crypto" | "bank_transfer") ?? "card"
          ),
        });
      }
      case "getPaymentOrderHistory":
        return NextResponse.json({ data: await ecosystemServices.payments.getOrderHistory(auth.user.id) });
      case "getFundingSnapshot":
        return NextResponse.json({ data: await ecosystemServices.funding.getSnapshot(auth.user.id) });
      case "getDailyBriefing":
        return NextResponse.json({ data: await aiSupportService.getDailyBriefing(auth.user.id) });
      case "getTradingSuggestions":
        return NextResponse.json({
          data: await aiSupportService.getTradingSuggestions(auth.user.id, typeof payload.context === "string" ? payload.context : undefined),
        });
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return NextResponse.json({ error: "Failed to resolve data action" }, { status: 500 });
  }
}
