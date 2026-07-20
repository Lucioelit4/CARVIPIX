const { Pool } = require('pg');
const DATABASE_URL = 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';
const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
  try {
    const tables = ['event_executions', 'master_events'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\n${table}:`);
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
