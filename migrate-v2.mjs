import pg from 'pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_jhg1f6sRXuiT@ep-billowing-cloud-adkaw9p6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

async function migrateV2() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Ejecutando Migración V2...');
    
    // Añadir columnas faltantes
    await pool.query(`ALTER TABLE master_events ADD COLUMN IF NOT EXISTS source VARCHAR(50)`);
    console.log('✓ Columna source añadida');
    
    await pool.query(`ALTER TABLE master_events ADD COLUMN IF NOT EXISTS version VARCHAR(10)`);
    console.log('✓ Columna version añadida');
    
    // Actualizar valores por defecto
    await pool.query(`UPDATE master_events SET source = 'TRADING_ENGINE' WHERE source IS NULL`);
    await pool.query(`UPDATE master_events SET version = '1.00' WHERE version IS NULL`);
    
    console.log('✓ Migración V2 completada exitosamente');
  } catch (error) {
    console.error('✗ Error en migración:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateV2();
