import { requireClientSession } from "@/app/api/client/_auth";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";

import { createCommunityChatHandlers } from "./handlers";

const handlers = createCommunityChatHandlers({
  requireAuth: requireClientSession,
  resolveProfile: async (userId, authUser) => {
    const [access, botLicenseResult, capitalResult, userRoleResult] = await Promise.all([
      resolveUserCommercialAccess(userId),
      backendDatabase.query<{ active: boolean }>(
        `
        SELECT active
        FROM bot_licenses
        WHERE user_id = $1
        ORDER BY purchase_date DESC
        LIMIT 1
        `,
        [userId]
      ),
      backendDatabase.query<{ status: string }>(
        `
        SELECT status
        FROM capital_requests
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [userId]
      ),
      backendDatabase.query<{ user_role: string }>(
        `
        SELECT user_role
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [userId]
      ),
    ]);

    const capitalStatus = String(capitalResult.rows[0]?.status ?? "").toLowerCase();
    const roleValue = String(userRoleResult.rows[0]?.user_role ?? authUser?.user_role ?? "CLIENT").toUpperCase();

    return {
      plan: access.subscriptionPlan,
      membershipActive: access.membershipActive,
      hasBot: Boolean(botLicenseResult.rows[0]?.active),
      hasCapital: ["accepted", "contract_sent", "contract_signed", "active"].includes(capitalStatus),
      isAdmin: roleValue === "ADMIN",
    };
  },
  db: backendDatabase,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
