import { requireClientSession } from "@/app/api/client/_auth";
import { hasInternalOwnerAccess } from "@/app/backend/commercial/owner-access";
import { resolveUserCommercialAccess } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";
import { cancelPayPalSubscription } from "@/app/backend/paypal/sandbox";

import { createBillingHandlers } from "./handlers";

const handlers = createBillingHandlers({
  requireAuth: requireClientSession,
  resolveAccess: resolveUserCommercialAccess,
  db: backendDatabase,
  cancelSubscription: cancelPayPalSubscription,
  isInternalOwner: hasInternalOwnerAccess,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
