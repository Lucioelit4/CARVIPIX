CREATE TABLE IF NOT EXISTS observer_runtime_guard (
  guard_key TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observer_runtime_guard_owner_expires_at
ON observer_runtime_guard (owner_id, lease_expires_at);