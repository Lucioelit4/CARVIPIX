// cleanup-test-data.js
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

async function cleanup() {
  try {
    await client.connect();
    console.log('🗑️  Iniciando limpieza de datos de prueba...\n');

    // Identificar usuario de prueba por email
    const userResult = await client.query(`
      SELECT id, email FROM users 
      WHERE 
        email LIKE '%mailinator%' 
        OR email LIKE '%test%final%'
        OR email LIKE '%.test'
        OR email LIKE '%.local'
        OR email LIKE '%.testing'
        OR email LIKE '%testing.%'
        OR email LIKE '%prueba%'
        OR email LIKE '%test-%'
      LIMIT 50
    `);

    if (userResult.rows.length === 0) {
      console.log('✅ No hay usuarios de prueba encontrados');
      await client.end();
      return;
    }

    const testUsers = userResult.rows;
    console.log(`⚠️  ${testUsers.length} usuario(s) de prueba encontrado(s):\n`);
    testUsers.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
    console.log('');

    // Delete in safe order: orders → bot_downloads → bot_licenses → payments → memberships → beta_events → users
    
    let deletedCount = 0;

    for (const user of testUsers) {
      console.log(`\n🗑️  Limpiando usuario: ${user.email}...`);

      // Get order IDs first
      const orders = await client.query(
        'SELECT id FROM orders WHERE user_id = $1',
        [user.id]
      );

      if (orders.rows.length > 0) {
        // Delete payments by order
        const paymentDelete = await client.query(
          'DELETE FROM payments WHERE user_id = $1',
          [user.id]
        );
        console.log(`   ✓ Pagos eliminados: ${paymentDelete.rowCount}`);
        deletedCount += paymentDelete.rowCount;
      }

      // Delete orders
      const orderDelete = await client.query(
        'DELETE FROM orders WHERE user_id = $1',
        [user.id]
      );
      console.log(`   ✓ Órdenes eliminadas: ${orderDelete.rowCount}`);
      deletedCount += orderDelete.rowCount;

      // Delete bot downloads
      const downloadDelete = await client.query(
        'DELETE FROM bot_downloads WHERE user_id = $1',
        [user.id]
      );
      console.log(`   ✓ Descargas eliminadas: ${downloadDelete.rowCount}`);
      deletedCount += downloadDelete.rowCount;

      // Delete bot licenses
      const licenseDelete = await client.query(
        'DELETE FROM bot_licenses WHERE user_id = $1',
        [user.id]
      );
      console.log(`   ✓ Licencias eliminadas: ${licenseDelete.rowCount}`);
      deletedCount += licenseDelete.rowCount;

      // Delete memberships
      const membershipDelete = await client.query(
        'DELETE FROM memberships WHERE user_id = $1',
        [user.id]
      );
      console.log(`   ✓ Membresías eliminadas: ${membershipDelete.rowCount}`);
      deletedCount += membershipDelete.rowCount;

      // Delete beta events
      const eventDelete = await client.query(
        'DELETE FROM beta_events WHERE user_id = $1',
        [user.id]
      );
      console.log(`   ✓ Eventos eliminados: ${eventDelete.rowCount}`);
      deletedCount += eventDelete.rowCount;

      // Delete verification tokens (if table exists)
      try {
        const tokenDelete = await client.query(
          'DELETE FROM email_verification_tokens WHERE user_id = $1',
          [user.id]
        );
        console.log(`   ✓ Tokens eliminados: ${tokenDelete.rowCount}`);
        deletedCount += tokenDelete.rowCount;
      } catch {
        // Table may not exist, skip
      }

      // Finally delete user
      const userDelete = await client.query(
        'DELETE FROM users WHERE id = $1',
        [user.id]
      );
      console.log(`   ✓ Usuario eliminado: ${userDelete.rowCount}`);
      deletedCount += userDelete.rowCount;
    }

    console.log(`\n✅ Limpieza completada`);
    console.log(`📊 Total registros eliminados: ${deletedCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

cleanup();
