import { backendDatabase } from "../app/backend/core/database";
import {
  ensurePayPalTables,
  reconcilePayPalSubscriptionTransactions,
} from "../app/backend/paypal/sandbox";

async function main() {
  if (!backendDatabase.enabled) {
    throw new Error("DATABASE_URL no configurado");
  }

  await ensurePayPalTables();
  const subscriptions = await backendDatabase.query<{ user_id: string; paypal_subscription_id: string }>(
    `
    SELECT DISTINCT pbr.user_id, pbr.paypal_subscription_id
    FROM paypal_billing_records pbr
    INNER JOIN users u ON u.id = pbr.user_id
    WHERE pbr.paypal_subscription_id IS NOT NULL
      AND pbr.last_payment_at IS NOT NULL
      AND COALESCE(u.exclude_from_commercial_metrics, false) = false
    ORDER BY pbr.user_id, pbr.paypal_subscription_id
    `
  );

  let discovered = 0;
  let stored = 0;
  for (const subscription of subscriptions.rows) {
    const result = await reconcilePayPalSubscriptionTransactions({
      subscriptionId: subscription.paypal_subscription_id,
      userId: subscription.user_id,
    });
    discovered += result.discovered;
    stored += result.stored;
  }

  console.log(JSON.stringify({ subscriptions: subscriptions.rows.length, discovered, stored }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Conciliacion PayPal fallida");
  process.exitCode = 1;
});