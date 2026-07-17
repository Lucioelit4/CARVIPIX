#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAdmins() {
  try {
    console.log('\n📋 Consultando cuentas administrativas...\n');
    
    const result = await pool.query(
      `SELECT email, rol, email_verificado, estado FROM users 
       WHERE rol IN ('SUPER_ADMIN', 'ADMIN') 
       ORDER BY rol DESC, email`
    );

    if (result.rows.length === 0) {
      console.log('❌ No hay cuentas administrativas.\n');
    } else {
      console.log('✅ Cuentas encontradas:\n');
      result.rows.forEach(u => {
        console.log(`   Email: ${u.email}`);
        console.log(`   Rol: ${u.rol}`);
        console.log(`   Verificado: ${u.email_verificado ? 'Sí' : 'No'}`);
        console.log(`   Estado: ${u.estado}\n`);
      });
    }

    // Check codes
    console.log('📋 Consultando códigos FOUNDER...\n');
    
    const codesRes = await pool.query(
      `SELECT code, is_active, used_count, max_uses, fecha_expiracion 
       FROM beta_invitation_codes 
       WHERE code LIKE 'FOUNDER-%'
       ORDER BY code`
    );

    if (codesRes.rows.length === 0) {
      console.log('❌ No hay códigos FOUNDER.\n');
    } else {
      console.log('✅ Códigos encontrados:\n');
      codesRes.rows.forEach(c => {
        const status = c.is_active ? '✅ ACTIVO' : '❌ INACTIVO';
        console.log(`   ${c.code}: ${status} | Usos: ${c.used_count}/${c.max_uses}`);
      });
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmins();
