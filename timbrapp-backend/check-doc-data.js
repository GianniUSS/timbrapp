const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect
    }
);

async function checkExistingData() {
    try {
        await sequelize.authenticate();
        console.log('Connessione stabilita con successo.');

        // Verifica dati nella tabella tipologiedocumento
        const [tipologie] = await sequelize.query(`
            SELECT * FROM tipologiedocumento;
        `);
        
        console.log('\nTipologie documento nel database:');
        console.log(tipologie);

        // Verifica dati nella tabella documentiuser
        const [documenti] = await sequelize.query(`
            SELECT * FROM documentiuser;
        `);
        
        console.log('\nDocumenti utente nel database:');
        console.log(documenti);

    } catch (error) {
        console.error('Errore durante la verifica dei dati:', error);
    } finally {
        await sequelize.close();
    }
}

checkExistingData();
