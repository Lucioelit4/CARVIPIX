/**
 * Script para inicializar BD
 * Usa la conexión de backend existente
 */

const sql = `
CREATE TABLE IF NOT EXISTS master_events (
  event_id VARCHAR(50) PRIMARY KEY,
  signal_id VARCHAR(50) NOT NULL UNIQUE,
  analysis_id VARCHAR(50),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'CREATED',
  source VARCHAR(100),
  symbol VARCHAR(20),
  direction VARCHAR(10),
  entry_price NUMERIC(18,5),
  stop_loss NUMERIC(18,5),
  take_profit NUMERIC(18,5),
  risk_reward NUMERIC(10,2),
  quality VARCHAR(5),
  confidence NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_messages (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(50) REFERENCES master_events(event_id) ON DELETE CASCADE,
  signal_id VARCHAR(50),
  channel_id VARCHAR(100),
  message_id BIGINT,
  stage VARCHAR(30),
  status VARCHAR(30),
  message_text TEXT,
  sent_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_executions (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(50) REFERENCES master_events(event_id) ON DELETE CASCADE,
  execution_id VARCHAR(50) UNIQUE,
  broker_ticket BIGINT,
  entry_price NUMERIC(18,5),
  status VARCHAR(30),
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_closures (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(50) REFERENCES master_events(event_id) ON DELETE CASCADE,
  close_type VARCHAR(30),
  close_price NUMERIC(18,5),
  pips NUMERIC(10,2),
  profit_loss NUMERIC(15,2),
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

// Para ejecutar este SQL, copia y pega en Neon Console o ejecuta:
// npx neon sql < init-database.sql

console.log('📋 SQL para inicializar BD:\n');
console.log(sql);
console.log('\n✅ Ejecuta este SQL en tu consola de Neon:');
console.log('   https://console.neon.tech');
console.log('\nO guarda en archivo y ejecuta:');
console.log('   npx neon sql < init-database.sql');
