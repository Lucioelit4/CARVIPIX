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

async function checkLatest() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    const userResult = await pool.query(`
      SELECT id, email, nombre, apellido, user_role, verificado, created_at
      FROM users
      WHERE email LIKE '%test%@test.local'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No test account found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('\n✅ ÚLTIMA CUENTA CREADA:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
    console.log(`   Creado: ${user.created_at}`);
    
    const memberResult = await pool.query(`
      SELECT plan, estado, fecha_inicio, fecha_fin, origen
      FROM memberships
      WHERE user_id = $1
    `, [user.id]);
    
    const member = memberResult.rows[0];
    console.log('\n✅ MEMBRESÍA:');
    console.log(`   Plan: ${member.plan}`);
    console.log(`   Estado: ${member.estado}`);
    console.log(`   Origen: ${member.origen}`);
    console.log(`   Fin: ${member.fecha_fin}`);
    
    if (member.plan === 'PRO' && member.estado === 'activo' && member.origen === 'FOUNDERS_BETA') {
      console.log('\n✅ CORRECTO: Membresía FOUNDERS_BETA aplicada correctamente');
    } else {
      console.log('\n❌ ERROR: Membresía no es FOUNDERS_BETA');
    }
    
  } finally {
    await pool.end();
  }
}

checkLatest();
