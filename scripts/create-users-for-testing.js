const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { randomBytes } = require('crypto');

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
    // Create test users for remaining FOUNDER codes
    const userId1 = `usr-founder-f010-${Date.now()}`;
    
    await pool.query(
      `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash, created_at)
       VALUES ($1, $2, 'Founder', 'Test 010', 'customer', true, 'activo', 'dummy', NOW())`,
      [userId1, 'founder-f010-' + Date.now() + '@test.local']
    );
    
    console.log('✅ Test user created:');
    console.log(`   User ID: ${userId1}`);
    console.log(`   Ready for FOUNDER-010`);
    console.log('');
    console.log('Use this user_id for testing apply-code endpoint');
    
  } finally {
    await pool.end();
  }
})();
