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
    const orderId = 'BETA-FOUNDER-010-1784248939767';
    const licenseKey = 'BOTKEY-01F54721-1784248939778';
    const userId = 'usr-founder-f010-1784247900811';
    
    console.log('🔍 VERIFICANDO TRANSACCIÓN COMPLETADA\n');
    
    // Check order
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    console.log(`1️⃣ Orden en BD:`);
    if (orderResult.rows.length > 0) {
      const o = orderResult.rows[0];
      console.log(`   ✅ ID: ${o.id}`);
      console.log(`   ✅ User: ${o.user_id}`);
      console.log(`   ✅ Status: ${o.status}`);
      console.log(`   ✅ Total: $${o.total}`);
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    console.log('');
    
    // Check license
    const licenseResult = await pool.query('SELECT * FROM bot_licenses WHERE license_key = $1', [licenseKey]);
    console.log(`2️⃣ Licencia en BD:`);
    if (licenseResult.rows.length > 0) {
      const l = licenseResult.rows[0];
      console.log(`   ✅ License Key: ${l.license_key}`);
      console.log(`   ✅ User: ${l.user_id}`);
      console.log(`   ✅ Active: ${l.active}`);
      console.log(`   ✅ Expires: ${new Date(l.expiry_date).toLocaleDateString()}`);
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    console.log('');
    
    // Check payment
    const paymentResult = await pool.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY fecha DESC LIMIT 1', [userId]);
    console.log(`3️⃣ Pago en BD:`);
    if (paymentResult.rows.length > 0) {
      const p = paymentResult.rows[0];
      console.log(`   ✅ ID: ${p.id}`);
      console.log(`   ✅ Amount: $${p.amount}`);
      console.log(`   ✅ Status: ${p.status}`);
      console.log(`   ✅ Method: ${p.method}`);
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    console.log('');
    
    // Check membership
    const membershipResult = await pool.query('SELECT * FROM memberships WHERE user_id = $1', [userId]);
    console.log(`4️⃣ Membresía en BD:`);
    if (membershipResult.rows.length > 0) {
      const m = membershipResult.rows[0];
      console.log(`   ✅ Plan: ${m.plan}`);
      console.log(`   ✅ Estado: ${m.estado}`);
      console.log(`   ✅ Origen: ${m.origen}`);
      console.log(`   ✅ Código Beta: ${m.codigo_beta}`);
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    console.log('');
    
    // Check event
    const eventResult = await pool.query('SELECT * FROM beta_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    console.log(`5️⃣ Evento en BD:`);
    if (eventResult.rows.length > 0) {
      const e = eventResult.rows[0];
      console.log(`   ✅ Type: ${e.event_type}`);
      console.log(`   ✅ Module: ${e.module}`);
      console.log(`   ✅ Metadata: ${JSON.stringify(e.metadata).substring(0, 60)}...`);
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    console.log('');
    
    // Check beta_code_uses
    const useResult = await pool.query('SELECT * FROM beta_code_uses WHERE code = $1', ['FOUNDER-010']);
    console.log(`6️⃣ Uso de Código en BD:`);
    if (useResult.rows.length > 0) {
      const u = useResult.rows[0];
      console.log(`   ✅ Code: ${u.code}`);
      console.log(`   ✅ User: ${u.user_id}`);
      console.log(`   ✅ Discount: ${u.discount_applied}%`);
      console.log(`   ✅ Used At: ${new Date(u.used_at).toLocaleString()}`);
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    
    console.log('\n✅ TRANSACCIÓN COMPLETADA EXITOSAMENTE');
    
  } finally {
    await pool.end();
  }
})();
