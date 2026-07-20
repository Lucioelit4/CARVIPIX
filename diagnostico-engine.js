#!/usr/bin/env node

const { Client } = require('pg');

const diagnostico = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Neon PostgreSQL\n');

    // 1. Última actividad de market_data
    console.log('=== 1. DATOS DE MERCADO ===');
    const marketData = await client.query(`
      SELECT symbol, updated_at, price, volume 
      FROM market_data 
      ORDER BY updated_at DESC 
      LIMIT 10
    `);
    console.log(`Registros encontrados: ${marketData.rows.length}`);
    marketData.rows.forEach(r => {
      const ago = Math.floor((Date.now() - new Date(r.updated_at).getTime()) / 1000);
      console.log(`  • ${r.symbol}: $${r.price} (hace ${ago}s)`);
    });

    // 2. Ciclos del Observer
    console.log('\n=== 2. CICLOS DEL OBSERVER ===');
    const observer = await client.query(`
      SELECT created_at, instruments_evaluated, triggers_found
      FROM observer_cycles
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`Ciclos registrados: ${observer.rows.length}`);
    observer.rows.forEach(r => {
      const ago = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 1000);
      console.log(`  • ${new Date(r.created_at).toLocaleTimeString()}: ${r.instruments_evaluated} instrumentos, ${r.triggers_found} triggers (hace ${ago}s)`);
    });

    // 3. Triggers evaluados
    console.log('\n=== 3. TRIGGERS EVALUADOS ===');
    const triggers = await client.query(`
      SELECT symbol, trigger_type, created_at, status
      FROM triggers
      ORDER BY created_at DESC
      LIMIT 15
    `);
    console.log(`Triggers totales: ${triggers.rows.length}`);
    triggers.rows.slice(0, 10).forEach(t => {
      const ago = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 1000);
      console.log(`  • ${t.symbol} [${t.trigger_type}] → ${t.status} (hace ${ago}s)`);
    });

    // 4. Expedientes creados
    console.log('\n=== 4. EXPEDIENTES (DOSSIERS) ===');
    const dossiers = await client.query(`
      SELECT id, symbol, decision, created_at, status
      FROM dossiers
      ORDER BY created_at DESC
      LIMIT 15
    `);
    console.log(`Expedientes totales: ${dossiers.rows.length}`);
    dossiers.rows.slice(0, 10).forEach(d => {
      const ago = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 1000);
      console.log(`  • ${d.symbol}: ${d.decision || 'SIN DECISIÓN'} (${d.status}) hace ${ago}s`);
    });

    // 5. Decisiones de OpenAI
    console.log('\n=== 5. DECISIONES DE OPENAI ===');
    const decisions = await client.query(`
      SELECT symbol, decision_type, created_at, tokens_used
      FROM openai_decisions
      ORDER BY created_at DESC
      LIMIT 15
    `);
    console.log(`Decisiones totales: ${decisions.rows.length}`);
    decisions.rows.slice(0, 10).forEach(d => {
      const ago = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 1000);
      console.log(`  • ${d.symbol}: ${d.decision_type} (${d.tokens_used} tokens) hace ${ago}s`);
    });

    // 6. Señales maestras generadas
    console.log('\n=== 6. SEÑALES MAESTRAS ===');
    const signals = await client.query(`
      SELECT id, symbol, decision, status, created_at
      FROM signals
      ORDER BY created_at DESC
      LIMIT 15
    `);
    console.log(`Señales totales: ${signals.rows.length}`);
    signals.rows.slice(0, 10).forEach(s => {
      const ago = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 1000);
      console.log(`  • [${s.id}] ${s.symbol}: ${s.decision} (${s.status}) hace ${ago}s`);
    });

    // 7. Paper Trading
    console.log('\n=== 7. PAPER TRADING ===');
    const paper = await client.query(`
      SELECT signal_id, symbol, decision, status, entry_price, created_at
      FROM paper_trades
      ORDER BY created_at DESC
      LIMIT 15
    `);
    console.log(`Paper trades totales: ${paper.rows.length}`);
    paper.rows.slice(0, 10).forEach(p => {
      const ago = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 1000);
      console.log(`  • ${p.symbol} @ $${p.entry_price}: ${p.decision} (${p.status}) hace ${ago}s`);
    });

    // 8. Errores/Logs
    console.log('\n=== 8. EVENTOS/ERRORES ===');
    const events = await client.query(`
      SELECT level, message, created_at
      FROM event_log
      WHERE level IN ('ERROR', 'CRITICAL', 'WARN')
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`Eventos críticos: ${events.rows.length}`);
    events.rows.forEach(e => {
      const ago = Math.floor((Date.now() - new Date(e.created_at).getTime()) / 1000);
      console.log(`  • [${e.level}] ${e.message} (hace ${ago}s)`);
    });

    // 9. Resumen temporal
    console.log('\n=== 9. RESUMEN TEMPORAL ===');
    const summary = await client.query(`
      SELECT 
        EXTRACT(HOUR FROM now()) as current_hour,
        (SELECT COUNT(*) FROM observer_cycles WHERE created_at > now() - interval '1 hour') as cycles_last_hour,
        (SELECT COUNT(*) FROM triggers WHERE created_at > now() - interval '1 hour') as triggers_last_hour,
        (SELECT COUNT(*) FROM signals WHERE created_at > now() - interval '1 hour') as signals_last_hour,
        (SELECT COUNT(*) FROM market_data WHERE updated_at > now() - interval '5 minutes') as recent_market_data
    `);
    const s = summary.rows[0];
    console.log(`Hora actual: ${new Date().toLocaleString()}`);
    console.log(`  • Ciclos último 1 hora: ${s.cycles_last_hour}`);
    console.log(`  • Triggers último 1 hora: ${s.triggers_last_hour}`);
    console.log(`  • Señales último 1 hora: ${s.signals_last_hour}`);
    console.log(`  • Datos mercado últimos 5min: ${s.recent_market_data}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
};

diagnostico();
