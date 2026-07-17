// check-codes.js
const { Client } = require('pg');

const dbUrl = "postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

async function check() {
  const client = new Client({
    connectionString: dbUrl
  });
  
  await client.connect();
  
  try {
    // Ver códigos existentes
    const result = await client.query(
      `SELECT code, uses, max_uses, active FROM beta_codes ORDER BY code`
    );
    console.log('📋 CÓDIGOS FOUNDER EXISTENTES:\n');
    result.rows.forEach(row => {
      console.log(`${row.code}: ${row.uses}/${row.max_uses} usos - ${row.active ? '✅ Activo' : '❌ Inactivo'}`);
    });
    
    console.log('\n---\n');
    
    // Crear nuevos códigos
    for (let i = 11; i <= 20; i++) {
      const code = `FOUNDER-${String(i).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO beta_codes (code, discount_percentage, max_uses, active, product_id)
         VALUES ($1, 100, 1, true, 'CARVIPIX_BOT_V1')
         ON CONFLICT (code) DO NOTHING`,
        [code]
      );
    }
    
    console.log('✅ Nuevos códigos FOUNDER-011 a FOUNDER-020 creados\n');
    
  } finally {
    await client.end();
  }
}

check().catch(console.error);
