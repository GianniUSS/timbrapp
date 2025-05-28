const express = require('express');
const router = express.Router();
const sequelize = require('../sequelize');
const { Commessa, Location } = require('../models');

// GET /commesse - restituisce tutte le commesse
router.get('/', async (req, res) => {  try {
    const commesse = await Commessa.findAll({
      include: [{ model: Location, as: 'location' }]
    });
    res.json(commesse);
  } catch (err) {
    console.error('Errore nel recupero delle commesse:', err);
    res.status(500).json({ error: 'Errore nel recupero delle commesse' });
  }
});

// GET /commesse/:id/locations - restituisce le location di una commessa
router.get('/:commessaId/locations', async (req, res) => {
  try {
    const commessaId = req.params.commessaId;
    console.log(`Richiesta locations per commessa ID: ${commessaId}`);
    
    // Verifica che la commessa esista
    const commessa = await Commessa.findByPk(commessaId);
    if (!commessa) {
      return res.status(404).json({ message: 'Commessa non trovata' });
    }
    
    // Carica le location associate
    const locations = await Location.findAll({
      where: { commessaId },
      order: [['nome', 'ASC']]
    });
    
    console.log(`Trovate ${locations.length} locations per commessa ID ${commessaId}`);
    res.json(locations);
  } catch (err) {
    console.error('Errore nel recupero delle locations:', err);
    res.status(500).json({ message: 'Errore nel recupero delle locations', error: err.message });
  }
});

// POST /commesse/:commessaId/locations - aggiunge una location a una commessa
router.post('/:commessaId/locations', async (req, res) => {
  try {
    const commessaId = req.params.commessaId;
    
    // Verifica che la commessa esista
    const commessa = await Commessa.findByPk(commessaId);
    if (!commessa) {
      return res.status(404).json({ message: 'Commessa non trovata' });
    }
    
    // Crea la nuova location
    const locationData = { ...req.body, commessaId };
    const location = await Location.create(locationData);
    
    console.log(`Creata nuova location ID ${location.id} per commessa ID ${commessaId}`);
    res.status(201).json(location);
  } catch (err) {
    console.error('Errore nella creazione della location:', err);
    res.status(500).json({ message: 'Errore nella creazione della location', error: err.message });
  }
});

// PUT /commesse/:commessaId/locations/:locationId - aggiorna una location
router.put('/:commessaId/locations/:locationId', async (req, res) => {
  try {
    const { commessaId, locationId } = req.params;
    
    // Verifica che la location esista e appartenga alla commessa specificata
    const location = await Location.findOne({
      where: { id: locationId, commessaId }
    });
    
    if (!location) {
      return res.status(404).json({ message: 'Location non trovata o non associata a questa commessa' });
    }
    
    // Aggiorna la location
    await location.update(req.body);
    
    console.log(`Aggiornata location ID ${locationId} per commessa ID ${commessaId}`);
    res.json(location);
  } catch (err) {
    console.error('Errore nell\'aggiornamento della location:', err);
    res.status(500).json({ message: 'Errore nell\'aggiornamento della location', error: err.message });
  }
});

// DELETE /commesse/:commessaId/locations/:locationId - elimina una location
router.delete('/:commessaId/locations/:locationId', async (req, res) => {
  try {
    const { commessaId, locationId } = req.params;
    
    // Verifica che la location esista e appartenga alla commessa specificata
    const location = await Location.findOne({
      where: { id: locationId, commessaId }
    });
    
    if (!location) {
      return res.status(404).json({ message: 'Location non trovata o non associata a questa commessa' });
    }
    
    // Elimina la location
    await location.destroy();
    
    console.log(`Eliminata location ID ${locationId} per commessa ID ${commessaId}`);
    res.status(204).send();
  } catch (err) {
    console.error('Errore nell\'eliminazione della location:', err);
    res.status(500).json({ message: 'Errore nell\'eliminazione della location', error: err.message });
  }
});

// GET /commesse/near - trova commesse con location vicine alle coordinate specificate
router.get('/near', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Parametri lat e lng obbligatori' });
    }
    
    // Converte stringa in numeri
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius);
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
      return res.status(400).json({ message: 'Parametri lat, lng e radius devono essere numeri validi' });
    }
    
    // Formula approssimativa per calcolare un raggio in gradi
    // 1 grado di latitudine ≈ 111 km, 1 grado di longitudine varia con la latitudine
    // Usiamo una approssimazione semplice per un'area di ricerca quadrata
    const latDelta = searchRadius / 111.0;
    const lngDelta = searchRadius / (111.0 * Math.cos(latitude * (Math.PI / 180)));
    
    // Trova tutte le location entro il raggio specificato
    const nearbyLocations = await Location.findAll({
      where: {
        lat: {
          [sequelize.Op.between]: [latitude - latDelta, latitude + latDelta]
        },
        lng: {
          [sequelize.Op.between]: [longitude - lngDelta, longitude + lngDelta]
        }
      }
    });
    
    // Estrae gli ID delle commesse dalle location
    const commessaIds = nearbyLocations.map(location => location.commessaId);
    
    // Trova tutte le commesse corrispondenti
    const commesse = await Commessa.findAll({
      where: {
        id: {
          [sequelize.Op.in]: commessaIds
        }
      }
    });
    
    console.log(`Trovate ${commesse.length} commesse vicine a lat: ${latitude}, lng: ${longitude}, raggio: ${searchRadius}km`);
    res.json(commesse);
  } catch (err) {
    console.error('Errore nella ricerca di commesse vicine:', err);
    res.status(500).json({ message: 'Errore nella ricerca di commesse vicine', error: err.message });
  }
});

module.exports = router;
