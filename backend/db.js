const mysql = require('mysql2/promise');
require('dotenv').config();

const clean = (val) => typeof val === 'string' ? val.replace(/^["']|["']$/g, '').trim() : val;

const pool = mysql.createPool({
  host: clean(process.env.DB_HOST),
  port: parseInt(clean(process.env.DB_PORT) || '3306'),
  user: clean(process.env.DB_USER),
  password: clean(process.env.DB_PASSWORD),
  database: clean(process.env.DB_NAME),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
