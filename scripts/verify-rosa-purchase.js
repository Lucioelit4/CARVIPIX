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
    // Check Rosa user
    const user = await pool.query(`
      SELECT id, email, nombre FROM users 
      WHERE email = 'rosa.martinez@test.local'
    `);
    
    if (user.rows.length === 0) {
      console.log('❌ Usuario Rosa no encontrado');
      return;
    }
    
    const userId = user.rows[0].id;
    console.log('👤 Usuario Rosa:');
    console.log(`  ID: ${userId}`);
    console.log(`  Email: ${user.rows[0].email}`);
    console.log(`  Nombre: ${user.rows[0].nombre}`);
    console.log('');
    
    // Check for orders
    const orders = await pool.query(`
      SELECT * FROM orders 
      WHERE user_id = $1
      ORDER BY fecha_creacion DESC
    `, [userId]);
    
    console.log('📋 PRUEBA 2 - Órdenes:');
    if (orders.rows.length > 0) {
      console.log('  ✅ Orden encontrada');
      const order = orders.rows[0];
      console.log(`    ID: ${order.id}`);
      console.log(`    Amount: ${order.total} ${order.currency}`);
      console.log(`    Status: ${order.status}`);
      console.log(`    Fecha: ${order.fecha_creacion}`);
    } else {
      console.log('  ❌ Orden NO encontrada');
    }
    console.log('');
    
    // Check for licenses
    const licenses = await pool.query(`
      SELECT * FROM bot_mt5_licenses 
      WHERE user_id = $1
      ORDER BY activated_at DESC
    `, [userId]);
    
    console.log('📋 PRUEBA 3 - Licencias:');
    if (licenses.rows.length > 0) {
      console.log('  ✅ Licencia encontrada');
      const lic = licenses.rows[0];
      console.log(`    License ID: ${lic.license_id}`);
      console.log(`    Status: ${lic.status}`);
      console.log(`    Created: ${lic.activated_at}`);
    } else {
      console.log('  ❌ Licencia NO encontrada');
    }
    
  } finally {
    await pool.end();
  }
})();
