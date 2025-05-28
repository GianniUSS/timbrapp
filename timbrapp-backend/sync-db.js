// timbrapp-backend/sync-db.js
// Script rapido per sincronizzare il database senza usare sequelize-cli
const sequelize = require('./sequelize');

// Importa i modelli per registrarli con Sequelize
require('./models/User');
require('./models/Commessa');
require('./models/Task');
require('./models/Location');
require('./models/Shift');
require('./models/Notification');
require('./models/Request');
require('./models/Subscription');
require('./models/DocumentoUser');
require('./models/TipologiaDocumento');
require('./models/Timbratura');

(async () => {
    try {
        console.log('Eliminazione di tutte le tabelle esistenti...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.getQueryInterface().dropAllTables();
        console.log('Syncing database schema with force sync...');
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database sincronizzato correttamente.');
        process.exit(0);
    } catch (error) {
        console.error('Errore durante la sincronizzazione del database:', error);
        process.exit(1);
    }
})();
