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
    // Check user
    const user = await pool.query(`
      SELECT id, email, nombre FROM users 
      WHERE email = 'carlos.prueba@testing.local'
    `);
    
    if (user.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const userId = user.rows[0].id;
    console.log('👤 Usuario:');
    console.log(`  ID: ${userId}`);
    console.log(`  Email: ${user.rows[0].email}`);
    console.log(`  Nombre: ${user.rows[0].nombre}`);
    console.log('');
    
    // Check for recent orders
    const orders = await pool.query(`
      SELECT * FROM orders 
      WHERE user_id = $1
      ORDER BY fecha_creacion DESC
      LIMIT 10
    `, [userId]);
    
    console.log('📋 Órdenes del usuario:');
    if (orders.rows.length > 0) {
      orders.rows.forEach(order => {
        console.log(`  Order ID: ${order.id}`);
        console.log(`    Amount: ${order.total} ${order.currency}`);
        console.log(`    Status: ${order.status}`);
        console.log(`    Payment ID: ${order.payment_id}`);
        console.log(`    Creación: ${order.fecha_creacion}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No orders found');
    }
    
    // Check for recent licenses
    const licenses = await pool.query(`
      SELECT * FROM bot_licenses 
      WHERE user_id = $1
      ORDER BY purchase_date DESC
      LIMIT 10
    `, [userId]);
    
    console.log('🔑 Licencias del usuario:');
    if (licenses.rows.length > 0) {
      licenses.rows.forEach(license => {
        console.log(`  License Key: ${license.license_key}`);
        console.log(`    Active: ${license.active}`);
        console.log(`    Purchase Date: ${license.purchase_date}`);
        console.log(`    Expiry Date: ${license.expiry_date}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No licenses found');
    }
    
  } finally {
    await pool.end();
  }
})();
