const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full' });

pool.connect().then(async c => {
  const r = await c.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'ie_system_logs\' ORDER BY ordinal_position');
  console.log(r.rows.map(x => x.column_name));
  c.release();
  await pool.end();
}).catch(e => console.error(e.message));
