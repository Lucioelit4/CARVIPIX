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
    const orderId = 'BETA-FOUNDER-007-1784247340016';
    
    console.log('🔍 VALIDANDO COMPRA CON FOUNDER-007\n');
    
    // Check orders table
    const orders = await pool.query(`
      SELECT id, user_id, product_id, quantity, total, currency, status, payment_id, fecha_creacion
      FROM orders WHERE id = $1
    `, [orderId]);
    
    console.log('📋 PRUEBA 1 - Orden creada:');
    if (orders.rows.length > 0) {
      const order = orders.rows[0];
      console.log('  ✅ ORDEN ENCONTRADA');
      console.log(`     ID: ${order.id}`);
      console.log(`     User ID: ${order.user_id}`);
      console.log(`     Producto: ${order.product_id}`);
      console.log(`     Cantidad: ${order.quantity}`);
      console.log(`     Total: ${order.total} ${order.currency}`);
      console.log(`     Status: ${order.status}`);
      console.log(`     Fecha: ${new Date(order.fecha_creacion).toLocaleString()}`);
    } else {
      console.log('  ❌ ORDEN NO ENCONTRADA EN BD');
    }
    console.log('');
    
    // Check for order ID in beta_code_uses
    const codeUses = await pool.query(`
      SELECT id, code, user_id, user_email, checkout_id, used_at
      FROM beta_code_uses WHERE checkout_id = $1
    `, [orderId]);
    
    console.log('📋 Beta code uses:');
    if (codeUses.rows.length > 0) {
      const use = codeUses.rows[0];
      console.log('  ✅ USO REGISTRADO');
      console.log(`     Código: ${use.code}`);
      console.log(`     Email: ${use.user_email}`);
      console.log(`     Timestamp: ${new Date(use.used_at).toLocaleString()}`);
    } else {
      console.log('  ℹ️ No se encontró registro en beta_code_uses');
    }
    console.log('');
    
    // Check payments table
    const payments = await pool.query(`
      SELECT id, user_id, amount, currency, status, method, metadata, fecha
      FROM payments WHERE id IN (
        SELECT payment_id FROM orders WHERE id = $1
      )
    `, [orderId]);
    
    console.log('📋 PRUEBA 2 - Pago registrado:');
    if (payments.rows.length > 0) {
      const payment = payments.rows[0];
      console.log('  ✅ PAGO ENCONTRADO');
      console.log(`     ID: ${payment.id}`);
      console.log(`     Monto: ${payment.amount} ${payment.currency}`);
      console.log(`     Status: ${payment.status}`);
      console.log(`     Método: ${payment.method}`);
      console.log(`     Fecha: ${new Date(payment.fecha).toLocaleString()}`);
    } else {
      console.log('  ℹ️ Buscando por metadata...');
      const paymentsByMeta = await pool.query(`
        SELECT id, user_id, amount, currency, status, method, metadata, fecha
        FROM payments WHERE metadata->>'order_id' = $1
      `, [orderId]);
      if (paymentsByMeta.rows.length > 0) {
        const payment = paymentsByMeta.rows[0];
        console.log('  ✅ PAGO ENCONTRADO (por metadata)');
        console.log(`     ID: ${payment.id}`);
        console.log(`     Monto: ${payment.amount} ${payment.currency}`);
        console.log(`     Status: ${payment.status}`);
        console.log(`     Método: ${payment.method}`);
      } else {
        console.log('  ❌ PAGO NO ENCONTRADO');
      }
    }
    console.log('');
    
    // Get user ID from order
    if (orders.rows.length > 0) {
      const userId = orders.rows[0].user_id;
      
      // Check licenses
      const licenses = await pool.query(`
        SELECT id, license_id, user_id, status, expires_at, activated_at, subscription_tier
        FROM bot_mt5_licenses WHERE user_id = $1
        ORDER BY activated_at DESC LIMIT 1
      `, [userId]);
      
      console.log('📋 PRUEBA 3 - Licencia creada:');
      if (licenses.rows.length > 0) {
        const license = licenses.rows[0];
        console.log('  ✅ LICENCIA ENCONTRADA');
        console.log(`     ID: ${license.license_id}`);
        console.log(`     User ID: ${license.user_id}`);
        console.log(`     Status: ${license.status}`);
        console.log(`     Tier: ${license.subscription_tier}`);
        console.log(`     Expires: ${new Date(license.expires_at).toLocaleString()}`);
        console.log(`     Activated: ${new Date(license.activated_at).toLocaleString()}`);
      } else {
        console.log('  ❌ LICENCIA NO ENCONTRADA');
      }
      console.log('');
      
      // Check membership
      const membership = await pool.query(`
        SELECT user_id, plan, estado, fecha_inicio, fecha_fin, origen, codigo_beta
        FROM memberships WHERE user_id = $1
      `, [userId]);
      
      console.log('📋 Membresía FOUNDERS_BETA:');
      if (membership.rows.length > 0) {
        const mem = membership.rows[0];
        console.log('  ✅ MEMBRESÍA ENCONTRADA');
        console.log(`     Plan: ${mem.plan}`);
        console.log(`     Estado: ${mem.estado}`);
        console.log(`     Origen: ${mem.origen}`);
        console.log(`     Código usado: ${mem.codigo_beta}`);
        console.log(`     Vence: ${new Date(mem.fecha_fin).toLocaleString()}`);
      } else {
        console.log('  ❌ MEMBRESÍA NO ENCONTRADA');
      }
    }
    
  } finally {
    await pool.end();
  }
})();
