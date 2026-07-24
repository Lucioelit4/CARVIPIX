CREATE TABLE IF NOT EXISTS bot_mt5_owner_certifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_id TEXT NOT NULL UNIQUE REFERENCES bot_mt5_licenses(license_id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('PROVISIONED', 'SIGNAL_CREATED', 'EXECUTED', 'CLOSED', 'REVOKED')),
  signal_id TEXT UNIQUE,
  installation_id TEXT,
  account_number TEXT,
  broker_server TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signal_created_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);