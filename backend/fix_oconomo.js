const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' }); // Load from current dir

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'scalabrianos'
  });

  try {
    const [rows] = await connection.query(`
      UPDATE tb_usuarios 
      SET is_oconomo = 1 
      WHERE id IN (
        SELECT usuario_id 
        FROM tb_missionario_casas 
        WHERE funcao LIKE '%Ecônomo Local%'
      ) AND role = 'PADRE';
    `);
    console.log(`Updated ${rows.affectedRows} users to have is_oconomo = 1 based on their presence history.`);
  } catch(e) {
    console.error(e);
  } finally {
    connection.end();
  }
}
fix();
