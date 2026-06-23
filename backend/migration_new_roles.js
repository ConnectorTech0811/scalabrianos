const pool = require('./db');

async function run() {
  try {
    console.log("Altering tb_usuarios.role enum...");
    await pool.query(`
      ALTER TABLE tb_usuarios 
      MODIFY COLUMN role ENUM(
        'ADMIN_GERAL', 'ADMINISTRADOR', 'COLABORADOR', 'INTERMITENTE', 'PADRE', 'REGISTRO_REGIONAL',
        'SUPERIOR_REGIONAL', 'SECRETARIO_REGIONAL', 'ECONOMO_REGIONAL',
        'SECRETARIADO_MISSAO', 'SECRETARIADO_VIDA_RELIGIOSA', 'SECRETARIADO_FORMACAO',
        'SUPERIOR_LOCAL', 'ECONOMO_LOCAL', 'MISSIONARIO'
      ) DEFAULT 'COLABORADOR'
    `);
    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
