const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./models/sequelize');

async function createShiftsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        startTime TIME NOT NULL,
        endTime TIME NOT NULL,
        date DATE NOT NULL,
        role VARCHAR(255),
        location VARCHAR(255),
        notes TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_shifts_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('Tabella shifts creata con successo!');
  } catch (error) {
    console.error('Errore creazione tabella shifts:', error);
  } finally {
    await sequelize.close();
  }
}

createShiftsTable();
