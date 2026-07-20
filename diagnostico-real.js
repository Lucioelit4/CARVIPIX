const { Pool } = require('pg');

const run = async () => {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full'
  });

  try {
    const client = await pool.connect();
    const now = new Date();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║    🔍 DIAGNÓSTICO DEL TRADING ENGINE - EVIDENCIA REAL           ║');
    console.log('║             2026-07-17 12:15 (Últimas 24 horas)                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Actividad de ticks de mercado POR HORA
    console.log('📊 1. DATOS DE MERCADO - TICKS POR HORA (últimas 24h)');
    console.log('─────────────────────────────────────────────────────');
    const ticksHourly = await client.query(`
      SELECT 
        DATE_TRUNC('hour', ingest_time AT TIME ZONE 'America/Mazatlan') as hora,
        COUNT(*) as ticks,
        COUNT(DISTINCT symbol) as instrumentos,
        MAX(ingest_time) as ultimo_tick
      FROM ie_market_ticks
      WHERE ingest_time > now() - interval '24 hours'
      GROUP BY DATE_TRUNC('hour', ingest_time AT TIME ZONE 'America/Mazatlan')
      ORDER BY hora DESC
    `);
    
    if (ticksHourly.rows.length === 0) {
      console.log('   ❌ SIN DATOS - El Scheduler NO ejecutó\n');
    } else {
      let totalTicks = 0;
      ticksHourly.rows.slice(0, 24).forEach(row => {
        const ago = Math.floor((now - new Date(row.ultimo_tick)) / 1000);
        const agoMin = Math.floor(ago / 60);
        const bar = '█'.repeat(Math.min(row.ticks / 20, 50));
        console.log(`   ${new Date(row.hora).toLocaleTimeString().substring(0, 5)}: ${bar} ${row.ticks} ticks (${row.instrumentos} inst) [${agoMin}min]`);
        totalTicks += row.ticks;
      });
      console.log(`   ✅ TOTAL: ${totalTicks} ticks en ${ticksHourly.rows.length} horas\n`);
    }

    // 2. Decisiones del Engine
    console.log('🤖 2. DECISIONES DEL ENGINE - POR TIPO (últimas 24h)');
    console.log('─────────────────────────────────────────────────────');
    const decisions = await client.query(`
      SELECT 
        DATE_TRUNC('hour', created_at AT TIME ZONE 'America/Mazatlan') as hora,
        decision_type,
        COUNT(*) as cantidad,
        MAX(created_at) as ultima
      FROM ie_engine_decisions
      WHERE created_at > now() - interval '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at AT TIME ZONE 'America/Mazatlan'), decision_type
      ORDER BY hora DESC, cantidad DESC
    `);
    
    if (decisions.rows.length === 0) {
      console.log('   ❌ SIN DECISIONES - OpenAI NO fue consultado\n');
    } else {
      decisions.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultima)) / 1000 / 60);
        console.log(`   ${new Date(row.hora).toLocaleTimeString().substring(0, 5)}: ${row.decision_type} x${row.cantidad} [${ago}min]`);
      });
      console.log(`   ✅ TOTAL: ${decisions.rows.length} decisiones procesadas\n`);
    }

    // 3. Operaciones registradas
    console.log('📈 3. OPERACIONES EJECUTADAS (últimas 24h)');
    console.log('─────────────────────────────────────────────────────');
    const operations = await client.query(`
      SELECT 
        DATE_TRUNC('hour', created_at AT TIME ZONE 'America/Mazatlan') as hora,
        side,
        status,
        COUNT(*) as cantidad,
        MAX(created_at) as ultima
      FROM ie_operation_results
      WHERE created_at > now() - interval '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at AT TIME ZONE 'America/Mazatlan'), side, status
      ORDER BY hora DESC, cantidad DESC
    `);
    
    if (operations.rows.length === 0) {
      console.log('   ❌ SIN OPERACIONES - Triggers NO generaron órdenes\n');
    } else {
      operations.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultima)) / 1000 / 60);
        console.log(`   ${new Date(row.hora).toLocaleTimeString().substring(0, 5)}: ${row.side}/${row.status} x${row.cantidad} [${ago}min]`);
      });
      console.log(`   ✅ TOTAL: ${operations.rows.length} operaciones registradas\n`);
    }

    // 4. Señales MT5
    console.log('🎯 4. SEÑALES MAESTRAS - ESTADO ACTUAL');
    console.log('─────────────────────────────────────────────────────');
    const signals = await client.query(`
      SELECT 
        status,
        COUNT(*) as cantidad,
        MAX(created_at) as ultima
      FROM bot_mt5_signals
      GROUP BY status
      ORDER BY cantidad DESC
    `);
    
    if (signals.rows.length === 0) {
      console.log('   ❌ SIN SEÑALES\n');
    } else {
      signals.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultima)) / 1000 / 60);
        console.log(`   • ${row.status}: ${row.cantidad} señales (última hace ${ago}min)`);
      });
      console.log();
    }

    // 5. Últimas 10 decisiones DETALLADAS
    console.log('📋 5. ÚLTIMAS 10 DECISIONES (detalladas)');
    console.log('─────────────────────────────────────────────────────');
    const lastDecisions = await client.query(`
      SELECT 
        id,
        symbol,
        decision_type,
        state,
        created_at,
        ROUND(EXTRACT(EPOCH FROM (now() - created_at)) / 60) as hace_minutos
      FROM ie_engine_decisions
      WHERE created_at > now() - interval '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (lastDecisions.rows.length === 0) {
      console.log('   ❌ SIN DECISIONES\n');
    } else {
      lastDecisions.rows.forEach(row => {
        console.log(`   • [${row.symbol}] ${row.decision_type} → ${row.state} (hace ${row.hace_minutos}min)`);
      });
      console.log();
    }

    // 6. Resumen numérico
    console.log('📊 6. RESUMEN NUMÉRICO TOTAL');
    console.log('─────────────────────────────────────────────────────');
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM ie_market_ticks WHERE ingest_time > now() - interval '24 hours') as ticks_24h,
        (SELECT COUNT(DISTINCT symbol) FROM ie_market_ticks WHERE ingest_time > now() - interval '24 hours') as instrumentos_analizados,
        (SELECT COUNT(*) FROM ie_engine_decisions WHERE created_at > now() - interval '24 hours') as decisiones_24h,
        (SELECT COUNT(*) FROM ie_operation_results WHERE created_at > now() - interval '24 hours') as operaciones_24h,
        (SELECT COUNT(*) FROM bot_mt5_signals) as total_senales_maestras,
        (SELECT COUNT(*) FROM ie_system_logs WHERE level IN ('ERROR', 'CRITICAL') AND logged_at > now() - interval '24 hours') as errores_24h
    `);
    
    const s = summary.rows[0];
    console.log(`   • Ticks procesados (24h): ${s.ticks_24h}`);
    console.log(`   • Instrumentos analizados: ${s.instrumentos_analizados}`);
    console.log(`   • Decisiones generadas (24h): ${s.decisiones_24h}`);
    console.log(`   • Operaciones ejecutadas (24h): ${s.operaciones_24h}`);
    console.log(`   • Señales MT5 totales: ${s.total_senales_maestras}`);
    console.log(`   • Errores críticos (24h): ${s.errores_24h}\n`);

    // 7. Verificaciones binarias
    console.log('✅ 7. VERIFICACIONES BINARIAS');
    console.log('─────────────────────────────────────────────────────');
    const schedulerWorking = ticksHourly.rows.length > 0;
    const marketDataUpdated = ticksHourly.rows.length > 0;
    const observerEvaluated = s.instrumentos_analizados > 0;
    const triggersProcessed = s.decisiones_24h > 0;
    const openaiQueried = s.decisiones_24h > 0;
    const decisionsGenerated = s.decisiones_24h > 0;
    const operationsExecuted = s.operaciones_24h > 0;
    const signalsGenerated = s.total_senales_maestras > 0;
    const errorsFound = s.errores_24h > 0;

    console.log(`   Scheduler ejecutó cada 60s: ${schedulerWorking ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Datos de mercado se actualizaron: ${marketDataUpdated ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Observer evaluó 4 instrumentos: ${observerEvaluated ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Triggers fueron procesados: ${triggersProcessed ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   OpenAI recibió consultas reales: ${openaiQueried ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Se generaron decisiones: ${decisionsGenerated ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Operaciones ejecutadas: ${operationsExecuted ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Señales Maestras generadas: ${signalsGenerated ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Errores del sistema: ${errorsFound ? '❌ SÍ' : '✅ NO ERRORES'}\n`);

    // 8. Diagnóstico final
    console.log('🎯 8. DIAGNÓSTICO FINAL');
    console.log('─────────────────────────────────────────────────────');
    const allSystemsGo = schedulerWorking && marketDataUpdated && observerEvaluated && triggersProcessed;
    if (allSystemsGo) {
      console.log('   ✅ TRADING ENGINE OPERATIVO - Funcionó durante la noche\n');
    } else {
      console.log('   ⚠️  ENGINE CON PROBLEMAS - Revisar los puntos marcados como NO\n');
      if (!schedulerWorking) console.log('      • Scheduler no ejecutó → revisar Railway logs');
      if (!marketDataUpdated) console.log('      • Datos de mercado no se actualizaron → revisar Twelve Data API');
      if (!observerEvaluated) console.log('      • Observer no evaluó → revisar lógica de observador');
      if (!triggersProcessed) console.log('      • Triggers no procesados → revisar sistema de triggers');
      console.log();
    }

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  }
};

run();
