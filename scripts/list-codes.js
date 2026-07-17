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
    const codes = await pool.query(
      `SELECT code, used_count, max_uses FROM beta_invitation_codes 
       WHERE code LIKE $1 ORDER BY code`,
      ['FOUNDER-%']
    );
    console.log('Available codes:');
    codes.rows.forEach(row => {
      const available = row.used_count < row.max_uses ? '✅ AVAILABLE' : '❌ USED';
      console.log(`  ${row.code}: ${available} (${row.used_count}/${row.max_uses})`);
    });
  } finally {
    await pool.end();
  }
})();
