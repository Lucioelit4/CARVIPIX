// verify-user-email.js
const { Client } = require('pg');

const dbUrl = "postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

async function verify() {
  const client = new Client({ connectionString: dbUrl });
  
  await client.connect();
  
  try {
    // Marcar usuario como verified
    const result = await client.query(
      `UPDATE users SET email_verified = true WHERE email = $1 RETURNING email, email_verified`,
      ['realtest.2026july@carvipix.local']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
    } else {
      console.log(`✅ Email verificado: ${result.rows[0].email}`);
    }
    
  } finally {
    await client.end();
  }
}

verify().catch(console.error);
