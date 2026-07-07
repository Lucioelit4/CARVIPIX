import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

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

  return NextResponse.json({ data }, { status: 200 });
}
