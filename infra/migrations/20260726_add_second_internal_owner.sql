-- Add second permanent internal owner access with no billing, no renewal, and no expiry.

WITH owner_user AS (
  SELECT id
  FROM users
  WHERE LOWER(email) = LOWER('ymiler94@gmail.com')
  LIMIT 1
)
UPDATE users
SET plan = 'pro',
    estado = 'activo',
    fecha_vencimiento = NULL,
    verificado = true,
    user_type = 'STANDARD',
    user_role = 'CLIENT',
    exclude_from_commercial_metrics = true
WHERE id IN (SELECT id FROM owner_user);

WITH owner_user AS (
  SELECT id
  FROM users
  WHERE LOWER(email) = LOWER('ymiler94@gmail.com')
  LIMIT 1
)
INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, updated_at)
SELECT id, 'pro', 'activo', NOW(), NULL, false, NOW()
FROM owner_user
ON CONFLICT (user_id)
DO UPDATE SET
  plan = 'pro',
  estado = 'activo',
  fecha_fin = NULL,
  renovacion_automatica = false,
  payment_subscription_id = NULL,
  updated_at = NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'paypal_subscriptions'
  ) THEN
    UPDATE paypal_subscriptions
    SET status = 'CANCELLED',
        cancelled_at = NOW(),
        next_billing_date = NULL,
        updated_at = NOW()
    WHERE user_id IN (
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER('ymiler94@gmail.com')
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'paypal_billing_records'
  ) THEN
    UPDATE paypal_billing_records
    SET status = 'cancelled',
        next_billing_time = NULL,
        updated_at = NOW()
    WHERE user_id IN (
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER('ymiler94@gmail.com')
    )
      AND LOWER(status) IN ('pending', 'active', 'past_due', 'suspended', 'payment_failed');
  END IF;
END $$;