import { requireClientSession } from "@/app/api/client/_auth";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";

import { createSupportIntelligenceHandlers } from "./handlers";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const handlers = createSupportIntelligenceHandlers({
  requireAuth: requireClientSession,
  resolveProfile: async (userId, authUser) => {
    if (!userId) {
      return {
        segment: "visitante",
        plan: "free",
        hasMembership: false,
        services: { bot: false, capital: false },
      };
    }

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

    const plan = access.subscriptionPlan;
    const hasMembership = access.membershipActive;
    const hasBot = Boolean(botLicenseResult.rows[0]?.active);
    const capitalStatus = String(capitalResult.rows[0]?.status ?? "").toLowerCase();
    const hasCapital = ["accepted", "contract_sent", "contract_signed", "active"].includes(capitalStatus);
    const roleValue = String(userRoleResult.rows[0]?.user_role ?? authUser?.user_role ?? "CLIENT").toUpperCase();

    const segment = roleValue === "ADMIN"
      ? "administrador"
      : hasCapital
        ? "gestion-capital"
        : hasBot
          ? "usuario-bot"
          : plan === "advanced"
            ? "miembro-pro"
            : plan === "basic"
              ? "miembro-basico"
              : "visitante";

    return {
      segment,
      plan,
      hasMembership,
      services: {
        bot: hasBot,
        capital: hasCapital,
      },
    };
  },
  createTicket: async ({ userId, subject, category, priority, message, conversation, responsible }) => {
    const id = createId("ticket");
    await backendDatabase.query(
      `
      INSERT INTO support_tickets (
        id,
        user_id,
        subject,
        category,
        status,
        priority,
        message,
        responsible,
        conversation_snapshot,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, $8::jsonb, NOW(), NOW())
      `,
      [id, userId, subject, category, priority, message, responsible, JSON.stringify(conversation)]
    );

    await backendDatabase.query(
      `
      INSERT INTO support_ticket_events (id, ticket_id, actor_type, action, note, metadata, created_at)
      VALUES ($1, $2, 'system', 'ticket_created_auto', $3, $4::jsonb, NOW())
      `,
      [createId("ticket-event"), id, "Ticket creado automaticamente por agente inteligente", JSON.stringify({ category, priority })]
    );

    return { id };
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;
