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
    // Check FOUNDER codes status
    const codes = await pool.query(`
      SELECT code, is_active, used_count, max_uses FROM beta_invitation_codes
      WHERE code ~ '^FOUNDER-'
      ORDER BY code
    `);
    
    console.log('📋 FOUNDER Codes Status:');
    codes.rows.forEach(row => {
      console.log(`  ${row.code}: ${row.used_count}/${row.max_uses} (${row.is_active ? 'ACTIVE' : 'INACTIVE'})`);
    });
    
  } finally {
    await pool.end();
  }
})();
