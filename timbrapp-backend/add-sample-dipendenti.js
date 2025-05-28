const { Sequelize } = require('sequelize');
const sequelize = require('./sequelize');
const Dipendente = require('./models/Dipendente')(sequelize);

async function seed() {
  await sequelize.sync();
  await Dipendente.bulkCreate([
    { nome: 'Mario', cognome: 'Rossi', email: 'mario.rossi@email.com', telefono: '3331112222' },
    { nome: 'Luca', cognome: 'Bianchi', email: 'luca.bianchi@email.com', telefono: '3332223333' },
    { nome: 'Giulia', cognome: 'Verdi', email: 'giulia.verdi@email.com', telefono: '3333334444' },
    { nome: 'Anna', cognome: 'Neri', email: 'anna.neri@email.com', telefono: '3334445555' }
  ], { ignoreDuplicates: true });
  console.log('Dipendenti di esempio inseriti!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
