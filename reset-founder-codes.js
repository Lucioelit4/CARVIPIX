// reset-founder-codes.js
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

async function resetCodes() {
  try {
    await client.connect();
    console.log('🔌 Conectado a BD\n');

    // Reset FOUNDER-001 a 005: set used_count = 0
    console.log('🔄 Reseteando FOUNDER-001 a FOUNDER-005...\n');

    const result = await client.query(`
      UPDATE beta_invitation_codes
      SET used_count = 0
      WHERE code IN ('FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005')
      RETURNING code, used_count, max_uses, is_active
    `);

    console.log('✅ Códigos reseteados:\n');
    result.rows.forEach(row => {
      console.log(`  ${row.code}: ${row.used_count}/${row.max_uses} (Active: ${row.is_active ? '✅' : '❌'})`);
    });

    // Verify they're clean
    const verify = await client.query(`
      SELECT code, used_count, max_uses, is_active
      FROM beta_invitation_codes
      WHERE code IN ('FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005')
      ORDER BY code
    `);

    console.log('\n✅ Verificación final:\n');
    verify.rows.forEach(row => {
      const status = row.used_count === 0 && row.is_active ? '✅' : '❌';
      console.log(`  ${status} ${row.code}: ${row.used_count}/${row.max_uses}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetCodes();
