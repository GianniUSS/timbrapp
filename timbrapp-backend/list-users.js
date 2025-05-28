const sequelize = require('./models/sequelize');

async function listUsers() {
  try {
    const [results] = await sequelize.query('SELECT id, nome, email FROM users');
    console.log('Utenti presenti nella tabella users:');
    console.table(results);
  } catch (error) {
    console.error('Errore nel recupero utenti:', error);
  } finally {
    await sequelize.close();
  }
}

listUsers();
