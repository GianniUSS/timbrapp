// timbrapp-backend/routes/shiftRoutes.js
const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const auth = require('../middleware/auth');

/**
 * Rotte per la gestione dei turni
 */

// Ottenere tutti i turni (con filtri opzionali)
router.get('/', auth, shiftController.getAllShifts);

// Ottenere un turno specifico per ID
router.get('/:id', auth, shiftController.getShiftById);

// Creare un nuovo turno
router.post('/', auth, shiftController.createShift);

// Aggiornare un turno esistente
router.put('/:id', auth, shiftController.updateShift);

// Eliminare un turno
router.delete('/:id', auth, shiftController.deleteShift);

module.exports = router;
