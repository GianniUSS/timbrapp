// timbrapp-backend/setup-db.js
// Script completo che crea il database e tutte le tabelle nell'ordine corretto
// Risolve i problemi di foreign key constraints

const { createConnection } = require('mysql2/promise');
const dbConfig = require('./config/config.json').development;
const sequelize = require('./sequelize');

// Importa tutti i modelli per registrarli
const User = require('./models/User');
const Commessa = require('./models/Commessa');
const Location = require('./models/Location');
const Task = require('./models/Task');
const Shift = require('./models/Shift');
const Notification = require('./models/Notification');
const Request = require('./models/Request');
const Subscription = require('./models/Subscription');
const Timbratura = require('./models/Timbratura');
const TipologiaDocumento = require('./models/TipologiaDocumento');
const DocumentoUser = require('./models/DocumentoUser');

async function setupDatabase() {
  try {
    // 1. Connessione diretta a MySQL senza specificare database
    console.log('1. Connessione al server MySQL...');
    const conn = await createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password
    });

    // 2. Drop e creazione database pulito
    console.log('2. Ricreazione database...');
    await conn.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
    await conn.query(`CREATE DATABASE \`${dbConfig.database}\``);
    console.log(`   Database ${dbConfig.database} ricreato.`);
    
    // 3. Chiusura connessione root
    await conn.end();

    // 4. Connessione al database appena creato
    console.log('3. Connessione al database...');
    await sequelize.authenticate();
    console.log('   Connessione riuscita.');

    // 5. Creazione tabelle in ordine corretto
    console.log('4. Creazione tabelle:');

    // Tabelle principali senza FK
    console.log('   - Creazione tabella users');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`nome\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`passwordHash\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(32) NOT NULL DEFAULT 'user',
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella commesse');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`commesse\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`codice\` VARCHAR(50) NOT NULL UNIQUE,
        \`descrizione\` VARCHAR(255) NOT NULL,
        \`cliente\` VARCHAR(255) NOT NULL,
        \`dataInizio\` DATE NOT NULL,
        \`dataFine\` DATE NULL,
        \`budget\` DECIMAL(10,2) NULL,
        \`stato\` ENUM('attiva', 'completata', 'sospesa', 'annullata') NOT NULL DEFAULT 'attiva',
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella locations');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`locations\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`commessaId\` INT NOT NULL,
        \`nome\` VARCHAR(255) NOT NULL,
        \`indirizzo\` VARCHAR(255) NULL,
        \`lat\` DECIMAL(10,6) NULL,
        \`lng\` DECIMAL(10,6) NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_location_commessa\` FOREIGN KEY (\`commessaId\`) 
          REFERENCES \`commesse\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella tasks');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`tasks\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`nome\` VARCHAR(255) NOT NULL,
        \`descrizione\` TEXT NULL,
        \`stato\` ENUM('attivo', 'completato', 'annullato') NOT NULL DEFAULT 'attivo',
        \`commessaId\` INT NOT NULL,
        \`locationId\` INT NULL,
        \`durataPrevista\` FLOAT NULL,
        \`numeroRisorse\` INT NULL DEFAULT 1,
        \`skills\` JSON NULL,
        \`dataInizio\` DATE NULL,
        \`dataFine\` DATE NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_task_commessa\` FOREIGN KEY (\`commessaId\`)
          REFERENCES \`commesse\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_task_location\` FOREIGN KEY (\`locationId\`)
          REFERENCES \`locations\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella timbrature');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`timbrature\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`userId\` INT UNSIGNED NOT NULL,
        \`type\` VARCHAR(20) NOT NULL,
        \`timestamp\` DATETIME NOT NULL,
        \`lat\` DECIMAL(10,8) NULL,
        \`lon\` DECIMAL(11,8) NULL,
        \`syncedFromOffline\` BOOLEAN NOT NULL DEFAULT false,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_timbrature_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella subscriptions');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`subscriptions\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`userId\` INT UNSIGNED NOT NULL,
        \`endpoint\` VARCHAR(500) NOT NULL UNIQUE,
        \`p256dh\` VARCHAR(255) NOT NULL,
        \`auth\` VARCHAR(255) NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_subscription_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella notifications');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`userId\` INT UNSIGNED NOT NULL,
        \`message\` VARCHAR(255) NOT NULL,
        \`type\` VARCHAR(50) NOT NULL DEFAULT 'info',
        \`isRead\` BOOLEAN NOT NULL DEFAULT false,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_notification_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella requests');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`requests\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`userId\` INT UNSIGNED NOT NULL,
        \`type\` VARCHAR(50) NOT NULL,
        \`startDate\` DATE NOT NULL,
        \`endDate\` DATE NOT NULL,
        \`note\` TEXT NULL,
        \`status\` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_request_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella shifts');    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`shifts\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`userId\` INT UNSIGNED NOT NULL,
        \`resourceId\` INT UNSIGNED NOT NULL,
        \`startTime\` TIME NOT NULL,
        \`endTime\` TIME NOT NULL,
        \`date\` DATE NOT NULL,
        \`role\` VARCHAR(255) NULL,
        \`location\` VARCHAR(255) NULL,
        \`notes\` TEXT NULL,
        \`commessaId\` INT NULL,
        \`taskId\` INT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_shift_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE,
        CONSTRAINT \`fk_shift_resource\` FOREIGN KEY (\`resourceId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE NO ACTION ON UPDATE CASCADE,
        CONSTRAINT \`fk_shift_commessa\` FOREIGN KEY (\`commessaId\`)
          REFERENCES \`commesse\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`fk_shift_task\` FOREIGN KEY (\`taskId\`)
          REFERENCES \`tasks\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella tipologiedocumento');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`tipologiedocumento\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`nome\` VARCHAR(255) NOT NULL UNIQUE,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    console.log('   - Creazione tabella documentiuser');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`documentiuser\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`userId\` INT UNSIGNED NOT NULL,
        \`tipologiaId\` INT NOT NULL,
        \`nome\` VARCHAR(255) NOT NULL,
        \`url\` VARCHAR(500) NOT NULL,
        \`stato_lettura\` ENUM('letto', 'non letto') NOT NULL DEFAULT 'non letto',
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_documento_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_documento_tipologia\` FOREIGN KEY (\`tipologiaId\`)
          REFERENCES \`tipologiedocumento\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Verifica tabelle create
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('5. Tabelle create:', tables.map(t => Object.values(t)[0]).join(', '));

    // Aggiunta dati di esempio
    console.log('6. Inserimento utente iniziale');
    await sequelize.query(`
      INSERT INTO \`users\` (nome, email, passwordHash, role) 
      VALUES ('Admin', 'admin@example.com', '$2b$10$QUlPxgVGGfOiQDSv5TU.UO.Fx5YtYfRV5vBLZJQ1nKzIc3bNswcXa', 'admin')
    `);

    // Creazione commessa di test
    console.log('7. Inserimento commessa di test');
    await sequelize.query(`
      INSERT INTO \`commesse\` (codice, descrizione, cliente, dataInizio, dataFine, stato)
      VALUES ('COM001', 'Commessa Test 1', 'Cliente ABC', '2025-05-01', '2025-12-31', 'attiva')
    `);

    // Creazione location di test    console.log('8. Inserimento location di test');
    await sequelize.query(`
      INSERT INTO \`locations\` (commessaId, nome, indirizzo, lat, lng)
      VALUES (1, 'Sede Centrale', 'Via Roma 1, Milano', 45.4642, 9.19)
    `);

    console.log('9. Inserimento tipologie documento di esempio');
    await sequelize.query(`
      INSERT INTO \`tipologiedocumento\` (nome) VALUES 
      ('Busta Paga'),
      ('Contratto'),
      ('Certificazione'),
      ('Comunicazione')
    `);

    console.log('10. Database configurato con successo!');
    process.exit(0);
  } catch (error) {
    console.error('Errore durante la configurazione del database:', error);
    process.exit(1);
  }
}

setupDatabase();
