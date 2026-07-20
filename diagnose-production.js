#!/usr/bin/env node

const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
  try {
    console.log('🔍 DIAGNÓSTICO DE PRODUCCIÓN - CARVIPIX\n');

    // 1. DATOS DE MERCADO (ie_market_ticks)
    console.log('=== 1. ÚLTIMOS DATOS DE MERCADO (ie_market_ticks) ===');
    const marketData = await pool.query(`
      SELECT symbol, bid, ask, tick_time 
      FROM ie_market_ticks 
      ORDER BY tick_time DESC 
      LIMIT 10
    `);
    console.log(`Registros: ${marketData.rows.length}`);
    if (marketData.rows.length > 0) {
      console.log(`Últimos datos recibidos:`);
      marketData.rows.slice(0, 3).forEach(row => {
        console.log(`  ${row.symbol}: Bid=${row.bid} Ask=${row.ask} (${row.tick_time})`);
      });
    } else {
      console.log('❌ NO HAY DATOS DE MERCADO');
    }

    // Check time difference
    if (marketData.rows.length > 0) {
      const timeDiffMarket = await pool.query(`
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(tick_time)))/3600 as hours_ago 
        FROM ie_market_ticks
      `);
      const hoursSinceMarketData = Math.round(timeDiffMarket.rows[0].hours_ago * 10) / 10;
      console.log(`Última actualización: hace ${hoursSinceMarketData} horas\n`);
    }

    // 2. DECISIONES DEL MOTOR (ie_engine_decisions)
    console.log('=== 2. ÚLTIMAS DECISIONES DEL MOTOR ===');
    const decisions = await pool.query(`
      SELECT id, symbol, decision_type, decided_at 
      FROM ie_engine_decisions 
      ORDER BY decided_at DESC 
      LIMIT 10
    `);
    console.log(`Decisiones: ${decisions.rows.length}`);
    if (decisions.rows.length > 0) {
      console.log(`Últimas decisiones:`);
      decisions.rows.slice(0, 3).forEach(row => {
        console.log(`  ${row.symbol}: ${row.decision_type} (${row.decided_at})`);
      });
    } else {
      console.log('❌ NO HAY DECISIONES REGISTRADAS');
    }

    if (decisions.rows.length > 0) {
      const timeDiffDecisions = await pool.query(`
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(decided_at)))/60 as minutes_ago 
        FROM ie_engine_decisions
      `);
      const minutesSinceDecisions = Math.round(timeDiffDecisions.rows[0].minutes_ago);
      console.log(`Última decisión: hace ${minutesSinceDecisions} minutos\n`);
    }

    // 3. RESULTADOS DE OPERACIONES (ie_operation_results)
    console.log('=== 3. ÚLTIMOS RESULTADOS DE OPERACIONES ===');
    const operations = await pool.query(`
      SELECT id, symbol, side, status, entry_price 
      FROM ie_operation_results 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.log(`Operaciones: ${operations.rows.length}`);
    if (operations.rows.length > 0) {
      console.log(`Últimas operaciones:`);
      operations.rows.slice(0, 3).forEach(row => {
        console.log(`  ${row.symbol}: ${row.side} @ ${row.entry_price} = ${row.status}`);
      });
    } else {
      console.log('❌ NO HAY RESULTADOS DE OPERACIONES');
    }

    // 4. EVENTOS DEL DISPATCHER (event_executions)
    console.log('\n=== 4. ÚLTIMOS EVENTOS DEL DISPATCHER ===');
    const dispatcher = await pool.query(`
      SELECT execution_id, event_id, execution_status, executed_at 
      FROM event_executions 
      ORDER BY executed_at DESC 
      LIMIT 10
    `);
    console.log(`Eventos: ${dispatcher.rows.length}`);
    if (dispatcher.rows.length > 0) {
      console.log(`Últimos eventos:`);
      dispatcher.rows.slice(0, 3).forEach(row => {
        console.log(`  ${row.execution_id}: ${row.execution_status} (${row.executed_at})`);
      });
    } else {
      console.log('❌ NO HAY EVENTOS DISPATCHER');
    }

    // 5. EVENTOS MAESTROS (master_events)
    console.log('\n=== 5. EVENTOS MAESTROS ===');
    const masterEvents = await pool.query(`
      SELECT event_id, type, status, symbol, created_at 
      FROM master_events 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(`Eventos maestros: ${masterEvents.rows.length}`);
    if (masterEvents.rows.length > 0) {
      console.log(`Últimos eventos:`);
      masterEvents.rows.slice(0, 3).forEach(row => {
        console.log(`  ${row.event_id}: ${row.type} / ${row.symbol} = ${row.status} (${row.created_at})`);
      });
    } else {
      console.log('❌ NO HAY EVENTOS MAESTROS');
    }

    // ANÁLISIS FINAL
    console.log('\n' + '='.repeat(60));
    console.log('ANÁLISIS DEL PUNTO DE RUPTURA');
    console.log('='.repeat(60));
    
    if (marketData.rows.length === 0) {
      console.log('❌ RUPTURA: DATOS DE MERCADO\n   NO se están recibiendo datos de Twelve Data API');
    } else if (decisions.rows.length === 0 && marketData.rows.length > 0) {
      console.log('❌ RUPTURA: MERCADO → DECISIONES\n   Los datos llegan pero el Motor no genera decisiones');
    } else if (dispatcher.rows.length === 0 && decisions.rows.length > 0) {
      console.log('❌ RUPTURA: DECISIONES → DISPATCHER\n   Las decisiones no se envían al Dispatcher');
    } else if (telegram.rows.length === 0 && dispatcher.rows.length > 0) {
      console.log('❌ RUPTURA: DISPATCHER → TELEGRAM\n   Los eventos no llegan a Telegram');
    } else if (telegram.rows.length > 0) {
      const lastStatus = telegram.rows[0].status;
      console.log(`✅ FLUJO COMPLETO (último Telegram: ${lastStatus})`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  }
})();
