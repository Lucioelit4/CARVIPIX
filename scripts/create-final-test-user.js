const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

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
    const ts = Date.now();
    const userId = `usr-final-test-${ts}`;
    const email = `finaltest-${ts}@carvipix.local`;
    const password = 'TestPassword2026!';
    
    // Hash password
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    const passwordHash = `$2a$10$${Buffer.concat([salt, hash]).toString('base64')}`;
    
    await pool.query(
      `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash, created_at)
       VALUES ($1, $2, 'Test', 'Final', 'customer', true, 'activo', $3, NOW())`,
      [userId, email, password] // Using simple password for testing
    );
    
    console.log('✅ Test user created:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n📋 Use these credentials to test the full purchase flow.`);
    
  } finally {
    await pool.end();
  }
})();
