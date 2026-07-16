/**
 * CARVIPIX Master Event Dispatcher - Database Schema
 * 
 * Tablas necesarias para el ciclo E2E completo
 * 
 * Ejecutar en PostgreSQL via Neon:
 * psql $DATABASE_URL < migrations/master-event-dispatcher.sql
 */

-- ==================== TABLAS PRINCIPALES ====================

/**
 * Tabla: master_events
 * Registra cada evento maestro generado
 */
CREATE TABLE IF NOT EXISTS master_events (
  event_id          VARCHAR(50) PRIMARY KEY,
  signal_id         VARCHAR(50) NOT NULL,
  analysis_id       VARCHAR(50) NOT NULL,
  execution_id      VARCHAR(50),
  
  -- Evento
  type              VARCHAR(30) NOT NULL,
  status            VARCHAR(20) NOT NULL,
  source            VARCHAR(20) NOT NULL,
  
  -- Datos
  symbol            VARCHAR(20) NOT NULL,
  direction         VARCHAR(10) NOT NULL,
  entry             DECIMAL(10, 5),
  stop_loss         DECIMAL(10, 5),
  take_profit       DECIMAL(10, 5),
  
  -- Contexto
  quality           VARCHAR(5),
  confidence        INT,
  risk_reward       DECIMAL(5, 2),
  
  -- Timing
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  metadata          JSONB,
  
  -- Índices
  INDEX idx_signal_id ON master_events(signal_id),
  INDEX idx_status ON master_events(status),
  INDEX idx_created_at ON master_events(created_at)
);

/**
 * Tabla: module_state_history
 * Registra cada cambio de estado de cada módulo
 */
CREATE TABLE IF NOT EXISTS module_state_history (
  id                SERIAL PRIMARY KEY,
  event_id          VARCHAR(50) NOT NULL REFERENCES master_events(event_id),
  module_name       VARCHAR(50) NOT NULL,
  state             VARCHAR(20) NOT NULL,
  progress          INT DEFAULT 0,      -- 0-100 (real progress, not decorative)
  
  -- Timing
  received_at       TIMESTAMP,
  started_at        TIMESTAMP,
  completed_at      TIMESTAMP,
  recorded_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Details
  step              VARCHAR(100),
  error_message     TEXT,
  steps_completed   INT DEFAULT 0,
  total_steps       INT DEFAULT 5,
  
  -- Metadata
  metadata          JSONB,
  
  -- Índices y constraints
  UNIQUE(event_id, module_name, recorded_at),
  INDEX idx_event_id ON module_state_history(event_id),
  INDEX idx_module ON module_state_history(module_name),
  INDEX idx_state ON module_state_history(state)
);

/**
 * Tabla: event_executions
 * Registra ejecuciones en MT5 para cada evento
 */
CREATE TABLE IF NOT EXISTS event_executions (
  id                SERIAL PRIMARY KEY,
  event_id          VARCHAR(50) NOT NULL UNIQUE REFERENCES master_events(event_id),
  execution_status  VARCHAR(20) NOT NULL,  -- EXECUTED, REJECTED, FAILED, EXPIRED
  ticket            INT,                    -- Ticket del broker demo
  entry_price       DECIMAL(10, 5),
  executed_at       TIMESTAMP,
  metadata          JSONB,
  
  recorded_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_event_id ON event_executions(event_id),
  INDEX idx_ticket ON event_executions(ticket)
);

/**
 * Tabla: trade_closures
 * Registra cierre de operaciones (TP/SL/Manual)
 */
CREATE TABLE IF NOT EXISTS trade_closures (
  id                SERIAL PRIMARY KEY,
  event_id          VARCHAR(50) NOT NULL REFERENCES master_events(event_id),
  close_type        VARCHAR(20) NOT NULL,  -- TAKE_PROFIT, STOP_LOSS, MANUAL, PARTIAL
  close_price       DECIMAL(10, 5),
  pips              DECIMAL(6, 2),
  profit_loss       DECIMAL(10, 2),
  closed_at         TIMESTAMP,
  
  recorded_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_event_id ON trade_closures(event_id),
  INDEX idx_close_type ON trade_closures(close_type)
);

/**
 * Tabla: event_timeline
 * Timeline completo de cada evento (para auditoría y debugging)
 */
CREATE TABLE IF NOT EXISTS event_timeline (
  id                SERIAL PRIMARY KEY,
  event_id          VARCHAR(50) NOT NULL REFERENCES master_events(event_id),
  timestamp         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action            VARCHAR(50) NOT NULL,
  actor             VARCHAR(50),          -- Quién ejecutó la acción
  details           JSONB,
  
  INDEX idx_event_id ON event_timeline(event_id),
  INDEX idx_timestamp ON event_timeline(timestamp)
);

/**
 * Tabla: module_registry
 * Registro de módulos disponibles y su configuración
 */
CREATE TABLE IF NOT EXISTS module_registry (
  module_id         SERIAL PRIMARY KEY,
  module_name       VARCHAR(50) UNIQUE NOT NULL,
  module_type       VARCHAR(30),         -- INTERNAL, EXTERNAL, BOT, etc
  enabled           BOOLEAN DEFAULT true,
  endpoint          VARCHAR(200),        -- URL del servicio
  timeout_ms        INT DEFAULT 5000,
  retry_count       INT DEFAULT 3,
  status            VARCHAR(20),         -- ONLINE, OFFLINE, DEGRADED
  last_health_check TIMESTAMP,
  
  metadata          JSONB,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INSERTS INICIALES ====================

INSERT INTO module_registry (module_name, module_type, enabled, timeout_ms, retry_count) VALUES
  ('ALERTS', 'INTERNAL', true, 5000, 3),
  ('BOT', 'INTERNAL', true, 10000, 3),
  ('MANAGEMENT', 'INTERNAL', true, 5000, 3),
  ('FUNDING', 'INTERNAL', true, 5000, 3),
  ('RESULTS', 'INTERNAL', true, 5000, 3),
  ('NOTIFICATIONS', 'INTERNAL', true, 5000, 3),
  ('AUDIT', 'INTERNAL', true, 5000, 3),
  ('ADMIN', 'INTERNAL', true, 5000, 3)
ON CONFLICT DO NOTHING;

-- ==================== VIEWS ====================

/**
 * Vista: event_summary
 * Resumen de cada evento con estado agregado de módulos
 */
CREATE OR REPLACE VIEW event_summary AS
SELECT
  me.event_id,
  me.signal_id,
  me.symbol,
  me.direction,
  me.quality,
  me.confidence,
  me.status,
  me.created_at,
  me.updated_at,
  (
    SELECT COUNT(*) FROM module_state_history msh
    WHERE msh.event_id = me.event_id AND msh.state = 'COMPLETED'
  ) as modules_completed,
  (
    SELECT COUNT(*) FROM module_state_history msh
    WHERE msh.event_id = me.event_id AND msh.state = 'FAILED'
  ) as modules_failed,
  (
    SELECT AVG(progress) FROM (
      SELECT DISTINCT ON (module_name) progress
      FROM module_state_history
      WHERE event_id = me.event_id
      ORDER BY module_name, recorded_at DESC
    ) as latest_progress
  ) as overall_progress,
  CASE 
    WHEN me.status = 'CLOSED' THEN 'COMPLETED'
    WHEN me.status = 'EXECUTED' THEN 'IN_PROGRESS'
    WHEN me.status = 'DISTRIBUTED' THEN 'PROCESSING'
    ELSE me.status
  END as cycle_status
FROM master_events me;

/**
 * Vista: module_current_state
 * Estado actual (más reciente) de cada módulo por evento
 */
CREATE OR REPLACE VIEW module_current_state AS
SELECT DISTINCT ON (event_id, module_name)
  event_id,
  module_name,
  state,
  progress,
  recorded_at,
  step,
  error_message,
  steps_completed,
  total_steps
FROM module_state_history
ORDER BY event_id, module_name, recorded_at DESC;

-- ==================== FUNCIONES ====================

/**
 * Función: get_event_timeline
 * Obtiene la línea de tiempo completa de un evento
 */
CREATE OR REPLACE FUNCTION get_event_timeline(p_event_id VARCHAR)
RETURNS TABLE(
  timestamp TIMESTAMP,
  action VARCHAR,
  module_name VARCHAR,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.timestamp,
    et.action,
    NULL::VARCHAR as module_name,
    et.details::TEXT
  FROM event_timeline et
  WHERE et.event_id = p_event_id
  
  UNION ALL
  
  SELECT
    msh.recorded_at,
    'MODULE_' || msh.state,
    msh.module_name,
    'Progress: ' || msh.progress || '% - ' || COALESCE(msh.step, '')
  FROM module_state_history msh
  WHERE msh.event_id = p_event_id
  
  ORDER BY timestamp ASC;
END;
$$ LANGUAGE plpgsql;

/**
 * Función: check_duplicate_event
 * Verifica si un event_id ya existe (previene duplicados)
 */
CREATE OR REPLACE FUNCTION check_duplicate_event(p_event_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM master_events WHERE event_id = p_event_id);
END;
$$ LANGUAGE plpgsql;

-- ==================== ÍNDICES ADICIONALES ====================

CREATE INDEX IF NOT EXISTS idx_master_events_symbol_direction ON master_events(symbol, direction);
CREATE INDEX IF NOT EXISTS idx_master_events_quality_confidence ON master_events(quality, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_module_state_module_state ON module_state_history(module_name, state);
CREATE INDEX IF NOT EXISTS idx_module_state_progress ON module_state_history(progress DESC);

-- ==================== COMENTARIOS ====================

COMMENT ON TABLE master_events IS 'Eventos maestros del ciclo E2E - uno por señal del Trading Engine';
COMMENT ON TABLE module_state_history IS 'Histórico de cambios de estado de cada módulo - permite auditoría completa';
COMMENT ON TABLE event_executions IS 'Registros de ejecución en MT5 - tickets, precios, status';
COMMENT ON TABLE trade_closures IS 'Registros de cierre de operaciones - TP/SL/Manual';
COMMENT ON COLUMN master_events.event_id IS 'ID único global - EVT-YYYYMMDD-NNNNN';
COMMENT ON COLUMN master_events.status IS 'CREATED → DISTRIBUTED → EXECUTED → CLOSED';
COMMENT ON COLUMN module_state_history.progress IS 'Progreso real 0-100, no decorativo';
COMMENT ON COLUMN module_state_history.state IS 'RECEIVED → VALIDATING → ACCEPTED → PROCESSING → COMPLETED/FAILED';

