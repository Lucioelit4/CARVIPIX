const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { Pool } = require('pg');

async function createCodes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    for (let i = 11; i <= 15; i++) {
      const code = FOUNDER-;
      await pool.query(
        INSERT INTO beta_codes (code, discount_percentage, max_uses, active, product_id)
         VALUES (\, 100, 1, true, 'CARVIPIX_BOT_V1')
         ON CONFLICT (code) DO NOTHING,
        [code]
      );
      console.log(? \);
    }
    console.log('\n? Códigos FOUNDER creados');
  } finally {
    await pool.end();
  }
}

createCodes().catch(console.error);
