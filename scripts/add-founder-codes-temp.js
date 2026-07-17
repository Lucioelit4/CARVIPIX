// scripts/add-founder-codes-temp.js
const { Pool } = require('pg');

async function createCodes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    for (let i = 11; i <= 15; i++) {
      const code = `FOUNDER-${String(i).padStart(3, '0')}`;
      await pool.query(
        `INSERT INTO beta_codes (code, discount_percentage, max_uses, active, product_id)
         VALUES ($1, 100, 1, true, 'CARVIPIX_BOT_V1')
         ON CONFLICT (code) DO NOTHING`,
        [code]
      );
      console.log(`✅ ${code}`);
    }
  } finally {
    await pool.end();
  }
}

createCodes().catch(console.error);
