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
    // Create test user with timestamp
    const ts = Date.now();
    const userId = `usr-founder-fresh-${ts}`;
    const email = `founder-fresh-${ts}@test.local`;
    
    await pool.query(
      `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash, created_at)
       VALUES ($1, $2, 'Founder', 'Fresh', 'customer', true, 'activo', 'dummy', NOW())`,
      [userId, email]
    );
    
    console.log(`✅ User created: ${userId}`);
    console.log(`   Email: ${email}`);
    
  } finally {
    await pool.end();
  }
})();
