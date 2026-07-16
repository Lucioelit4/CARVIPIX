/**
 * CARVIPIX Core Database Schema
 * 7 tablas obligatorias para E2E real - PostgreSQL
 */

-- 1. master_events: Registro de eventos maestros (la fuente de verdad)
CREATE TABLE IF NOT EXISTS master_events (
  event_id VARCHAR(50) PRIMARY KEY,
  signal_id VARCHAR(100) NOT NULL,
  analysis_id VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  entry DECIMAL(20,5),
  stop_loss DECIMAL(20,5),
  take_profit DECIMAL(20,5),
  quality VARCHAR(3),
  confidence SMALLINT,
  risk_reward DECIMAL(5,2),
  modules_requested TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_id ON master_events(signal_id);
CREATE INDEX IF NOT EXISTS idx_symbol ON master_events(symbol);
CREATE INDEX IF NOT EXISTS idx_status ON master_events(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON master_events(created_at);

-- 2. module_state_history: Historial de estado de cada módulo
CREATE TABLE IF NOT EXISTS module_state_history (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL REFERENCES master_events(event_id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  state VARCHAR(30) NOT NULL,
  progress SMALLINT DEFAULT 0,
  received_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  steps_completed SMALLINT DEFAULT 0,
  total_steps SMALLINT DEFAULT 5,
  metadata JSONB,
  CONSTRAINT idx_event_module UNIQUE(event_id, module_name)
);

CREATE INDEX IF NOT EXISTS idx_msh_event_id ON module_state_history(event_id);
CREATE INDEX IF NOT EXISTS idx_msh_module_name ON module_state_history(module_name);
CREATE INDEX IF NOT EXISTS idx_msh_state ON module_state_history(state);

-- 3. event_executions: Retornos de ejecución desde MT5
CREATE TABLE IF NOT EXISTS event_executions (
  execution_id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL REFERENCES master_events(event_id) ON DELETE CASCADE,
  broker_ticket BIGINT,
  entry_price DECIMAL(20,5),
  execution_status VARCHAR(20) NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_ee_event_id ON event_executions(event_id);
CREATE INDEX IF NOT EXISTS idx_ee_broker_ticket ON event_executions(broker_ticket);
CREATE INDEX IF NOT EXISTS idx_ee_executed_at ON event_executions(executed_at);

-- 4. trade_closures: Retornos de cierre desde MT5
CREATE TABLE IF NOT EXISTS trade_closures (
  closure_id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL REFERENCES master_events(event_id) ON DELETE CASCADE,
  close_type VARCHAR(30) NOT NULL,
  close_price DECIMAL(20,5),
  pips DECIMAL(10,2),
  profit_loss DECIMAL(15,2),
  closed_at TIMESTAMP DEFAULT NOW(),
  duration_seconds INT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_tc_event_id ON trade_closures(event_id);
CREATE INDEX IF NOT EXISTS idx_tc_closed_at ON trade_closures(closed_at);

-- 5. event_timeline: Log de todos los eventos del ciclo
CREATE TABLE IF NOT EXISTS event_timeline (
  timeline_id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(50) NOT NULL REFERENCES master_events(event_id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  timestamp_utc TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_et_event_id ON event_timeline(event_id);
CREATE INDEX IF NOT EXISTS idx_et_event_type ON event_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_et_timestamp ON event_timeline(timestamp_utc);

-- 6. module_registry: Estado actual de cada módulo
CREATE TABLE IF NOT EXISTS module_registry (
  module_id VARCHAR(50) PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
  last_heartbeat TIMESTAMP,
  last_error_message TEXT,
  total_processed BIGINT DEFAULT 0,
  total_failed BIGINT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mr_status ON module_registry(status);
CREATE INDEX IF NOT EXISTS idx_mr_last_heartbeat ON module_registry(last_heartbeat);

-- 7. telegram_messages: Log de mensajes Telegram enviados
CREATE TABLE IF NOT EXISTS telegram_messages (
  message_id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(50) REFERENCES master_events(event_id) ON DELETE CASCADE,
  signal_id VARCHAR(100),
  telegram_message_id BIGINT,
  channel VARCHAR(100) NOT NULL,
  message_body TEXT NOT NULL,
  stage VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SENT',
  sent_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_tm_event_id ON telegram_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_tm_signal_id ON telegram_messages(signal_id);
CREATE INDEX IF NOT EXISTS idx_tm_telegram_message_id ON telegram_messages(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_tm_sent_at ON telegram_messages(sent_at);

-- 8. admin_state_persistence (bonus): Estado del Admin Brain
CREATE TABLE IF NOT EXISTS admin_state_persistence (
  state_id VARCHAR(50) PRIMARY KEY DEFAULT 'BRAIN_STATE',
  brain_state VARCHAR(30) NOT NULL,
  activated_at TIMESTAMP,
  activated_by VARCHAR(100),
  last_signal_time TIMESTAMP,
  last_signal_id VARCHAR(100),
  error_message TEXT,
  connected_modules SMALLINT DEFAULT 0,
  telegram_connected BOOLEAN DEFAULT false,
  mt5_connected BOOLEAN DEFAULT false,
  cycles_completed BIGINT DEFAULT 0,
  failed_cycles BIGINT DEFAULT 0,
  metadata JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Views

-- Vista: Estado actual de módulos en evento activo
CREATE OR REPLACE VIEW v_event_module_status AS
SELECT 
  msh.event_id,
  msh.module_name,
  msh.state,
  msh.progress,
  msh.received_at,
  msh.completed_at,
  EXTRACT(EPOCH FROM (COALESCE(msh.completed_at, NOW()) - msh.received_at))::INT as duration_seconds,
  me.symbol,
  me.direction,
  me.status as event_status
FROM module_state_history msh
JOIN master_events me ON msh.event_id = me.event_id
ORDER BY msh.received_at DESC;

-- Vista: Resumen de ejecuciones
CREATE OR REPLACE VIEW v_execution_summary AS
SELECT 
  ee.event_id,
  me.symbol,
  me.direction,
  ee.broker_ticket,
  ee.entry_price,
  ee.execution_status,
  tc.close_price,
  tc.pips,
  tc.profit_loss,
  tc.close_type,
  EXTRACT(EPOCH FROM (tc.closed_at - me.created_at))::INT as cycle_duration_seconds
FROM event_executions ee
LEFT JOIN trade_closures tc ON ee.event_id = tc.event_id
JOIN master_events me ON ee.event_id = me.event_id
ORDER BY ee.executed_at DESC;
