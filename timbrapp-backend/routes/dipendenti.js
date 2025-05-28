const express = require('express');
const router = express.Router();
const sequelize = require('../sequelize');

// Importiamo il modello Dipendente gestendo meglio l'inizializzazione
let Dipendente;
try {
  const DipendenteModel = require('../models/Dipendente');
  Dipendente = DipendenteModel(sequelize);
  console.log('Modello Dipendente inizializzato correttamente');
} catch (err) {
  console.error('Errore nell\'inizializzazione del modello Dipendente:', err);
}

// GET /dipendenti - restituisce tutti i dipendenti
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/dipendenti - Richiesta ricevuta');
    
    // Utilizza il modello dal index.js centrale invece di inizializzarlo qui
    const { Dipendente } = require('../models');
    
    // Verifica che il modello sia correttamente inizializzato
    if (!Dipendente || typeof Dipendente.findAll !== 'function') {
      console.error('GET /api/dipendenti - Errore: il modello Dipendente non è correttamente inizializzato');
      return res.status(500).json({ error: 'Errore nel modello Dipendente' });
    }
    
    const dipendenti = await Dipendente.findAll();
    console.log('GET /api/dipendenti - Dipendenti recuperati:', dipendenti ? dipendenti.length : 0);
    
    // Se non ci sono dipendenti, restituiamo un array vuoto anziché null
    res.json(dipendenti || []);
  } catch (err) {
    console.error('GET /api/dipendenti - Errore nel recupero dei dipendenti:', err);
    res.status(500).json({ error: 'Errore nel recupero dei dipendenti: ' + err.message });
  }
});

// POST /dipendenti - aggiunge un nuovo dipendente
router.post('/', async (req, res) => {
  try {
    const dip = await Dipendente.create(req.body);
    res.status(201).json(dip);
  } catch (err) {
    res.status(400).json({ error: 'Errore nella creazione del dipendente' });
  }
});

module.exports = router;
