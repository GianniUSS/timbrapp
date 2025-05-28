// run-specific-migration.js
const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const config = require('./config/config.json')['development'];

// Ottieni il nome del file di migrazione dalla riga di comando
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Specificare il nome del file di migrazione');
  process.exit(1);
}

// Crea l'istanza di Sequelize
const sequelize = new Sequelize(
  config.database, 
  config.username, 
  config.password, 
  {
    host: config.host,
    dialect: config.dialect,
    logging: console.log
  }
);

// Configura Umzug per le migrazioni
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, './migrations'),
    params: [sequelize.getQueryInterface(), Sequelize],
    pattern: /\.js$/
  },
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

// Funzione per eseguire la migrazione specifica
async function runSpecificMigration() {
  try {
    console.log(`Testing connection...`);
    await sequelize.authenticate();
    console.log('Connection successful!');

    console.log(`Running migration: ${migrationFile}`);

    // Esegui la migrazione specifica
    const migration = require(path.join(__dirname, 'migrations', migrationFile));
    
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log(`Migration ${migrationFile} completed successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runSpecificMigration();
