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

async function checkNewAccount() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Buscar cuenta creada recientemente
    const userResult = await pool.query(`
      SELECT id, email, nombre, apellido, user_role, verificado, created_at
      FROM users
      WHERE email LIKE 'certitest.%@test.local'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No se encontró cuenta de prueba');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('\n✅ CUENTA CREADA:\n');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Nombre: ${user.nombre} ${user.apellido}`);
    console.log(`Rol: ${user.user_role}`);
    console.log(`Verificado: ${user.verificado ? 'SÍ' : 'NO'}`);
    console.log(`Creado: ${user.created_at}`);
    
    // Verificar membresía
    const memberResult = await pool.query(`
      SELECT plan, estado, fecha_fin, origen
      FROM memberships
      WHERE user_id = $1
    `, [user.id]);
    
    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];
      console.log(`\n✅ MEMBRESÍA:\n`);
      console.log(`Plan: ${member.plan}`);
      console.log(`Estado: ${member.estado}`);
      console.log(`Fin: ${member.fecha_fin}`);
      console.log(`Origen: ${member.origen}`);
    }
    
    // Verificar si el código fue marcado como usado
    const codeResult = await pool.query(`
      SELECT code, used_count, max_uses
      FROM beta_invitation_codes
      WHERE code = 'FOUNDER-001'
    `);
    
    if (codeResult.rows.length > 0) {
      const code = codeResult.rows[0];
      console.log(`\n✅ CÓDIGO INVITACIÓN:\n`);
      console.log(`Código: ${code.code}`);
      console.log(`Usos: ${code.used_count}/${code.max_uses}`);
    }
    
  } finally {
    await pool.end();
  }
}

checkNewAccount();
