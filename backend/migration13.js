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
    console.log('Starting migration 13...');
    await connection.query(`ALTER TABLE tb_usuarios ADD COLUMN foto_perfil VARCHAR(500) DEFAULT NULL`);
    console.log('Added foto_perfil to tb_usuarios successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column foto_perfil already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await connection.end();
  }
}

runMigration();
