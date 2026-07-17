// check-founder-codes-v2.js
const { Client } = require('pg');
require('dotenv').config();

console.log('📍 DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('📍 DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
console.log('');

const client = new Client({
  connectionString: process.env.DATABASE_URL
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
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkCodes();
