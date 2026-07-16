const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
      const value = line.substring('DATABASE_URL='.length).replace(/^"|"$/g, '');
      process.env.DATABASE_URL = value;
      break;
    }
  }
}

loadEnv();

async function resetCodes() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    const result = await pool.query(`
      UPDATE beta_invitation_codes
      SET used_count = 0, is_active = true
      WHERE code LIKE 'FOUNDER-%'
      RETURNING code, used_count, is_active
    `);
    
    console.log('\n🔄 RESETEANDO CÓDIGOS DE INVITACIÓN:\n');
    
    for (const row of result.rows) {
      console.log(`✅ ${row.code}: used_count = ${row.used_count}, is_active = ${row.is_active}`);
    }
    
    console.log(`\n✅ Total reseteados: ${result.rows.length} códigos`);
    console.log('   Los códigos ya están listos para nuevos Fundadores\n');
    
  } finally {
    await pool.end();
  }
}

resetCodes();
