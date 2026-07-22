BEGIN;

CREATE TABLE IF NOT EXISTS probabilistic_simulation_runs (
  run_id TEXT PRIMARY KEY,
  methodology_version TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  data_source TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  seed TEXT NOT NULL,
  iterations INTEGER NOT NULL CHECK (iterations > 0),
  assumptions JSONB NOT NULL,
  limitations JSONB NOT NULL,
  metrics JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end > period_start)
);

CREATE TABLE IF NOT EXISTS probabilistic_simulation_scenarios (
  scenario_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES probabilistic_simulation_runs(run_id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  source_type TEXT NOT NULL CHECK (source_type IN ('DOCUMENTED_MODEL', 'RECORDED_ANALYSIS')),
  activation_probability NUMERIC(10, 8) NOT NULL CHECK (activation_probability BETWEEN 0 AND 1),
  success_probability NUMERIC(10, 8) NOT NULL CHECK (success_probability BETWEEN 0 AND 1),
  risk_reward NUMERIC(12, 4) NOT NULL,
  risk_pips NUMERIC(14, 4) NOT NULL,
  spread_pips NUMERIC(14, 6) NOT NULL,
  commission_pips NUMERIC(14, 6) NOT NULL,
  slippage_pips NUMERIC(14, 6) NOT NULL,
  observed_outcome TEXT CHECK (observed_outcome IN ('TP', 'SL', 'NOT_ACTIVATED')),
  observed_signal_id TEXT UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (run_id, symbol, occurred_at)
);

CREATE TABLE IF NOT EXISTS probabilistic_profiles (
  profile_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES probabilistic_simulation_runs(run_id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_key TEXT NOT NULL,
  risk_type TEXT NOT NULL CHECK (risk_type IN ('CONSERVATIVE', 'MODERATE', 'DYNAMIC')),
  initial_balance NUMERIC(14, 2) NOT NULL,
  current_balance NUMERIC(14, 2) NOT NULL,
  peak_balance NUMERIC(14, 2) NOT NULL,
  max_drawdown_pct NUMERIC(10, 4) NOT NULL DEFAULT 0,
  weekly_result NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monthly_result NUMERIC(14, 2) NOT NULL DEFAULT 0,
  operations_applied INTEGER NOT NULL DEFAULT 0,
  is_real_user BOOLEAN NOT NULL DEFAULT false CHECK (is_real_user = false),
  profile_type TEXT NOT NULL DEFAULT 'PROBABILISTIC_SIMULATION' CHECK (profile_type = 'PROBABILISTIC_SIMULATION'),
  exclude_from_members BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_members = true),
  exclude_from_revenue BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_revenue = true),
  exclude_from_live_users BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_live_users = true),
  exclude_from_testimonials BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_testimonials = true),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS probabilistic_profile_events (
  event_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES probabilistic_profiles(profile_id) ON DELETE CASCADE,
  signal_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('SIMULATED_SCENARIO', 'OBSERVED_OFFICIAL_CLOSURE')),
  outcome TEXT NOT NULL CHECK (outcome IN ('TP', 'SL', 'NOT_ACTIVATED', 'CLOSED')),
  balance_before NUMERIC(14, 2) NOT NULL,
  balance_after NUMERIC(14, 2) NOT NULL,
  pnl NUMERIC(14, 2) NOT NULL,
  drawdown_pct NUMERIC(10, 4) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, signal_id)
);

CREATE TABLE IF NOT EXISTS probabilistic_profile_balances (
  profile_id TEXT NOT NULL REFERENCES probabilistic_profiles(profile_id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  balance NUMERIC(14, 2) NOT NULL,
  drawdown_pct NUMERIC(10, 4) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (profile_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS probabilistic_bot_profiles (
  profile_id TEXT PRIMARY KEY REFERENCES probabilistic_profiles(profile_id) ON DELETE CASCADE,
  selection_rank INTEGER NOT NULL,
  signals_processed INTEGER NOT NULL DEFAULT 0,
  performance_by_asset JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS probabilistic_scenarios_run_time_idx
  ON probabilistic_simulation_scenarios(run_id, occurred_at);
CREATE INDEX IF NOT EXISTS probabilistic_profiles_run_risk_idx
  ON probabilistic_profiles(run_id, risk_type);
CREATE INDEX IF NOT EXISTS probabilistic_profile_events_signal_idx
  ON probabilistic_profile_events(signal_id);

COMMIT;