// check-founder-codes.js
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkCodes() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    const result = await client.query(`
      SELECT code, is_active, used_count, max_uses
      FROM beta_invitation_codes
      WHERE code LIKE 'FOUNDER-%'
      ORDER BY code
    `);

    console.log('📋 Códigos FOUNDER disponibles:\n');
    console.table(result.rows);

    // Find valid codes
    const validCodes = result.rows.filter(row => 
      row.is_active && row.used_count < row.max_uses
    );

    if (validCodes.length > 0) {
      console.log(`\n✅ ${validCodes.length} códigos válidos encontrados:`);
      validCodes.forEach(code => {
        console.log(`  - ${code.code} (${code.used_count}/${code.max_uses})`);
      });
    } else {
      console.log('\n❌ No hay códigos válidos disponibles');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkCodes();
