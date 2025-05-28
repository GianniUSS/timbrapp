// Script di test connessione MySQL
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connessione al database riuscita!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore di connessione al database:', error);
    process.exit(1);
  }
})();
