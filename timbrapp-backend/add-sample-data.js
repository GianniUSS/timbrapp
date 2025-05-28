// Script di popolamento coerente per ambiente di sviluppo/demo
const sequelize = require('./sequelize');
const User = require('./models/User');
const Commessa = require('./models/Commessa');
const Location = require('./models/Location');
const Task = require('./models/Task');
const Shift = require('./models/Shift');

async function addSampleData() {
  try {
    // 1. Utenti
    const users = await User.bulkCreate([
      { id: 5, nome: 'Mario Rossi', email: 'mario.rossi@email.it', password: 'test', role: 'user' },
      { id: 9, nome: 'Luca Bianchi', email: 'luca.bianchi@email.it', password: 'test', role: 'user' },
      { id: 11, nome: 'Anna Verdi', email: 'anna.verdi@email.it', password: 'test', role: 'user' }
    ], { ignoreDuplicates: true });

    // 2. Commesse
    const commesse = await Commessa.bulkCreate([
      { id: 1, codice: 'C001', descrizione: 'Commessa Milano', cliente: 'Cliente A', dataInizio: '2025-05-01', stato: 'attiva' },
      { id: 2, codice: 'C002', descrizione: 'Commessa Napoli', cliente: 'Cliente B', dataInizio: '2025-05-01', stato: 'attiva' }
    ], { ignoreDuplicates: true });

    // 3. Locations
    const locations = await Location.bulkCreate([
      { id: 1, commessaId: 1, nome: 'Sede Milano', indirizzo: 'Via Milano 1' },
      { id: 2, commessaId: 2, nome: 'Sede Napoli', indirizzo: 'Via Napoli 2' }
    ], { ignoreDuplicates: true });

    // 4. Tasks
    const tasks = await Task.bulkCreate([
      { id: 1, nome: 'Task 1', commessaId: 1, locationId: 1, stato: 'attivo', numeroRisorse: 1 },
      { id: 2, nome: 'Task 2', commessaId: 1, locationId: 1, stato: 'attivo', numeroRisorse: 1 },
      { id: 3, nome: 'Task 3', commessaId: 2, locationId: 2, stato: 'attivo', numeroRisorse: 1 }
    ], { ignoreDuplicates: true });

    // 5. Shifts
    await Shift.bulkCreate([
      {
        userId: 5,
        resourceId: 5,
        commessaId: 1,
        taskId: 1,
        startTime: '08:00:00',
        endTime: '16:00:00',
        date: '2025-05-12',
        role: 'Operaio',
        location: 'Sede Milano',
        notes: 'Turno mattina'
      },
      {
        userId: 9,
        resourceId: 9,
        commessaId: 1,
        taskId: 2,
        startTime: '09:00:00',
        endTime: '17:00:00',
        date: '2025-05-12',
        role: 'Impiegato',
        location: 'Sede Roma',
        notes: 'Turno standard'
      },
      {
        userId: 11,
        resourceId: 11,
        commessaId: 2,
        taskId: 3,
        startTime: '10:00:00',
        endTime: '18:00:00',
        date: '2025-05-13',
        role: 'Manager',
        location: 'Sede Napoli',
        notes: 'Turno manageriale'
      }
    ]);
    console.log('Dati di esempio inseriti con successo!');
  } catch (error) {
    console.error('Errore inserimento dati di esempio:', error);
  } finally {
    await sequelize.close();
  }
}

addSampleData();
