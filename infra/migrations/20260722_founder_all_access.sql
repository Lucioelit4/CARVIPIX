CREATE TABLE IF NOT EXISTS founder_access_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'REDEEMED', 'REVOKED')),
  assigned_email TEXT NOT NULL UNIQUE,
  redeemed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  replacement_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (assigned_email = LOWER(assigned_email))
);

CREATE TABLE IF NOT EXISTS founder_access_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code_id TEXT NOT NULL REFERENCES founder_access_codes(id),
  role TEXT NOT NULL DEFAULT 'FOUNDER' CHECK (role = 'FOUNDER'),
  access_level TEXT NOT NULL DEFAULT 'ALL_ACCESS' CHECK (access_level = 'ALL_ACCESS'),
  billing_required BOOLEAN NOT NULL DEFAULT false CHECK (billing_required = false),
  subscription_source TEXT NOT NULL DEFAULT 'FOUNDER' CHECK (subscription_source = 'FOUNDER'),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED', 'BLOCKED')),
  is_paid_customer BOOLEAN NOT NULL DEFAULT false CHECK (is_paid_customer = false),
  exclude_from_revenue BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_revenue = true),
  exclude_from_sales BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_sales = true),
  exclude_from_subscription_metrics BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_subscription_metrics = true),
  previous_user_type TEXT NOT NULL DEFAULT 'STANDARD',
  previous_exclude_from_commercial_metrics BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_entitlements (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source = 'FOUNDER'),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED', 'BLOCKED')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entitlement, source),
  CHECK (expires_at IS NULL)
);

CREATE TABLE IF NOT EXISTS founder_bot_licenses (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  license_id TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL DEFAULT 'FOUNDER' CHECK (license_type = 'FOUNDER'),
  license_status TEXT NOT NULL CHECK (license_status IN ('ACTIVE', 'REVOKED', 'BLOCKED')),
  payment_required BOOLEAN NOT NULL DEFAULT false CHECK (payment_required = false),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at IS NULL)
);

CREATE TABLE IF NOT EXISTS founder_access_audit (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('FOUNDER', 'ADMIN', 'SYSTEM')),
  actor_id TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  code_id TEXT REFERENCES founder_access_codes(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('SUCCESS', 'DENIED', 'ERROR')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_activation_security (
  actor_key_hash TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_codes_status ON founder_access_codes(status);
CREATE INDEX IF NOT EXISTS idx_founder_profiles_status ON founder_access_profiles(status);
CREATE INDEX IF NOT EXISTS idx_founder_entitlements_active ON user_entitlements(user_id, status);
CREATE INDEX IF NOT EXISTS idx_founder_audit_created ON founder_access_audit(created_at DESC);

CREATE OR REPLACE FUNCTION enforce_founder_code_limit() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM founder_access_codes) >= 3 THEN
    RAISE EXCEPTION 'FOUNDER_CODE_LIMIT_REACHED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'founder_code_limit_guard') THEN
    CREATE TRIGGER founder_code_limit_guard
    BEFORE INSERT ON founder_access_codes
    FOR EACH ROW EXECUTE FUNCTION enforce_founder_code_limit();
  END IF;
END;
$$;

-- Operational rollback: set FOUNDER_ACCESS_ENABLED=false to stop new activations.
-- Existing access remains active by design. Use the audited admin revocation action
-- to disable individual Founder profiles; no table or historical record is dropped.