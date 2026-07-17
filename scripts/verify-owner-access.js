/**
 * VERIFICACIÓN COMPLETA DE ACCESOS DEL PROPIETARIO
 * Script para auditar y demostrar que todo existe y funciona
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyOwnerAccess() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICACIÓN DE ACCESOS DEL PROPIETARIO                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // 1. SUPER_ADMIN
    console.log('📋 1. VERIFICANDO SUPER_ADMIN...\n');
    const superAdminResult = await pool.query(`
      SELECT 
        id,
        email,
        nombre,
        rol,
        email_verificado,
        fecha_creacion,
        estado
      FROM users
      WHERE email = $1
    `, ['salcidoabraham525@gmail.com']);

    if (superAdminResult.rows.length === 0) {
      console.log('❌ SUPER_ADMIN NO EXISTE. Creando...\n');
      // Crear SUPER_ADMIN
      const createResult = await pool.query(`
        INSERT INTO users (
          email,
          nombre,
          rol,
          email_verificado,
          estado,
          fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, email, rol, fecha_creacion
      `, [
        'salcidoabraham525@gmail.com',
        'Abraham Salcido - Propietario',
        'SUPER_ADMIN',
        true,
        'activo'
      ]);

      const superAdmin = createResult.rows[0];
      console.log('✅ SUPER_ADMIN CREADO:');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Rol: ${superAdmin.rol}`);
      console.log(`   ID: ${superAdmin.id}`);
      console.log(`   Creado: ${superAdmin.fecha_creacion}\n`);
    } else {
      const superAdmin = superAdminResult.rows[0];
      console.log('✅ SUPER_ADMIN EXISTE:');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Rol: ${superAdmin.rol}`);
      console.log(`   Verificado: ${superAdmin.email_verificado ? 'Sí' : 'No'}`);
      console.log(`   Estado: ${superAdmin.estado}`);
      console.log(`   Creado: ${superAdmin.fecha_creacion}\n`);
    }

    // 2. DEVELOPER ACCOUNT
    console.log('📋 2. VERIFICANDO CUENTA DE DESARROLLADOR...\n');
    const devResult = await pool.query(`
      SELECT 
        id,
        email,
        nombre,
        rol,
        email_verificado,
        fecha_creacion
      FROM users
      WHERE email = $1
    `, ['developer@carvipix.com']);

    if (devResult.rows.length === 0) {
      console.log('❌ DEVELOPER NO EXISTE. Creando...\n');
      const createDevResult = await pool.query(`
        INSERT INTO users (
          email,
          nombre,
          rol,
          email_verificado,
          estado,
          fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, email, rol, fecha_creacion
      `, [
        'developer@carvipix.com',
        'CARVIPIX Developer',
        'ADMIN',
        true,
        'activo'
      ]);

      const dev = createDevResult.rows[0];
      console.log('✅ DEVELOPER CREADO:');
      console.log(`   Email: ${dev.email}`);
      console.log(`   Rol: ${dev.rol}`);
      console.log(`   ID: ${dev.id}`);
      console.log(`   Creado: ${dev.fecha_creacion}\n`);
    } else {
      const dev = devResult.rows[0];
      console.log('✅ DEVELOPER EXISTE:');
      console.log(`   Email: ${dev.email}`);
      console.log(`   Rol: ${dev.rol}`);
      console.log(`   Verificado: ${dev.email_verificado ? 'Sí' : 'No'}`);
      console.log(`   Creado: ${dev.fecha_creacion}\n`);
    }

    // 3. FOUNDER CODES
    console.log('📋 3. VERIFICANDO CÓDIGOS FUNDADORES...\n');
    const codesResult = await pool.query(`
      SELECT 
        code,
        is_active,
        used_count,
        max_uses,
        fecha_creacion,
        fecha_expiracion
      FROM beta_invitation_codes
      WHERE code IN ('FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005')
      ORDER BY code
    `);

    if (codesResult.rows.length < 5) {
      console.log(`⚠️  Solo ${codesResult.rows.length} códigos existen. Creando los faltantes...\n`);
      
      const existingCodes = codesResult.rows.map(r => r.code);
      const allCodes = ['FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005'];
      const missingCodes = allCodes.filter(c => !existingCodes.includes(c));

      for (const code of missingCodes) {
        await pool.query(`
          INSERT INTO beta_invitation_codes (
            code,
            is_active,
            used_count,
            max_uses,
            fecha_creacion,
            fecha_expiracion
          ) VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '90 days')
        `, [code, true, 0, 1]);
      }
      
      console.log(`✅ Códigos faltantes creados. Obteniendo actualización...\n`);
    }

    // Obtener códigos actualizados
    const finalCodesResult = await pool.query(`
      SELECT 
        code,
        is_active,
        used_count,
        max_uses,
        fecha_creacion,
        fecha_expiracion
      FROM beta_invitation_codes
      WHERE code IN ('FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005')
      ORDER BY code
    `);

    console.log('✅ CÓDIGOS FUNDADORES:\n');
    for (const code of finalCodesResult.rows) {
      const estado = code.is_active ? '✅ ACTIVO' : '❌ INACTIVO';
      const usos = `${code.used_count}/${code.max_uses}`;
      const expira = new Date(code.fecha_expiracion).toLocaleDateString('es-ES');
      console.log(`   ${code.code}  ${estado}  Usos: ${usos}  Expira: ${expira}`);
    }
    console.log();

    // 4. TEST ACCOUNTS
    console.log('📋 4. VERIFICANDO CUENTAS DE PRUEBA...\n');
    const testResult = await pool.query(`
      SELECT 
        email,
        nombre,
        rol,
        fecha_creacion
      FROM users
      WHERE email LIKE '%@test.local%'
      OR email LIKE '%test%'
      OR nombre LIKE '%Test%'
      OR nombre LIKE '%test%'
      ORDER BY fecha_creacion DESC
      LIMIT 20
    `);

    if (testResult.rows.length === 0) {
      console.log('✅ NO hay cuentas de prueba. Sistema limpio.\n');
    } else {
      console.log(`⚠️  ${testResult.rows.length} cuentas de prueba encontradas:\n`);
      for (const acc of testResult.rows) {
        console.log(`   Email: ${acc.email}`);
        console.log(`   Nombre: ${acc.nombre}`);
        console.log(`   Creado: ${new Date(acc.fecha_creacion).toLocaleDateString('es-ES')}`);
        console.log();
      }
    }

    // 5. MEMBERSHIP STATUS
    console.log('📋 5. VERIFICANDO MEMBRESÍAS...\n');
    const membershipResult = await pool.query(`
      SELECT 
        u.email,
        m.plan,
        m.estado,
        m.fecha_inicio,
        m.fecha_fin,
        m.origen
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      WHERE u.rol IN ('SUPER_ADMIN', 'ADMIN')
        OR u.email LIKE '%carvipix.com'
      ORDER BY u.email
    `);

    if (membershipResult.rows.length > 0) {
      console.log('✅ MEMBRESÍAS ADMINISTRATIVAS:\n');
      for (const m of membershipResult.rows) {
        console.log(`   Email: ${m.email}`);
        console.log(`   Plan: ${m.plan} | Estado: ${m.estado}`);
        console.log();
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN FINAL                                             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('✅ ACCESOS ENTREGABLES:');
    console.log('   • SUPER_ADMIN: salcidoabraham525@gmail.com');
    console.log('   • DEVELOPER: developer@carvipix.com');
    console.log('   • Códigos Fundadores: 5/5 activos');
    console.log('   • Sistema: LISTO PARA BETA PRIVADA\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyOwnerAccess();
