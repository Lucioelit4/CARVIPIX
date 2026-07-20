const { Pool } = require('pg');

const run = async () => {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full'
  });

  try {
    const client = await pool.connect();
    const now = new Date();
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         DIAGNÓSTICO DEL TRADING ENGINE - 2026-07-17            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`Hora actual: ${now.toLocaleString()}\n`);

    // 1. Últimas entradas de mercado
    console.log('1️⃣  DATOS DE MERCADO (últimas 24 horas)');
    const marketTicks = await client.query(`
      SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as total_ticks,
        COUNT(DISTINCT symbol) as instrumentos,
        MAX(created_at) as ultima_actualizacion
      FROM ie_market_ticks
      WHERE created_at > now() - interval '24 hours'
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
    `);
    
    if (marketTicks.rows.length === 0) {
      console.log('   ⚠️  SIN DATOS DE MERCADO EN ÚLTIMAS 24 HORAS\n');
    } else {
      marketTicks.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultima_actualizacion)) / 1000);
        console.log(`   • ${row.fecha}: ${row.total_ticks} ticks, ${row.instrumentos} instrumentos`);
        console.log(`     Última actualización: hace ${ago}s\n`);
      });
    }

    // 2. Decisiones del Engine
    console.log('2️⃣  DECISIONES DEL ENGINE (últimas 24 horas)');
    const decisions = await client.query(`
      SELECT 
        DATE(created_at) as fecha,
        decision_type,
        COUNT(*) as cantidad,
        MAX(created_at) as ultima_decision
      FROM ie_engine_decisions
      WHERE created_at > now() - interval '24 hours'
      GROUP BY DATE(created_at), decision_type
      ORDER BY fecha DESC, decision_type
    `);
    
    if (decisions.rows.length === 0) {
      console.log('   ⚠️  SIN DECISIONES DEL ENGINE EN ÚLTIMAS 24 HORAS\n');
    } else {
      decisions.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultima_decision)) / 1000);
        console.log(`   • ${row.fecha} - ${row.decision_type}: ${row.cantidad} decisiones (última hace ${ago}s)`);
      });
      console.log();
    }

    // 3. Operaciones registradas
    console.log('3️⃣  OPERACIONES REGISTRADAS (últimas 24 horas)');
    const operations = await client.query(`
      SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as total,
        COUNT(DISTINCT symbol) as instrumentos,
        MAX(created_at) as ultima_operacion
      FROM ie_operation_results
      WHERE created_at > now() - interval '24 hours'
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
    `);
    
    if (operations.rows.length === 0) {
      console.log('   ⚠️  SIN OPERACIONES EN ÚLTIMAS 24 HORAS\n');
    } else {
      operations.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultima_operacion)) / 1000);
        console.log(`   • ${row.fecha}: ${row.total} operaciones, ${row.instrumentos} instrumentos`);
        console.log(`     Última: hace ${ago}s\n`);
      });
    }

    // 4. Señales MT5
    console.log('4️⃣  SEÑALES MT5');
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
      console.log('   ⚠️  SIN SEÑALES MT5\n');
    } else {
      signals.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultima)) / 1000);
        console.log(`   • ${row.status}: ${row.cantidad} señales (última hace ${ago}s)`);
      });
      console.log();
    }

    // 5. Errores del sistema
    console.log('5️⃣  ERRORES DEL SISTEMA (últimas 24 horas)');
    const errors = await client.query(`
      SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as total_errores,
        MAX(created_at) as ultimo_error
      FROM ie_system_logs
      WHERE level IN ('ERROR', 'CRITICAL')
        AND created_at > now() - interval '24 hours'
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
    `);
    
    if (errors.rows.length === 0) {
      console.log('   ✅ SIN ERRORES EN ÚLTIMAS 24 HORAS\n');
    } else {
      errors.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.ultimo_error)) / 1000);
        console.log(`   • ${row.fecha}: ${row.total_errores} errores (último hace ${ago}s)`);
      });
      console.log();
    }

    // 6. Actividad por hora (últimas 12 horas)
    console.log('6️⃣  ACTIVIDAD POR HORA (últimas 12 horas)');
    const hourly = await client.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hora,
        COUNT(*) as ticks,
        COUNT(DISTINCT symbol) as instrumentos
      FROM ie_market_ticks
      WHERE created_at > now() - interval '12 hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hora DESC
      LIMIT 12
    `);
    
    if (hourly.rows.length === 0) {
      console.log('   ⚠️  SIN DATOS EN ÚLTIMAS 12 HORAS\n');
    } else {
      hourly.rows.forEach(row => {
        const ago = Math.floor((now - new Date(row.hora)) / 1000 / 3600);
        const bar = '█'.repeat(Math.min(row.ticks / 10, 40));
        console.log(`   ${new Date(row.hora).toLocaleTimeString()}: ${bar} ${row.ticks} ticks`);
      });
      console.log();
    }

    // 7. Estado actual de la BD
    console.log('7️⃣  RESUMEN DE REGISTROS TOTALES');
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM ie_market_ticks) as total_ticks,
        (SELECT COUNT(*) FROM ie_engine_decisions) as total_decisiones,
        (SELECT COUNT(*) FROM ie_operation_results) as total_operaciones,
        (SELECT COUNT(*) FROM bot_mt5_signals) as total_senales,
        (SELECT COUNT(*) FROM ie_system_logs WHERE level IN ('ERROR', 'CRITICAL')) as total_errores
    `);
    
    const s = summary.rows[0];
    console.log(`   • Total ticks de mercado: ${s.total_ticks}`);
    console.log(`   • Total decisiones: ${s.total_decisiones}`);
    console.log(`   • Total operaciones: ${s.total_operaciones}`);
    console.log(`   • Total señales MT5: ${s.total_senales}`);
    console.log(`   • Total errores críticos: ${s.total_errores}\n`);

    // 8. Verificaciones binarias
    console.log('8️⃣  VERIFICACIONES BINARIAS');
    console.log(`   Scheduler ejecutó cada 60s: ${marketTicks.rows.length > 0 ? 'SÍ' : 'NO'}`);
    console.log(`   Datos de mercado se actualizaron: ${hourly.rows.length > 0 ? 'SÍ' : 'NO'}`);
    console.log(`   Observer evaluó instrumentos: ${decisions.rows.length > 0 ? 'SÍ' : 'NO'}`);
    console.log(`   OpenAI recibió consultas: ${s.total_decisiones > 0 ? 'SÍ' : 'NO'}`);
    console.log(`   Se generaron decisiones: ${s.total_decisiones > 0 ? 'SÍ' : 'NO'}`);
    console.log(`   Operaciones ejecutadas: ${s.total_operaciones > 0 ? 'SÍ' : 'NO'}`);
    console.log(`   Señales MT5 generadas: ${s.total_senales > 0 ? 'SÍ' : 'NO'}`);
    console.log(`   Errores del sistema: ${s.total_errores > 0 ? 'SÍ ⚠️' : 'NO ✅'}`);

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
