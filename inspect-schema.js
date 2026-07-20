const { Pool } = require('pg');

const run = async () => {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full'
  });

  try {
    const client = await pool.connect();
    
    // Inspeccionar tabla ie_market_ticks
    console.log('📋 Estructura de ie_market_ticks:');
    const schema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ie_market_ticks' 
      ORDER BY ordinal_position
    `);
    schema.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
    console.log('\n📋 Estructura de ie_engine_decisions:');
    const schema2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ie_engine_decisions' 
      ORDER BY ordinal_position
    `);
    schema2.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    console.log('\n📋 Estructura de bot_mt5_signals:');
    const schema3 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bot_mt5_signals' 
      ORDER BY ordinal_position
    `);
    schema3.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    console.log('\n📋 Estructura de ie_operation_results:');
    const schema4 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ie_operation_results' 
      ORDER BY ordinal_position
    `);
    schema4.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
