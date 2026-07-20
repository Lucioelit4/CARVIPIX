const { Pool } = require('pg');

const run = async () => {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full'
  });

  try {
    console.log('🔌 Conectando a Neon...');
    const client = await pool.connect();
    console.log('✅ Conectado!\n');

    // Verificar tablas
    const tables = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('📊 TABLAS EN LA BD:');
    tables.rows.forEach(r => console.log(`  - ${r.tablename}`));

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  }
};

run();
