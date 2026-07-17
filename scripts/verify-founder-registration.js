const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

Object.assign(process.env, envVars);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('aws.neon.tech') ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const res = await pool.query(
      `SELECT u.id, u.email, u.nombre, u.apellido, m.plan, m.estado, m.origen, m.fecha_fin
       FROM users u
       LEFT JOIN memberships m ON u.id = m.user_id
       WHERE u.email = 'juan@example.com'`
    );

    if (res.rows.length === 0) {
      console.log('❌ Cuenta no encontrada');
    } else {
      const user = res.rows[0];
      console.log('✅ Cuenta encontrada:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   Plan: ${user.plan}`);
      console.log(`   Estado: ${user.estado}`);
      console.log(`   Origen: ${user.origen}`);
      console.log(`   Membresía válida hasta: ${new Date(user.fecha_fin).toLocaleDateString('es-ES')}`);
    }

    // Verificar que el código FOUNDER-002 fue incrementado
    const codeRes = await pool.query(
      `SELECT code, used_count, max_uses FROM beta_invitation_codes WHERE code = 'FOUNDER-002'`
    );
    
    console.log('\n📊 Estado del código FOUNDER-002:');
    const code = codeRes.rows[0];
    console.log(`   Usos: ${code.used_count}/${code.max_uses}`);

  } finally {
    await pool.end();
  }
})();
