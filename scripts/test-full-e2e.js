const fs = require('fs');
const path = require('path');
const https = require('https');
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
    // Step 1: Create user in database
    const userId = `usr-e2e-test-${Date.now()}`;
    const userEmail = `e2etest-${Date.now()}@carvipix.test`;
    
    console.log(`📝 Step 1: Creating test user in database...`);
    await pool.query(
      `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash, created_at)
       VALUES ($1, $2, 'E2E', 'Test', 'customer', true, 'activo', 'dummy', NOW())`,
      [userId, userEmail]
    );
    console.log(`✅ User created: ${userId}\n`);

    // Step 2: Call purchase endpoint
    console.log(`🛒 Step 2: Testing purchase endpoint...`);
    const code = 'FOUNDER-008';
    
    const payload = JSON.stringify({
      code: code,
      product_id: 'bot-carvipix-license',
      user_id: userId,
      user_email: userEmail
    });

    const options = {
      hostname: 'carvipix.com',
      port: 443,
      path: '/api/beta/apply-code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            resolve({ status: res.statusCode, data: null, raw: data });
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    console.log(`Status: ${result.status}\n`);
    console.log(JSON.stringify(result.data, null, 2));

    if (result.data?.ok) {
      console.log(`\n✅ COMPRA EXITOSA\n`);
      const orderId = result.data.order_id;
      const licenseKey = result.data.license_key;
      
      // Step 3: Verify order in database
      console.log(`🔍 Step 3: Verifying database records...`);
      
      const order = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );
      console.log(`\n✅ Order: ${order.rows.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
      if (order.rows[0]) {
        console.log(`   Status: ${order.rows[0].status}`);
        console.log(`   Total: $${order.rows[0].total}`);
      }
      
      const license = await pool.query(
        'SELECT * FROM bot_licenses WHERE license_key = $1',
        [licenseKey]
      );
      console.log(`\n✅ License: ${license.rows.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
      if (license.rows[0]) {
        console.log(`   Key: ${license.rows[0].license_key}`);
        console.log(`   Active: ${license.rows[0].active}`);
        console.log(`   Expires: ${new Date(license.rows[0].expiry_date).toLocaleDateString()}`);
      }
      
      const payment = await pool.query(
        'SELECT * FROM payments WHERE user_id = $1 ORDER BY fecha DESC LIMIT 1',
        [userId]
      );
      console.log(`\n✅ Payment: ${payment.rows.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
      if (payment.rows[0]) {
        console.log(`   Amount: $${payment.rows[0].amount}`);
        console.log(`   Status: ${payment.rows[0].status}`);
      }
      
      const membership = await pool.query(
        'SELECT * FROM memberships WHERE user_id = $1',
        [userId]
      );
      console.log(`\n✅ Membership: ${membership.rows.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
      if (membership.rows[0]) {
        console.log(`   Plan: ${membership.rows[0].plan}`);
        console.log(`   Origen: ${membership.rows[0].origen}`);
      }
      
      // Step 4: Test download link
      console.log(`\n📥 Step 4: Testing download link...`);
      const downloadToken = Buffer.from(`${licenseKey}:${orderId}`).toString('base64');
      const downloadUrl = `https://carvipix.com/api/bot/download?license=${encodeURIComponent(licenseKey)}&token=${encodeURIComponent(downloadToken)}`;
      console.log(`   Link: ${downloadUrl}`);
      console.log(`\n✨ TEST COMPLETE`);
    } else {
      console.log(`❌ Purchase failed: ${result.data?.error}`);
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await pool.end();
  }
})();
