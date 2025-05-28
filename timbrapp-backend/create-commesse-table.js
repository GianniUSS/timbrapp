const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Sequelize } = require('sequelize');
const config = require('./config/config.json');
const { DataTypes } = require('sequelize');

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

async function createCommesseTable() {
    try {
        console.log('Tentativo di creazione della tabella commesse...');
        
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS commesse (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codice VARCHAR(50) NOT NULL UNIQUE COMMENT 'Codice identificativo della commessa',
                descrizione VARCHAR(255) NOT NULL COMMENT 'Descrizione della commessa',
                cliente VARCHAR(255) NOT NULL COMMENT 'Nome del cliente',
                dataInizio DATE NOT NULL COMMENT 'Data di inizio della commessa',
                dataFine DATE NULL COMMENT 'Data di fine della commessa (opzionale)',
                budget DECIMAL(10, 2) NULL COMMENT 'Budget allocato per la commessa',
                stato ENUM('attiva', 'completata', 'sospesa', 'annullata') NOT NULL DEFAULT 'attiva' COMMENT 'Stato corrente della commessa',
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Tabella commesse creata con successo!');
        
        // Inserisci alcuni dati di esempio
        await sequelize.query(`
            INSERT INTO commesse (codice, descrizione, cliente, dataInizio, stato) VALUES
            ('COM001', 'Sviluppo applicazione mobile', 'TechCorp S.r.l.', '2025-01-15', 'attiva'),
            ('COM002', 'Manutenzione sito web', 'Global Services S.p.A.', '2025-02-01', 'attiva'),
            ('COM003', 'Consulenza IT', 'MediCenter', '2025-03-10', 'attiva');
        `);
        
        console.log('Dati di esempio inseriti con successo!');
        
    } catch (error) {
        console.error('Errore durante la creazione della tabella commesse:', error);
    } finally {
        await sequelize.close();
    }
}

createCommesseTable();
