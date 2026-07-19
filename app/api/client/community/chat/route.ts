import { requireClientSession } from "@/app/api/client/_auth";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";

import { createCommunityChatHandlers } from "./handlers";

const handlers = createCommunityChatHandlers({
  requireAuth: requireClientSession,
  resolveProfile: async (userId, authUser) => {
    const access = await resolveUserCommercialAccess(userId);

    const [botLicenseResult, strategicPartnerResult, userRoleResult] = await Promise.all([
      backendDatabase
        .query<{ active: boolean }>(
          `
          SELECT active
          FROM bot_licenses
          WHERE user_id = $1
          ORDER BY purchase_date DESC
          LIMIT 1
          `,
          [userId]
        )
        .catch(() => ({ rows: [] as Array<{ active: boolean }> })),
      backendDatabase
        .query<{ status: string }>(
          `
          SELECT status
          FROM strategic_partner_applications
          WHERE email = (
            SELECT email FROM users WHERE id = $1 LIMIT 1
          )
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [userId]
        )
        .catch(() => ({ rows: [] as Array<{ status: string }> })),
      backendDatabase
        .query<{ user_role: string }>(
          `
          SELECT user_role
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [userId]
        )
        .catch(() => ({ rows: [] as Array<{ user_role: string }> })),
    ]);

    const strategicPartnerStatus = String(strategicPartnerResult.rows[0]?.status ?? "").toLowerCase();
    const roleValue = String(userRoleResult.rows[0]?.user_role ?? authUser?.user_role ?? "CLIENT").toUpperCase();

    return {
      plan: access.subscriptionPlan,
      membershipActive: access.membershipActive,
      hasBot: Boolean(botLicenseResult.rows[0]?.active),
      hasCapital: ["approved_for_contact"].includes(strategicPartnerStatus),
      isAdmin: roleValue === "ADMIN",
    };
  },
  db: backendDatabase,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
