const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

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

async function checkTables() {
  try {
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('Tabelle presenti nel database:');
    tables.forEach(row => console.log(Object.values(row)[0]));
    if (!tables.some(row => Object.values(row)[0] === 'tasks')) {
      console.error('❌ La tabella tasks NON esiste!');
    } else {
      console.log('✅ La tabella tasks esiste!');
      // Mostra le colonne della tabella tasks
      const [columns] = await sequelize.query('SHOW COLUMNS FROM tasks');
      console.log('Colonne della tabella tasks:');
      columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    }
  } catch (err) {
    console.error('Errore durante la verifica delle tabelle:', err);
  } finally {
    await sequelize.close();
  }
}

checkTables();
