const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

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
    const email = `finaltest-${ts}@carvipix.test`;
    const password = 'Test123456!';
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash, created_at)
       VALUES ($1, $2, 'Test', 'Final', 'customer', true, 'activo', $3, NOW())`,
      [userId, email, hashedPassword]
    );
    
    console.log('✅ Test user created with proper hash:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n📋 Test the full flow with this account.`);
    
  } finally {
    await pool.end();
  }
})();
