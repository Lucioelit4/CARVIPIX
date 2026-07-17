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
    // Get list of all tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 All tables in database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');
    
    // Check if bot_mt5_licenses exists
    if (tables.rows.some(r => r.table_name === 'bot_mt5_licenses')) {
      console.log('✅ bot_mt5_licenses exists');
      const schema = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'bot_mt5_licenses'
        ORDER BY ordinal_position
      `);
      console.log('   Columns:');
      schema.rows.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('❌ bot_mt5_licenses table does NOT exist');
    }
    console.log('');
    
    // Check if orders exists
    if (tables.rows.some(r => r.table_name === 'orders')) {
      console.log('✅ orders exists');
      const schema = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'orders'
        ORDER BY ordinal_position
      `);
      console.log('   Columns:');
      schema.rows.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('❌ orders table does NOT exist');
    }
    
  } finally {
    await pool.end();
  }
})();
