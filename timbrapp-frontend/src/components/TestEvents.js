// Test eventi per il calendario
export const testEvents = [
  {
    id: '1',
    title: 'Test Evento 1',
    start: new Date(2025, 4, 16, 10, 0), // 16 maggio 2025, ore 10:00
    end: new Date(2025, 4, 16, 12, 0), // 16 maggio 2025, ore 12:00
    user: { nome: 'Utente Test' },
    startTime: '10:00',
    endTime: '12:00',
    commessa: { codice: 'TST-001', id: 1 },
    role: 'Developer',
    notes: 'Nota di test'
  },
  {
    id: '2',
    title: 'Test Evento 2',
    start: new Date(2025, 4, 16, 14, 0), // 16 maggio 2025, ore 14:00
    end: new Date(2025, 4, 16, 16, 0), // 16 maggio 2025, ore 16:00
    user: { nome: 'Utente Test 2' },
    startTime: '14:00',
    endTime: '16:00',
    commessa: { codice: 'TST-002', id: 2 },
    role: 'Designer',
    notes: 'Altra nota di test'
  },
  {
    id: '3',
    title: 'Test Evento 3',
    start: new Date(2025, 4, 17, 9, 0), // 17 maggio 2025, ore 9:00
    end: new Date(2025, 4, 17, 17, 0), // 17 maggio 2025, ore 17:00
    user: { nome: 'Utente Test 3' },
    startTime: '09:00',
    endTime: '17:00',
    commessa: { codice: 'TST-003', id: 3 },
    role: 'Manager',
    notes: 'Nota evento giornata intera'
  }
];
