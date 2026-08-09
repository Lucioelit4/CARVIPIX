CREATE TABLE IF NOT EXISTS observer_schedule_slot_claim (
  canonical_symbol TEXT NOT NULL,
  slot_start_utc_ms BIGINT NOT NULL,
  owner_id TEXT NOT NULL,
  trigger_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (canonical_symbol, slot_start_utc_ms)
);