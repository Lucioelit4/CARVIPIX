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
    // Create test account for purchase flow validation
    const userId = `usr-${Date.now()}-${randomBytes(6).toString('hex')}`;
    const testEmail = `founder-test-${Date.now()}@test.local`;
    const testPassword = 'FounderTest2026!';
    const testName = 'Prueba Flujo';
    const testSurname = 'Compra Bot';

    // Insert user
    await pool.query(
      `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash, created_at)
       VALUES ($1, $2, $3, $4, 'customer', true, 'activo', 'dummy_hash', NOW())`,
      [userId, testEmail, testName, testSurname]
    );

    console.log('✅ Test account created:');
    console.log('   Email:', testEmail);
    console.log('   Password: FounderTest2026!');
    console.log('   User ID:', userId);
    console.log('');
    console.log('Ready to test FOUNDER-007 purchase flow');
    
  } finally {
    await pool.end();
  }
})();
