CREATE TABLE IF NOT EXISTS bot_mt5_temporary_certifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_id TEXT NOT NULL UNIQUE REFERENCES bot_mt5_licenses(license_id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  broker_server TEXT NOT NULL,
  symbol TEXT NOT NULL,
  installation_id TEXT UNIQUE,
  signal_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('READY', 'CONNECTED', 'SIGNAL_ISSUED', 'RECEIVED_MARKET_CLOSED', 'REVOKED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  signal_issued_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  revoke_reason TEXT
);