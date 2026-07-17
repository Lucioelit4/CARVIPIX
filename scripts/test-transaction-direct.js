const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

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
  let client;
  try {
    console.log('🔍 SIMULANDO TRANSACCIÓN DE COMPRA...\n');
    
    client = await pool.connect();
    await client.query('BEGIN');
    
    const code = 'FOUNDER-010';
    const user_id = `usr-debug-${Date.now()}`;
    const user_email = `debug-${Date.now()}@test.local`;
    const product_id = 'bot-carvipix-license';
    
    console.log(`Code: ${code}`);
    console.log(`User ID: ${user_id}`);
    console.log(`Email: ${user_email}`);
    console.log('');
    
    // Step 1: Check code
    console.log('Step 1: Checking code...');
    const codeCheck = await client.query(
      'SELECT * FROM beta_invitation_codes WHERE code = $1',
      [code]
    );
    console.log(`  Found: ${codeCheck.rows.length} rows`);
    if (codeCheck.rows[0]) {
      console.log(`  Status: active=${codeCheck.rows[0].is_active}, used=${codeCheck.rows[0].used_count}/${codeCheck.rows[0].max_uses}`);
    }
    console.log('');
    
    // Step 2: Create order
    console.log('Step 2: Creating order...');
    const orderId = `BETA-${code}-${Date.now()}`;
    try {
      const orderResult = await client.query(
        `INSERT INTO orders (id, user_id, product_id, quantity, total, currency, status, payment_id, fecha_creacion)
         VALUES ($1, $2, $3, 1, 0, 'USD', 'completed', $4, NOW())
         RETURNING id`,
        [orderId, user_id, product_id, code]
      );
      console.log(`  ✅ Order created: ${orderResult.rows[0].id}`);
    } catch (e) {
      console.log(`  ❌ Order failed: ${e.message}`);
      throw e;
    }
    console.log('');
    
    // Step 3: Create license
    console.log('Step 3: Creating license...');
    const licenseKey = `BOTKEY-${randomUUID().toString().split('-')[0].toUpperCase()}-${Date.now()}`;
    const licenseExpiry = new Date();
    licenseExpiry.setDate(licenseExpiry.getDate() + 90);
    
    try {
      const licenseResult = await client.query(
        `INSERT INTO bot_licenses (user_id, license_key, purchase_date, expiry_date, active, broker_connected)
         VALUES ($1, $2, NOW(), $3, true, 'pending')
         ON CONFLICT (user_id) DO UPDATE
           SET license_key = EXCLUDED.license_key, purchase_date = NOW(), expiry_date = EXCLUDED.expiry_date, active = true
         RETURNING license_key`,
        [user_id, licenseKey, licenseExpiry]
      );
      console.log(`  ✅ License created: ${licenseResult.rows[0].license_key}`);
    } catch (e) {
      console.log(`  ❌ License failed: ${e.message}`);
      throw e;
    }
    console.log('');
    
    console.log('✅ ALL STEPS PASSED');
    console.log('');
    console.log('Rolling back transaction...');
    await client.query('ROLLBACK');
    
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
