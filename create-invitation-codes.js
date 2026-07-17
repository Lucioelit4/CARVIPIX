// create-invitation-codes.js
const { Client } = require('pg');

const dbUrl = "postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

async function createCodes() {
  const client = new Client({ connectionString: dbUrl });
  
  await client.connect();
  
  try {
    // Crear tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS beta_invitation_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        used_count INT DEFAULT 0,
        max_uses INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table beta_invitation_codes ready');
    
    // Crear códigos FOUNDER-011 a FOUNDER-020
    for (let i = 11; i <= 20; i++) {
      const code = `FOUNDER-${String(i).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO beta_invitation_codes (code, is_active, used_count, max_uses)
         VALUES ($1, true, 0, 1)
         ON CONFLICT (code) DO NOTHING`,
        [code]
      );
      console.log(`✅ ${code}`);
    }
    
    console.log('\n✅ FOUNDER-011 a FOUNDER-020 ready for registration');
    
  } finally {
    await client.end();
  }
}

createCodes().catch(console.error);
