// init-and-add-codes.js
const { Client } = require('pg');

const dbUrl = "postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

async function initAndAdd() {
  const client = new Client({ connectionString: dbUrl });
  
  await client.connect();
  
  try {
    // Inicializar schema si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS beta_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percentage INT DEFAULT 0,
        max_uses INT DEFAULT 1,
        uses INT DEFAULT 0,
        active BOOLEAN DEFAULT true,
        product_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table beta_codes ready');
    
    // Crear nuevos códigos
    for (let i = 11; i <= 20; i++) {
      const code = `FOUNDER-${String(i).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO beta_codes (code, discount_percentage, max_uses, active, product_id)
         VALUES ($1, 100, 1, true, 'CARVIPIX_BOT_V1')
         ON CONFLICT (code) DO NOTHING`,
        [code]
      );
      console.log(`✅ ${code}`);
    }
    
    console.log('\n✅ FOUNDER-011 a FOUNDER-020 ready for use');
    
  } finally {
    await client.end();
  }
}

initAndAdd().catch(console.error);
