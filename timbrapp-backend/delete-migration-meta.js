const sequelize = require('./models/sequelize');

async function deleteMigrationMeta() {
  try {
    await sequelize.query("DELETE FROM SequelizeMeta WHERE name = '20250512141132-create-shifts-table.js'");
    console.log('Migration meta rimossa con successo.');
  } catch (error) {
    console.error('Errore nella cancellazione della migration meta:', error);
  } finally {
    await sequelize.close();
  }
}

deleteMigrationMeta();
