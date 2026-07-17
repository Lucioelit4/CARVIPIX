const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

Object.assign(process.env, envVars);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('aws.neon.tech') ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const schema = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'payments' ORDER BY ordinal_position
    `);
    console.log('payments table columns:');
    schema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
  } finally {
    await pool.end();
  }
})();
