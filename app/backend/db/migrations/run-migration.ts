/**
 * Ejecutor de migraciones para CARVIPIX Core Schema
 * 
 * Uso: 
 *   1. Configurar: export DATABASE_URL="postgresql://..."
 *   2. Ejecutar: npx ts-node app/backend/db/migrations/run-migration.ts
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('\n❌ ERROR: DATABASE_URL no está configurado\n');
  console.error('Para usar esta migración, configure la variable de entorno:');
  console.error('');
  console.error('Opción 1 - Neon (Recomendado):');
  console.error('  1. Crear proyecto en https://console.neon.tech');
  console.error('  2. Copiar Connection String (postgresql://...)');
  console.error('  3. Ejecutar: export DATABASE_URL="postgresql://..."');
  console.error('');
  console.error('Opción 2 - PostgreSQL local:');
  console.error('  export DATABASE_URL="postgresql://user:pass@localhost:5432/carvipix"');
  console.error('');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔄 Conectando a Neon PostgreSQL...');
    const client = await pool.connect();
    
    console.log('✅ Conectado a BD');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../../../../migrations/001_create_core_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Archivo de migración no encontrado: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Ejecutando migración...');
    
    // Ejecutar migración
    await client.query(migrationSQL);
    
    console.log('✅ Migración completada exitosamente');
    
    // Verificar tablas creadas
    console.log('\n📊 Verificando tablas creadas...');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\nTablas en BD:');
    result.rows.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.table_name}`);
    });
    
    // Verificar índices
    console.log('\n📇 Verificando índices...');
    
    const indexResult = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log('\nÍndices creados:');
    let currentTable = '';
    indexResult.rows.forEach((row) => {
      if (row.tablename !== currentTable) {
        console.log(`\n  ${row.tablename}:`);
        currentTable = row.tablename;
      }
      console.log(`    - ${row.indexname}`);
    });
    
    // Contar tablas
    const tableCount = result.rows.length;
    console.log(`\n✅ MIGRACIÓN EXITOSA: ${tableCount} tablas creadas`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ ERROR durante migración:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
runMigration().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
