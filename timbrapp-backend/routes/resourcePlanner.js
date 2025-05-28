// timbrapp-backend/routes/resourcePlanner.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ResourcePlannerController = require('../controllers/resourcePlannerController');

// Protezione delle route con il middleware di autenticazione
router.use(auth);

// Route per le assegnazioni
router.get('/assignments', ResourcePlannerController.getAllAssignments);
router.post('/assignments', ResourcePlannerController.createAssignment);
router.put('/assignments/:id', ResourcePlannerController.updateAssignment);
router.delete('/assignments/:id', ResourcePlannerController.deleteAssignment);

// Route per i turni specifici di un task
router.post('/tasks/:taskId/shifts', ResourcePlannerController.createShift);

module.exports = router;
