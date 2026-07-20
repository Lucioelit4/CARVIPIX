const { Pool } = require('pg');
const DATABASE_URL = 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';
const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
  try {
    console.log('🔍 INVESTIGACIÓN PROFUNDA: ¿POR QUÉ NO HAY DATOS?\n');

    // 1. Buscar cualquier referencia al proveedor de datos
    console.log('=== 1. BÚSQUEDA: Cualquier acceso a Twelve Data ===');
    const result1 = await pool.query(`SELECT * FROM ie_market_ticks LIMIT 5`);
    console.log(`ie_market_ticks: ${result1.rows.length} registros\n`);

    // 2. Ver el máximo number de registros históricos
    console.log('=== 2. ANÁLISIS: Eventos históricos por día ===');
    const result2 = await pool.query(`
      SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as eventos
      FROM master_events
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
    `);
    console.log('Eventos por día:');
    result2.rows.forEach(row => {
      console.log(`  ${row.fecha}: ${row.eventos} eventos`);
    });

    // 3. Revisar qué fue el último evento SIGNAL_CREATED
    console.log('\n=== 3. ÚLTIMA SEÑAL CREADA ===');
    const result3 = await pool.query(`
      SELECT event_id, symbol, created_at, type, status
      FROM master_events
      WHERE type = 'SIGNAL_CREATED'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    if (result3.rows.length > 0) {
      result3.rows.forEach(row => {
        console.log(`  ${row.event_id}: ${row.symbol} (${row.created_at})`);
      });
    } else {
      console.log('  ❌ NUNCA se creó una señal');
    }

    // 4. Revisar todas las tablas que contienen timestamps recientes
    console.log('\n=== 4. BÚSQUEDA: Actividad en últimas 24h ===');
    const result4 = await pool.query(`
      SELECT 
        'master_events' as tabla,
        COUNT(*) as registros,
        MAX(created_at) as ultimo_registro
      FROM master_events
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    console.log(`master_events (24h): ${result4.rows[0].registros} registros`);
    console.log(`  Último: ${result4.rows[0].ultimo_registro}\n`);

    // 5. Ver registros en otras tablas
    console.log('=== 5. SCAN: Otros registros recientes ===');
    const result5 = await pool.query(`
      SELECT 
        'telegram_messages' as tabla,
        COUNT(*) as registros
      FROM telegram_messages
      WHERE created_at > NOW() - INTERVAL '24 hours'
    UNION ALL
      SELECT
        'event_executions' as tabla,
        COUNT(*) as registros
      FROM event_executions
      WHERE executed_at > NOW() - INTERVAL '24 hours'
    `);
    result5.rows.forEach(row => {
      console.log(`${row.tabla}: ${row.registros}`);
    });

    console.log('\n=== CONCLUSIÓN ===');
    if (result2.rows.length === 0) {
      console.log('❌ RUPTURA TOTAL: El sistema no genera eventos desde hace días');
    } else {
      const lastActiveDate = result2.rows[0].fecha;
      const now = new Date();
      const then = new Date(lastActiveDate);
      const hoursSince = Math.round((now - then) / 3600000);
      console.log(`❌ ÚLTIMA ACTIVIDAD: ${lastActiveDate} (hace ${hoursSince} horas)`);
      console.log('   El scheduler se detuvo o los datos no llegan del proveedor');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  }
})();
