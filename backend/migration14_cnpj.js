const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_scalabrianos'
  });

  try {
    console.log('Starting Migration 14: Adding CNPJ column (Alphanumeric ready) to tb_casas_religiosas...');
    
    // Add cnpj column to tb_casas_religiosas if not exists
    const [cols] = await connection.query("SHOW COLUMNS FROM tb_casas_religiosas LIKE 'cnpj'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE tb_casas_religiosas ADD COLUMN cnpj VARCHAR(20) DEFAULT NULL AFTER nome");
      console.log('Column cnpj (VARCHAR 20) added successfully to tb_casas_religiosas.');
    } else {
      console.log('Column cnpj already exists in tb_casas_religiosas.');
    }

    console.log('Migration 14 completed successfully!');
  } catch (error) {
    console.error('Migration 14 failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
