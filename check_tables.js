const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public' ORDER BY table_name
    `);
    const tables = result.rows.map(r => r.table_name);
    console.log('Tablas en BD:', tables.join(', '));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
