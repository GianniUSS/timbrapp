const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./models/sequelize');
const Shift = require('./models/Shift');

async function insertSampleShifts() {
  try {
    // Inserisco turni solo per gli userId effettivamente presenti: 5, 9, 11
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
    console.log('Turni di esempio inseriti con successo!');
  } catch (error) {
    console.error('Errore inserimento turni di esempio:', error);
  } finally {
    await sequelize.close();
  }
}

insertSampleShifts();
