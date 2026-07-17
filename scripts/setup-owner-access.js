const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require'
  });

  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICACIÓN DE ACCESOS DEL PROPIETARIO                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. Check SUPER_ADMIN
    console.log('1️⃣  SUPER_ADMIN\n');
    const superAdminRes = await pool.query(
      `SELECT id, email, nombre, user_role, verificado, estado, created_at 
       FROM users WHERE email = $1`,
      ['salcidoabraham525@gmail.com']
    );

    if (superAdminRes.rows.length === 0) {
      console.log('❌ NO EXISTE\n');
      console.log('Creando...\n');
      
      const adminId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(
        `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          adminId,
          'salcidoabraham525@gmail.com',
          'Abraham',
          'Salcido',
          'SUPER_ADMIN',
          true,
          'activo',
          'scrypt:placeholder'
        ]
      );
      
      console.log('✅ CREADO\n');
      console.log('   Email: salcidoabraham525@gmail.com');
      console.log('   Rol: SUPER_ADMIN');
      console.log('   Estado: activo\n');
    } else {
      const sa = superAdminRes.rows[0];
      console.log('✅ EXISTE\n');
      console.log(`   Email: ${sa.email}`);
      console.log(`   Rol: ${sa.user_role}`);
      console.log(`   Verificado: ${sa.verificado ? 'Sí' : 'No'}`);
      console.log(`   Estado: ${sa.estado}`);
      console.log(`   Creado: ${new Date(sa.created_at).toLocaleDateString('es-ES')}\n`);
    }

    // 2. Check Developer
    console.log('2️⃣  CUENTA DESARROLLADOR\n');
    const devRes = await pool.query(
      `SELECT id, email, nombre, user_role, verificado, estado, created_at 
       FROM users WHERE email = $1`,
      ['developer@carvipix.com']
    );

    if (devRes.rows.length === 0) {
      console.log('❌ NO EXISTE\n');
      console.log('Creando...\n');
      
      const devId = `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(
        `INSERT INTO users (id, email, nombre, apellido, user_role, verificado, estado, password_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          devId,
          'developer@carvipix.com',
          'Developer',
          'Account',
          'ADMIN',
          true,
          'activo',
          'scrypt:placeholder'
        ]
      );
      
      console.log('✅ CREADO\n');
      console.log('   Email: developer@carvipix.com');
      console.log('   Rol: ADMIN');
      console.log('   Estado: activo\n');
    } else {
      const dev = devRes.rows[0];
      console.log('✅ EXISTE\n');
      console.log(`   Email: ${dev.email}`);
      console.log(`   Rol: ${dev.user_role}`);
      console.log(`   Verificado: ${dev.verificado ? 'Sí' : 'No'}`);
      console.log(`   Estado: ${dev.estado}`);
      console.log(`   Creado: ${new Date(dev.created_at).toLocaleDateString('es-ES')}\n`);
    }

    // 3. Check Codes
    console.log('3️⃣  CÓDIGOS FUNDADORES\n');
    const codesRes = await pool.query(
      `SELECT code, is_active, used_count, max_uses, expires_at 
       FROM beta_invitation_codes 
       WHERE code IN ('FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005')
       ORDER BY code`
    );

    console.log(`${codesRes.rows.length} códigos encontrados:\n`);
    
    const requiredCodes = ['FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005'];
    const existingCodes = codesRes.rows.map(r => r.code);
    const missingCodes = requiredCodes.filter(c => !existingCodes.includes(c));

    if (missingCodes.length > 0) {
      console.log(`${missingCodes.length} códigos faltantes. Creando...\n`);
      
      for (const code of missingCodes) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);
        
        await pool.query(
          `INSERT INTO beta_invitation_codes (code, is_active, used_count, max_uses, expires_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [code, true, 0, 1, expiresAt]
        );
      }
      
      console.log(`✅ ${missingCodes.length} códigos creados\n`);
    }

    // Get final codes
    const finalCodesRes = await pool.query(
      `SELECT code, is_active, used_count, max_uses, expires_at 
       FROM beta_invitation_codes 
       WHERE code IN ('FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005')
       ORDER BY code`
    );

    console.log('✅ ESTADO FINAL:\n');
    for (const c of finalCodesRes.rows) {
      const status = c.is_active ? '✅ ACTIVO' : '❌ INACTIVO';
      const expira = c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-ES') : 'N/A';
      console.log(`   ${c.code}  ${status}  |  Usos: ${c.used_count}/${c.max_uses}  |  Expira: ${expira}`);
    }
    console.log();

    // Final summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN - ACCESOS ENTREGABLES                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✅ ACCESOS CREADOS/VERIFICADOS:\n');
    console.log('   SUPER_ADMIN: salcidoabraham525@gmail.com');
    console.log('   DEVELOPER: developer@carvipix.com');
    console.log('   Códigos: FOUNDER-001 a 005 (todos activos)\n');

    console.log('📍 URLS PRINCIPALES:\n');
    console.log('   Principal: https://carvipix.com');
    console.log('   Admin: https://carvipix.com/admin');
    console.log('   Login: https://carvipix.com/login');
    console.log('   Registro: https://carvipix.com/registro');
    console.log('   Dashboard: https://carvipix.com/dashboard\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
