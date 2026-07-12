import { requireClientSession } from "@/app/api/client/_auth";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";

import { createBillingHandlers } from "./handlers";

const handlers = createBillingHandlers({
  requireAuth: requireClientSession,
  resolveAccess: resolveUserCommercialAccess,
  db: backendDatabase,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
