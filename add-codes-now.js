require('dotenv').config({ path: './\.env.local' });
const { backendDatabase } = require('./app/backend/db');

async function main() {
  for (let i = 11; i <= 15; i++) {
    const code = `FOUNDER-${String(i).padStart(3, '0')}`;
    try {
      const result = await backendDatabase.query(
        `INSERT INTO beta_codes (code, discount_percentage, max_uses, active, product_id)
         VALUES ($1, 100, 1, true, 'CARVIPIX_BOT_V1')
         ON CONFLICT (code) DO NOTHING RETURNING code`,
        [code]
      );
      console.log(`✅ ${code} - Created`);
    } catch (e) {
      console.log(`❌ ${code} - Error: ${e.message}`);
    }
  }
  process.exit(0);
}

main();