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

async function createSampleDocuments() {
    try {
        await sequelize.authenticate();
        console.log('Connessione stabilita con successo.');

        // Verifica se esistono già documenti
        const [documentiEsistenti] = await sequelize.query(`
            SELECT COUNT(*) as count FROM documentiuser;
        `);
        
        if (documentiEsistenti[0].count > 0) {
            console.log('Ci sono già documenti nel database. Operazione annullata.');
            return;
        }

        // Ottieni gli ID degli utenti per associare i documenti
        const [utenti] = await sequelize.query(`
            SELECT id FROM users LIMIT 1;
        `);
        
        if (utenti.length === 0) {
            console.log('Nessun utente trovato nel database. Impossibile creare documenti.');
            return;
        }
        
        const userId = utenti[0].id;
        console.log(`Creazione documenti per l'utente con ID: ${userId}`);

        // Creazione documenti di esempio
        await sequelize.query(`
            INSERT INTO documentiuser 
            (userId, tipologiaId, nome, url, stato_lettura, createdAt, updatedAt) 
            VALUES 
            (${userId}, 1, 'Contratto_2025.pdf', 'https://example.com/contratto.pdf', 'non letto', NOW(), NOW()),
            (${userId}, 3, 'Busta_Paga_Aprile_2025.pdf', 'https://example.com/bustapaga.pdf', 'letto', NOW(), NOW()),
            (${userId}, 5, 'Richiesta_Ferie_2025.pdf', 'https://example.com/ferie.pdf', 'non letto', NOW(), NOW()),
            (${userId}, 1, 'Privacy_Policy.pdf', 'https://example.com/privacy.pdf', 'letto', NOW(), NOW());
        `);
        
        console.log('Documenti di esempio creati con successo!');

        // Verifica inserimento
        const [documenti] = await sequelize.query(`
            SELECT * FROM documentiuser;
        `);
        
        console.log('\nDocumenti utente nel database:');
        console.log(documenti);

    } catch (error) {
        console.error('Errore durante la creazione dei documenti:', error);
    } finally {
        await sequelize.close();
    }
}

createSampleDocuments();
