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
    // Check for recent orders
    const orders = await pool.query(`
      SELECT * FROM orders 
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('📋 Órdenes recientes:');
    if (orders.rows.length > 0) {
      orders.rows.forEach(order => {
        console.log(`  ID: ${order.id}`);
        console.log(`  User ID: ${order.user_id}`);
        console.log(`  Amount: ${order.amount}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Created: ${order.created_at}`);
        console.log('');
      });
    } else {
      console.log('  No orders found in last 10 minutes');
    }
    
    // Check for recent licenses
    const licenses = await pool.query(`
      SELECT * FROM licenses 
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('🔑 Licencias recientes:');
    if (licenses.rows.length > 0) {
      licenses.rows.forEach(license => {
        console.log(`  ID: ${license.id}`);
        console.log(`  User ID: ${license.user_id}`);
        console.log(`  License Key: ${license.license_key}`);
        console.log(`  Status: ${license.status}`);
        console.log(`  Created: ${license.created_at}`);
        console.log('');
      });
    } else {
      console.log('  No licenses found in last 10 minutes');
    }
    
    // Check user details
    const user = await pool.query(`
      SELECT id, email, nombre FROM users 
      WHERE email = 'carlos.prueba@testing.local'
    `);
    
    if (user.rows.length > 0) {
      console.log('👤 Usuario:');
      console.log(`  ID: ${user.rows[0].id}`);
      console.log(`  Email: ${user.rows[0].email}`);
      console.log(`  Nombre: ${user.rows[0].nombre}`);
    }
  } finally {
    await pool.end();
  }
})();
