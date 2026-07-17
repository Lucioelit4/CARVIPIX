// check-founder-codes-v4.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Leer .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const envLines = envFile.split('\n');
const env = {};

envLines.forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    // Remover comillas si existen
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key.trim()] = value;
  }
});

console.log('📍 DATABASE_URL cargada desde .env.local');
console.log('📍 Longitud:', env.DATABASE_URL?.length || 0);

if (!env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no encontrada');
  process.exit(1);
}

const client = new Client({
  connectionString: env.DATABASE_URL
});

async function checkCodes() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado\n');

    const result = await client.query(`
      SELECT code, is_active, used_count, max_uses
      FROM beta_invitation_codes
      WHERE code LIKE 'FOUNDER-%'
      ORDER BY code
      LIMIT 30
    `);

    console.log(`📋 Total códigos encontrados: ${result.rows.length}\n`);
    result.rows.forEach(row => {
      const status = row.is_active && row.used_count < row.max_uses ? '✅' : '❌';
      console.log(`${status} ${row.code}: ${row.used_count}/${row.max_uses} (Active: ${row.is_active})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkCodes();
