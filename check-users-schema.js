// check-users-schema.js
const { Client } = require('pg');

const dbUrl = "postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

async function check() {
  const client = new Client({ connectionString: dbUrl });
  
  await client.connect();
  
  try {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 USUARIOS TABLE SCHEMA:\n');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // También buscar usuario  
    const user = await client.query(
      `SELECT id, email, EXISTS(SELECT 1 FROM users WHERE email = $1) as exists FROM users WHERE email = $1 LIMIT 1`,
      ['realtest.2026july@carvipix.local']
    );
    
    console.log('\n---\n');
    if (user.rows.length > 0) {
      console.log(`✅ Usuario encontrado: ${user.rows[0].email}`);
      console.log(`   ID: ${user.rows[0].id}`);
    } else {
      console.log('❌ Usuario no encontrado');
    }
    
  } finally {
    await client.end();
  }
}

check().catch(console.error);
