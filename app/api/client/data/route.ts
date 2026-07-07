import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
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
        return NextResponse.json({ data: await ecosystemServices.alerts.getAlerts({ userId: auth.user.id, limit: Number(payload.limit ?? 0) || undefined }) });
      case "getAlertStats":
        return NextResponse.json({ data: await ecosystemServices.alerts.getAlertStats(auth.user.id) });
      case "getBotLicense":
        return NextResponse.json({ data: await ecosystemServices.bot.getLicense(auth.user.id) });
      case "getBotInstances":
        return NextResponse.json({ data: await ecosystemServices.bot.getBotInstances(auth.user.id) });
      case "getCapitalAccount":
        return NextResponse.json({ data: await ecosystemServices.capital.getCapitalAccount(auth.user.id) });
      case "getBalance": {
        const account = await ecosystemServices.capital.getCapitalAccount(auth.user.id);
        const data = account
          ? {
              currentBalance: Number(account.currentBalance ?? 0),
              initialCapital: Number(account.initialCapital ?? 0),
              profitLoss: Number(account.utilidad ?? 0),
              monthlyReturn: Number(account.monthlyReturn ?? 0),
              annualReturn: Number(account.annualReturn ?? 0),
            }
          : {
              currentBalance: 0,
              initialCapital: 0,
              profitLoss: 0,
              monthlyReturn: 0,
              annualReturn: 0,
            };
        return NextResponse.json({ data });
      }
      case "getCapitalMovements": {
        const account = await ecosystemServices.capital.getCapitalAccount(auth.user.id);
        const data = account ? await ecosystemServices.capital.getCapitalMovements(account.accountId) : [];
        return NextResponse.json({ data });
      }
      case "getCapitalMonthlyReports": {
        const account = await ecosystemServices.capital.getCapitalAccount(auth.user.id);
        const data = account ? await ecosystemServices.capital.getMonthlyReports(account.accountId) : [];
        return NextResponse.json({ data });
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
  } catch {
    return NextResponse.json({ error: "Failed to resolve data action" }, { status: 500 });
  }
}
