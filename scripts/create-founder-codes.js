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
    // Insert new FOUNDER codes
    const newCodes = ['FOUNDER-007', 'FOUNDER-008', 'FOUNDER-009', 'FOUNDER-010'];
    
    for (const code of newCodes) {
      await pool.query(
        `INSERT INTO beta_invitation_codes (code, created_by, max_uses, used_count, is_active, expires_at, created_at)
         VALUES ($1, 'admin', 1, 0, true, NOW() + INTERVAL '90 days', NOW())
         ON CONFLICT (code) DO NOTHING`,
        [code]
      );
    }
    
    console.log('✅ Created new FOUNDER codes:', newCodes.join(', '));
    
  } finally {
    await pool.end();
  }
})();
