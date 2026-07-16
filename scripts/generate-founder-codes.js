#!/usr/bin/env node
/**
 * Script para generar los 5 códigos iniciales de Fundadores en CARVIPIX Beta Privada
 * Uso: node scripts/generate-founder-codes.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

// Leer variables del archivo .env.local
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

async function generateFounderCodes() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no configurado');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  const FOUNDER_CODES = ['FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004', 'FOUNDER-005'];
  
  try {
    console.log('🔗 Conectando a base de datos...');
    const conn = await pool.connect();
    
    // Crear tabla si no existe
    await conn.query(`
      CREATE TABLE IF NOT EXISTS beta_invitation_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        max_uses INT DEFAULT 1,
        used_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('📋 Tabla beta_invitation_codes verificada');
    
    // Generar códigos
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 días
    
    console.log(`\n🚀 Generando ${FOUNDER_CODES.length} códigos...`);
    
    const created = [];
    const already_exist = [];
    
    for (const code of FOUNDER_CODES) {
      try {
        const result = await conn.query(
          `INSERT INTO beta_invitation_codes (id, code, max_uses, used_count, is_active, notes, expires_at)
           VALUES ($1, $2, 1, 0, true, $3, $4)
           ON CONFLICT (code) DO NOTHING
           RETURNING code`,
          [randomUUID(), code, 'Fundador inicial - Programa Beta Privado', expiresAt]
        );
        
        if (result.rows.length > 0) {
          created.push(code);
          console.log(`✅ Creado: ${code}`);
        } else {
          already_exist.push(code);
          console.log(`⚠️  Existe: ${code}`);
        }
      } catch (error) {
        console.error(`❌ Error al crear ${code}:`, error.message);
      }
    }
    
    conn.release();
    
    console.log(`\n═══════════════════════════════════════════`);
    console.log(`✅ RESULTADO:`);
    console.log(`   Creados: ${created.length}`);
    console.log(`   Ya existen: ${already_exist.length}`);
    console.log(`   Total activos: ${created.length + already_exist.length}/${FOUNDER_CODES.length}`);
    console.log(`   Vigencia: 90 días`);
    console.log(`═══════════════════════════════════════════`);
    
    if (created.length === FOUNDER_CODES.length || created.length + already_exist.length === FOUNDER_CODES.length) {
      console.log('\n✅ LISTO: Todos los códigos de Fundadores están activos');
      process.exit(0);
    } else {
      console.log('\n❌ INCOMPLETO: Algunos códigos no se crearon');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

generateFounderCodes();
