const { Client } = require('pg');
const dbUrl = 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

async function verify() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const result = await client.query(
      \UPDATE users SET verificado = true WHERE email = \ RETURNING email, verificado\,
      ['realtest.2026july@carvipix.local']
    );
    console.log('? Usuario verificado:', result.rows[0]);
  } finally {
    await client.end();
  }
}
verify().catch(console.error);
