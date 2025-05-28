// Script per aggiornare i dipendenti esistenti aggiungendo i campi ruolo e skills
const sequelize = require('./sequelize');
const { QueryTypes } = require('sequelize');

async function updateDipendenti() {
  try {
    console.log('Connessione al database...');
    await sequelize.authenticate();
    console.log('Connessione stabilita con successo.');

    // Verifico se esistono già record nella tabella dipendenti
    const records = await sequelize.query(
      'SELECT id, nome, cognome FROM dipendenti', 
      { type: QueryTypes.SELECT }
    );
    
    console.log(`Trovati ${records.length} dipendenti nel database.`);
    
    if (records.length > 0) {    // Aggiorno i record esistenti aggiungendo i nuovi campi
      await sequelize.query(
        'UPDATE dipendenti SET ruolo = "Altro", skills = JSON_ARRAY() WHERE ruolo IS NULL OR skills IS NULL',
        { type: QueryTypes.UPDATE }
      );
      console.log('Aggiornati i campi ruolo e skills per i dipendenti esistenti.');
    } else {
      console.log('Nessun dipendente esistente da aggiornare.');
    }

    console.log('Operazione completata con successo.');
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dei dipendenti:', error);
  } finally {
    await sequelize.close();
    console.log('Connessione al database chiusa.');
  }
}

updateDipendenti();
