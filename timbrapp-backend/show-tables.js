// timbrapp-backend/show-tables.js
// Script per mostrare tutte le tabelle del database tramite Sequelize
const sequelize = require('./sequelize');
(async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    console.log('Tabelle presenti nel database:');
    console.table(tables);
  } catch (error) {
    console.error('Errore nel recupero delle tabelle:', error);
  } finally {
    await sequelize.close();
  }
})();
