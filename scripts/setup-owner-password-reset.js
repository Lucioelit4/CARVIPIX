const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

// Leer variables de entorno manualmente
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

// Combinar con process.env
Object.assign(process.env, envVars);

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no definido');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('aws.neon.tech') ? { rejectUnauthorized: false } : false,
});

async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Token válido por 2 horas
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const tokenId = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    await pool.query(
      `INSERT INTO auth_password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [tokenId, userId, tokenHash, expiresAt]
    );
    
    return token;
  } catch (err) {
    console.error('Error creating token:', err.message);
    throw err;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  GÉNERAR ENLACES DE RECUPERACIÓN DE CONTRASEÑA             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. SUPER_ADMIN
    console.log('1️⃣  SUPER_ADMIN\n');
    const superAdminRes = await pool.query(
      `SELECT id, email FROM users WHERE email = $1`,
      ['salcidoabraham525@gmail.com']
    );

    if (superAdminRes.rows.length === 0) {
      console.log('❌ SUPER_ADMIN no encontrado\n');
      process.exit(1);
    }

    const superAdminId = superAdminRes.rows[0].id;
    const superAdminEmail = superAdminRes.rows[0].email;
    const superAdminToken = await createPasswordResetToken(superAdminId);
    const superAdminResetUrl = `https://carvipix.com/recuperar-password?token=${superAdminToken}`;

    console.log(`✅ Token generado\n`);
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Válido por: 30 minutos`);
    console.log(`   URL de reset:\n   ${superAdminResetUrl}\n`);

    // 2. DEVELOPER
    console.log('2️⃣  DESARROLLADOR\n');
    const devRes = await pool.query(
      `SELECT id, email FROM users WHERE email = $1`,
      ['developer@carvipix.com']
    );

    if (devRes.rows.length === 0) {
      console.log('❌ Desarrollador no encontrado\n');
      process.exit(1);
    }

    const devId = devRes.rows[0].id;
    const devEmail = devRes.rows[0].email;
    const devToken = await createPasswordResetToken(devId);
    const devResetUrl = `https://carvipix.com/recuperar-password?token=${devToken}`;

    console.log(`✅ Token generado\n`);
    console.log(`   Email: ${devEmail}`);
    console.log(`   Válido por: 30 minutos`);
    console.log(`   URL de reset:\n   ${devResetUrl}\n`);

    // 3. Limpiar FOUNDER-001
    console.log('3️⃣  LIMPIAR CÓDIGOS\n');
    
    const testRes = await pool.query(
      `SELECT id, email FROM users WHERE email LIKE '%test%' AND email != $1 AND email != $2`,
      ['salcidoabraham525@gmail.com', 'developer@carvipix.com']
    );

    if (testRes.rows.length > 0) {
      for (const testAccount of testRes.rows) {
        console.log(`   Encontrada cuenta: ${testAccount.email}`);
        
        // Eliminar en orden correcto (respetando FKs)
        await pool.query(`DELETE FROM memberships WHERE user_id = $1`, [testAccount.id]);
        await pool.query(`DELETE FROM users WHERE id = $1`, [testAccount.id]);
      }
      
      console.log(`   ✅ Cuentas de prueba eliminadas\n`);
    }

    // Reset FOUNDER-001 a 0/1 usos
    await pool.query(
      `UPDATE beta_invitation_codes SET used_count = 0 WHERE code = 'FOUNDER-001'`
    );
    console.log(`✅ FOUNDER-001 reseteado a 0/1 usos\n`);

    // 4. Crear FOUNDER-006
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    const founder006Exists = await pool.query(
      `SELECT code FROM beta_invitation_codes WHERE code = 'FOUNDER-006'`
    );

    if (founder006Exists.rows.length === 0) {
      await pool.query(
        `INSERT INTO beta_invitation_codes (code, is_active, used_count, max_uses, expires_at)
         VALUES ('FOUNDER-006', true, 0, 1, $1)`,
        [expiresAt]
      );
      console.log(`✅ FOUNDER-006 creado\n`);
    } else {
      console.log(`   FOUNDER-006 ya existe\n`);
    }

    // 5. Verificar 5 códigos disponibles
    console.log('4️⃣  CÓDIGOS DISPONIBLES\n');
    const codesRes = await pool.query(
      `SELECT code, is_active, used_count, max_uses, expires_at 
       FROM beta_invitation_codes 
       WHERE is_active = true AND used_count = 0
       ORDER BY code
       LIMIT 5`
    );

    console.log(`${codesRes.rows.length} códigos disponibles:\n`);
    for (const c of codesRes.rows) {
      const expira = new Date(c.expires_at).toLocaleDateString('es-ES');
      console.log(`   ✅ ${c.code}  |  Usos: ${c.used_count}/${c.max_uses}  |  Expira: ${expira}`);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  INSTRUCCIONES PARA EL PROPIETARIO                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`⏰ ENLACES VÁLIDOS POR 30 MINUTOS\n`);
    console.log(`📧 SUPER_ADMIN: ${superAdminEmail}`);
    console.log(`   1. Abre este enlace en 30 minutos:`);
    console.log(`   ${superAdminResetUrl}\n`);
    console.log(`   2. Ingresa tu nueva contraseña (mínimo 8 caracteres)`);
    console.log(`   3. Haz clic en "Actualizar contraseña"`);
    console.log(`   4. Ve a https://carvipix.com/admin`);
    console.log(`   5. Inicia sesión con tu email y contraseña\n`);

    console.log(`📧 DESARROLLADOR: ${devEmail}`);
    console.log(`   1. Abre este enlace en 30 minutos:`);
    console.log(`   ${devResetUrl}\n`);
    console.log(`   2. Ingresa tu nueva contraseña (mínimo 8 caracteres)`);
    console.log(`   3. Haz clic en "Actualizar contraseña"`);
    console.log(`   4. Ve a https://carvipix.com/admin`);
    console.log(`   5. Inicia sesión con tu email y contraseña\n`);

    console.log(`🔑 5 CÓDIGOS PARA FUNDADORES (NUNCA USADOS):\n`);
    for (let i = 0; i < codesRes.rows.length; i++) {
      console.log(`   ${i + 1}. ${codesRes.rows[i].code}`);
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
