// Script SQL diretto per creare la tabella tasks in caso di problemi con Sequelize
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

async function createTasksTable() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS tasks');
    await sequelize.query(`
      CREATE TABLE tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL COMMENT 'Nome del task/attività',
        descrizione VARCHAR(255) NULL COMMENT 'Descrizione dettagliata del task',
        commessaId INT NOT NULL,
        stato ENUM('attivo', 'completato', 'annullato') NOT NULL DEFAULT 'attivo' COMMENT 'Stato del task',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_commessa_task FOREIGN KEY (commessaId) REFERENCES commesse(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Tabella tasks creata con successo!');
  } catch (err) {
    console.error('Errore nella creazione della tabella tasks:', err);
  } finally {
    await sequelize.close();
  }
}

createTasksTable();
