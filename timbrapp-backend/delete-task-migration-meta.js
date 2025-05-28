// Script per eliminare la riga della migrazione tasks da SequelizeMeta
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  }
);

async function deleteTaskMigrationMeta() {
  try {
    const [result] = await sequelize.query("DELETE FROM SequelizeMeta WHERE name = '20250513170000-create-tasks.js'");
    console.log('Riga della migrazione tasks eliminata da SequelizeMeta:', result);
  } catch (err) {
    console.error('Errore durante la cancellazione della riga:', err);
  } finally {
    await sequelize.close();
  }
}

deleteTaskMigrationMeta();
