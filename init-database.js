#!/usr/bin/env node

/**
 * Script para inicializar BD con tablas necesarias para CARVIPIX Brain
 */

const { createClient } = require('@neon/serverless');
const fs = require('fs');

async function initializeDatabase() {
  console.log('🔧 Inicializando base de datos para CARVIPIX Brain...\n');

  const client = createClient({
    connectionString: process.env.DATABASE_URL || 'postgresql://...',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Crear tablas necesarias
    const tables = [
      // Master Events
      `
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
      )
      `,
      
      // Telegram Messages
      `
      CREATE TABLE IF NOT EXISTS telegram_messages (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) REFERENCES master_events(event_id),
        signal_id VARCHAR(50),
        channel_id VARCHAR(100),
        message_id BIGINT,
        stage VARCHAR(30),
        status VARCHAR(30),
        message_text TEXT,
        sent_at TIMESTAMP,
        updated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
      `,
      
      // Event Executions
      `
      CREATE TABLE IF NOT EXISTS event_executions (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) REFERENCES master_events(event_id),
        execution_id VARCHAR(50) UNIQUE,
        broker_ticket BIGINT,
        entry_price NUMERIC(18,5),
        status VARCHAR(30),
        executed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
      `,
      
      // Trade Closures
      `
      CREATE TABLE IF NOT EXISTS trade_closures (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) REFERENCES master_events(event_id),
        close_type VARCHAR(30),
        close_price NUMERIC(18,5),
        pips NUMERIC(10,2),
        profit_loss NUMERIC(15,2),
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
      `
    ];

    for (const sql of tables) {
      try {
        await client.query(sql);
        console.log('✅ Tabla creada/verificada');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('ℹ️  Tabla ya existe');
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Base de datos inicializada correctamente');
    console.log('\nTablas disponibles:');
    console.log('  - master_events');
    console.log('  - telegram_messages');
    console.log('  - event_executions');
    console.log('  - trade_closures');

  } catch (error) {
    console.error('❌ Error inicializando BD:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();
