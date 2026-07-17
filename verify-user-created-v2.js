// verify-user-created-v2.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key.trim()] = value;
  }
});

const client = new Client({
  connectionString: env.DATABASE_URL
});

async function checkUser() {
  try {
    await client.connect();
    console.log('✅ Conectado a BD\n');

    const result = await client.query(`
      SELECT *
      FROM users
      WHERE email = 'carvipix.clientefinal2026@mailinator.com'
    `);

    if (result.rows.length === 0) {
      console.log('❌ Usuario NO encontrado en la base de datos');
      return;
    }

    const user = result.rows[0];
    console.log('✅ Usuario encontrado:\n');
    Object.keys(user).forEach(key => {
      console.log(`${key}: ${user[key]}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUser();
