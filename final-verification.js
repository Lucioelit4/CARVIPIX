// final-verification.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key.trim()] = value;
  }
});

const client = new Client({
  connectionString: env.DATABASE_URL
});

async function verify() {
  try {
    await client.connect();
    console.log('✅ VERIFICACIÓN FINAL DE ESTADO DE BETA PRIVADA\n');
    console.log('=' .repeat(60));
    console.log('');

    // 1. Verify FOUNDER codes
    console.log('📋 CÓDIGOS FOUNDER:\n');
    const codes = await client.query(`
      SELECT code, used_count, max_uses, is_active, expires_at
      FROM beta_invitation_codes
      WHERE code IN ('FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005')
      ORDER BY code
    `);

    let codesOK = 0;
    codes.rows.forEach(row => {
      const status = row.used_count === 0 && row.is_active ? '✅' : '❌';
      console.log(`${status} ${row.code}: ${row.used_count}/${row.max_uses} (Active: ${row.is_active})`);
      if (row.used_count === 0 && row.is_active) codesOK++;
    });

    console.log(`\n📊 Códigos listos: ${codesOK}/5\n`);

    // 2. Verify test users are deleted
    console.log('👥 USUARIOS DE PRUEBA:\n');
    const testUsers = await client.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE email LIKE '%mailinator%' OR email LIKE '%test%'
    `);

    const testCount = testUsers.rows[0].count;
    const testStatus = testCount === 0 ? '✅' : '❌';
    console.log(`${testStatus} Usuarios Mailinator/Test: ${testCount}`);
    if (testCount > 0) {
      const detail = await client.query(`
        SELECT email FROM users 
        WHERE email LIKE '%mailinator%' OR email LIKE '%test%'
        LIMIT 5
      `);
      detail.rows.forEach(row => console.log(`   ⚠️  ${row.email}`));
    }

    console.log('');

    // 3. Verify no orphaned orders/licenses
    console.log('📦 ORDENES Y LICENCIAS:\n');
    const orders = await client.query('SELECT COUNT(*) as count FROM orders');
    const licenses = await client.query('SELECT COUNT(*) as count FROM bot_licenses');
    const payments = await client.query('SELECT COUNT(*) as count FROM payments');

    console.log(`📊 Órdenes en BD: ${orders.rows[0].count}`);
    console.log(`📊 Licencias en BD: ${licenses.rows[0].count}`);
    console.log(`📊 Pagos en BD: ${payments.rows[0].count}`);

    console.log('');

    // 4. Summary
    console.log('=' .repeat(60));
    console.log('\n🎯 RESUMEN FINAL:\n');
    
    const isReady = codesOK === 5 && testCount === 0;
    const statusEmoji = isReady ? '✅' : '⚠️ ';
    
    console.log(`${statusEmoji} Estado general: ${isReady ? 'LISTO PARA BETA PRIVADA' : 'REQUIERE AJUSTES'}\n`);

    if (isReady) {
      console.log('✅ Plataforma preparada para Beta Privada');
      console.log('✅ 5 códigos FOUNDER limpios disponibles');
      console.log('✅ Datos de prueba eliminados');
      console.log('\n🚀 Puedes iniciar la Beta Privada ahora\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();
