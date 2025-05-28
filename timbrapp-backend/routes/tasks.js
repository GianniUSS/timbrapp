// File: routes/tasks.js
const express = require('express');
const router = express.Router();
const sequelize = require('../sequelize');
// Importiamo i modelli dal modulo models che usa il pattern factory function
const models = require('../models');
const { Task, Dipendente, TaskDipendente } = models;

// GET /tasks - Ottiene tutti i task
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (err) {
    console.error('Errore nel recupero dei task:', err);
    res.status(500).json({ message: 'Errore nel recupero dei task', error: err.message });
  }
});

// GET /tasks/:id - Ottiene un singolo task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task non trovato' });
    }
    res.json(task);
  } catch (err) {
    console.error('Errore nel recupero del task:', err);
    res.status(500).json({ message: 'Errore nel recupero del task', error: err.message });
  }
});

// POST /tasks - Crea un nuovo task
router.post('/', async (req, res) => {
  try {
    console.log('Dati ricevuti per creazione task (route /tasks):', JSON.stringify(req.body, null, 2));
    
    // Verifica che i campi obbligatori siano presenti
    const { nome, commessaId, funzioneId } = req.body;
    
    if (!nome || !commessaId || !funzioneId) {
      return res.status(400).json({ 
        message: 'Errore nella creazione del task', 
        error: 'I campi nome, commessaId e funzioneId sono obbligatori' 
      });
    }
    
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (err) {
    console.error('Errore nella creazione del task:', err);
    res.status(400).json({ message: 'Errore nella creazione del task', error: err.message });
  }
});

// PUT /tasks/:id - Aggiorna un task esistente
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task non trovato' });
    }
    
    await task.update(req.body);
    res.json(task);
  } catch (err) {
    console.error('Errore nell\'aggiornamento del task:', err);
    res.status(400).json({ message: 'Errore nell\'aggiornamento del task', error: err.message });
  }
});

// DELETE /tasks/:id - Elimina un task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task non trovato' });
    }
    
    await task.destroy();
    res.status(204).end();
  } catch (err) {
    console.error('Errore nell\'eliminazione del task:', err);
    res.status(500).json({ message: 'Errore nell\'eliminazione del task', error: err.message });
  }
});

// GET /tasks/:taskId/personale - Ottiene il personale assegnato a un task
router.get('/:taskId/personale', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    // Verifichiamo che il task esista
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task non trovato' });
    }
    
    // Otteniamo i dipendenti assegnati al task
    const dipendentiAssegnati = await Dipendente.findAll({
      include: [{
        model: Task,
        where: { id: taskId },
        as: 'tasks',
        through: { attributes: [] }
      }]
    });
    
    res.json(dipendentiAssegnati);
  } catch (err) {
    console.error('Errore nel recupero del personale assegnato:', err);
    res.status(500).json({ 
      message: 'Errore nel recupero del personale assegnato', 
      error: err.message 
    });
  }
});

// POST /tasks/:taskId/personale - Assegna personale a un task
router.post('/:taskId/personale', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { personaleIds } = req.body;
    
    if (!Array.isArray(personaleIds)) {
      return res.status(400).json({ message: 'personaleIds deve essere un array' });
    }
    
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task non trovato' });
    }
    
    // Verifichiamo che tutti i dipendenti esistano
    const dipendenti = await Dipendente.findAll({
      where: {
        id: personaleIds
      }
    });
    
    if (dipendenti.length !== personaleIds.length) {
      return res.status(400).json({ 
        message: 'Alcuni ID di dipendenti non sono validi' 
      });
    }
    
    // Aggiorniamo le associazioni
    await task.setDipendenti(dipendenti);
    
    // Recupera il personale aggiornato
    const personaleAggiornato = await task.getDipendenti();
    
    res.json(personaleAggiornato);
  } catch (err) {
    console.error('Errore nell\'assegnazione del personale:', err);
    res.status(500).json({ 
      message: 'Errore nell\'assegnazione del personale', 
      error: err.message 
    });
  }
});

module.exports = router;
