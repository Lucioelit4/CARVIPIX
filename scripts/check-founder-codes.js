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

async function checkCodes() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    const result = await pool.query(`
      SELECT code, max_uses, used_count, is_active, expires_at, 
             (expires_at > NOW()) as not_expired
      FROM beta_invitation_codes
      WHERE code LIKE 'FOUNDER-%'
      ORDER BY code
    `);
    
    console.log('\n📊 ESTADO DE CÓDIGOS DE INVITACIÓN:\n');
    console.log('CODE          | MAX_USES | USED_COUNT | ACTIVE | NOT_EXPIRED');
    console.log('─────────────────────────────────────────────────────────────');
    
    for (const row of result.rows) {
      const status = row.is_active && row.not_expired ? '✅' : '❌';
      console.log(`${status} ${row.code}  |    ${row.max_uses}     |     ${row.used_count}      |  ${row.is_active ? 'SÍ' : 'NO'}    | ${row.not_expired ? 'SÍ' : 'NO'}`);
    }
    
    console.log('\n✅ Total: ' + result.rows.length + ' códigos');
    
  } finally {
    await pool.end();
  }
}

checkCodes();
