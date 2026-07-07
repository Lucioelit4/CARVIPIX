import { NextRequest, NextResponse } from "next/server";
import { ecosystemServices } from "@/app/backend";
import { requireClientSession } from "@/app/api/client/_auth";

export async function GET(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const account = await ecosystemServices.capital.getCapitalAccount(auth.user.id);
  const [movements, reports, investorStats] = await Promise.all([
    account ? ecosystemServices.capital.getCapitalMovements(account.accountId) : Promise.resolve([]),
    account ? ecosystemServices.capital.getMonthlyReports(account.accountId) : Promise.resolve([]),
    ecosystemServices.capital.getInvestorStats(),
  ]);

  return NextResponse.json(
    {
      data: {
        account,
        movements,
        reports,
        investorStats,
      },
    },
    { status: 200 }
  );
}
