/**
 * CARVIPIX - Database Schema for EA MT5 V1
 */

const BACKTICK = String.fromCharCode(96);

export const EA_SCHEMA_SQL = [
  "CREATE TABLE IF NOT EXISTS bot_mt5_licenses (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, license_id TEXT NOT NULL UNIQUE, user_id TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), activated_at TIMESTAMPTZ, expires_at TIMESTAMPTZ NOT NULL, max_installations INT NOT NULL DEFAULT 1, subscription_tier TEXT NOT NULL DEFAULT 'BASIC', CONSTRAINT chk_license_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')), CONSTRAINT chk_subscription_tier CHECK (subscription_tier IN ('BASIC', 'PRO', 'ENTERPRISE')))",
  "CREATE TABLE IF NOT EXISTS bot_mt5_installations (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, license_id TEXT NOT NULL REFERENCES bot_mt5_licenses(license_id) ON DELETE CASCADE, installation_id TEXT NOT NULL UNIQUE, account_hash TEXT NOT NULL, broker TEXT NOT NULL DEFAULT 'Unknown', server TEXT NOT NULL DEFAULT 'Unknown', account_number TEXT, magic_number BIGINT, status TEXT NOT NULL DEFAULT 'DISCONNECTED', open_positions INT DEFAULT 0, daily_trades INT DEFAULT 0, daily_loss_percent DECIMAL(10,4) DEFAULT 0, first_connection TIMESTAMPTZ, last_heartbeat TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT chk_installation_status CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'SUSPENDED', 'ERROR')))",
  "CREATE TABLE IF NOT EXISTS bot_mt5_signals (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, signal_id TEXT NOT NULL UNIQUE, installation_id TEXT REFERENCES bot_mt5_installations(installation_id) ON DELETE SET NULL, license_id TEXT REFERENCES bot_mt5_licenses(license_id) ON DELETE SET NULL, symbol TEXT NOT NULL, decision TEXT NOT NULL, entry DECIMAL(20,8) NOT NULL, stop_loss DECIMAL(20,8) NOT NULL, take_profit DECIMAL(20,8) NOT NULL, risk_reward DECIMAL(10,4) DEFAULT 1.0, lot_size DECIMAL(10,4), timeframe TEXT, confidence INT, status TEXT NOT NULL DEFAULT 'PENDING', error_reason TEXT, created_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), delivered_at TIMESTAMPTZ, executed_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, CONSTRAINT chk_signal_decision CHECK (decision IN ('BUY', 'SELL')), CONSTRAINT chk_signal_status CHECK (status IN ('PENDING', 'DELIVERED', 'EXECUTED', 'CLOSED', 'REJECTED', 'EXPIRED')))",
  "CREATE TABLE IF NOT EXISTS bot_mt5_executions (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, signal_id TEXT NOT NULL, installation_id TEXT NOT NULL, ticket BIGINT, symbol TEXT, direction TEXT, entry_price DECIMAL(20,8), stop_loss DECIMAL(20,8), take_profit DECIMAL(20,8), lot_size DECIMAL(10,4), pnl DECIMAL(20,4) DEFAULT 0, pips DECIMAL(10,2) DEFAULT 0, status TEXT NOT NULL DEFAULT 'OPEN', opened_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT chk_execution_status CHECK (status IN ('OPEN', 'CLOSED', 'ERROR')))",
  "CREATE TABLE IF NOT EXISTS bot_mt5_audit (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, installation_id TEXT, license_id TEXT, event_type TEXT NOT NULL, event_data JSONB, ip_address TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
  "CREATE INDEX IF NOT EXISTS idx_licenses_license_id ON bot_mt5_licenses(license_id)",
  "CREATE INDEX IF NOT EXISTS idx_licenses_status ON bot_mt5_licenses(status)",
  "CREATE INDEX IF NOT EXISTS idx_installations_installation_id ON bot_mt5_installations(installation_id)",
  "CREATE INDEX IF NOT EXISTS idx_installations_license_id ON bot_mt5_installations(license_id)",
  "CREATE INDEX IF NOT EXISTS idx_installations_last_heartbeat ON bot_mt5_installations(last_heartbeat)",
  "CREATE INDEX IF NOT EXISTS idx_signals_status ON bot_mt5_signals(status)",
  "CREATE INDEX IF NOT EXISTS idx_signals_signal_id ON bot_mt5_signals(signal_id)",
  "CREATE INDEX IF NOT EXISTS idx_signals_created_at ON bot_mt5_signals(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_executions_signal_id ON bot_mt5_executions(signal_id)",
  "CREATE INDEX IF NOT EXISTS idx_executions_installation_id ON bot_mt5_executions(installation_id)"
].join("; ");

export async function initializeEASchema(db: { query: (sql: string) => Promise<void> }) {
  const statements = EA_SCHEMA_SQL.split("; ");
  for (const stmt of statements) {
    if (stmt.trim()) {
      await db.query(stmt.trim());
    }
  }
  console.log("[SCHEMA] EA MT5 schema initialized");
}

export default { EA_SCHEMA_SQL, initializeEASchema };