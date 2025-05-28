// timbrapp-backend/rebuild-db.js
const { exec } = require('child_process');
const { createConnection } = require('mysql2/promise');
const dbConfig = require('./config/config.json').development;
const sequelize = require('./sequelize');

// Import modelli
const Location = require('./models/Location');
const User = require('./models/User');
const Commessa = require('./models/Commessa');
const Task = require('./models/Task');
const Notification = require('./models/Notification');
const Subscription = require('./models/Subscription');
const Shift = require('./models/Shift');
const Timbratura = require('./models/Timbratura');
const Request = require('./models/Request');

async function rebuildDatabase() {
  console.log('1. Connessione al server MySQL...');
  try {
    // Connessione senza specificare database
    const conn = await createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password
    });

    // Elimina il database se esiste
    console.log('2. Eliminazione database se esiste...');
    await conn.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
    console.log(`   Database ${dbConfig.database} eliminato.`);

    // Crea il database
    console.log('3. Creazione database pulito...');
    await conn.query(`CREATE DATABASE \`${dbConfig.database}\``);
    console.log(`   Database ${dbConfig.database} creato.`);
    
    await conn.end();

    // Crea le tabelle in ordine corretto
    console.log('4. Connessione al nuovo database e creazione modelli...');
    await sequelize.authenticate();

    console.log('5. Creazione tabelle in ordine corretto:');
    
    // 1. Prima crea User senza foreign keys
    console.log('   - Creazione tabella users');
    await User.sync({ force: true });

    // 2. Poi crea Commesse
    console.log('   - Creazione tabella commesse');
    await Commessa.sync({ force: true });
    
    // 3. Poi Location con FK a Commessa
    console.log('   - Creazione tabella locations');
    await Location.sync({ force: true });

    // 4. Poi Task con FK a Commessa e Location
    console.log('   - Creazione tabella tasks');
    await Task.sync({ force: true });
    
    // 5. Poi le altre tabelle
    console.log('   - Creazione tabella subscriptions');
    await Subscription.sync({ force: true });
    
    console.log('   - Creazione tabella shifts');
    await Shift.sync({ force: true });
    
    console.log('   - Creazione tabella timbrature');
    await Timbratura.sync({ force: true });
    
    console.log('   - Creazione tabella requests');
    await Request.sync({ force: true });
    
    console.log('   - Creazione tabella notifications');
    await Notification.sync({ force: true });
    
    console.log('6. Operazione completata!');
    
    // Verifica tabelle create
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('7. Tabelle create:', tables.map(t => Object.values(t)[0]).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('Errore durante la ricostruzione del database:', error);
    process.exit(1);
  }
}

rebuildDatabase();
