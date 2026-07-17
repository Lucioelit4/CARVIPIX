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
    // Look for FOUNDER-009 or FOUNDER-010 purchase
    console.log('🔍 BUSCANDO COMPRA FOUNDER-009 O FOUNDER-010...\n');
    
    // Check beta_code_uses
    const codeUses = await pool.query(`
      SELECT code, user_id, user_email, checkout_id, used_at
      FROM beta_code_uses
      WHERE code IN ('FOUNDER-009', 'FOUNDER-010')
      ORDER BY used_at DESC
    `);
    
    if (codeUses.rows.length > 0) {
      console.log('✅ Código consumido:');
      const use = codeUses.rows[0];
      console.log(`   Código: ${use.code}`);
      console.log(`   Order ID: ${use.checkout_id}`);
      console.log(`   User ID: ${use.user_id}`);
      console.log(`   Email: ${use.user_email}`);
      console.log(`   Usado: ${new Date(use.used_at).toLocaleString()}`);
      console.log('');
      
      const orderId = use.checkout_id;
      const userId = use.user_id;
      
      // Check orden
      const order = await pool.query(`
        SELECT * FROM orders WHERE id = $1
      `, [orderId]);
      
      if (order.rows.length > 0) {
        console.log('✅ PRUEBA 1 - ORDEN CREADA');
        const o = order.rows[0];
        console.log(`   ID: ${o.id}`);
        console.log(`   Usuario: ${o.user_id}`);
        console.log(`   Total: ${o.total} ${o.currency}`);
        console.log(`   Status: ${o.status}`);
        console.log('');
      } else {
        console.log('❌ ORDEN NO ENCONTRADA');
      }
      
      // Check license
      const license = await pool.query(`
        SELECT * FROM bot_licenses WHERE user_id = $1
        ORDER BY purchase_date DESC LIMIT 1
      `, [userId]);
      
      if (license.rows.length > 0) {
        console.log('✅ PRUEBA 3 - LICENCIA CREADA');
        const lic = license.rows[0];
        console.log(`   License Key: ${lic.license_key}`);
        console.log(`   Usuario: ${lic.user_id}`);
        console.log(`   Activa: ${lic.active}`);
        console.log(`   Vence: ${new Date(lic.expiry_date).toLocaleString()}`);
      } else {
        console.log('❌ LICENCIA NO ENCONTRADA');
      }
    } else {
      console.log('❌ Código no fue consumido');
    }
    
  } finally {
    await pool.end();
  }
})();
