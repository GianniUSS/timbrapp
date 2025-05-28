// timbrapp-backend/controllers/resourcePlannerController.js
const models = require('../models');
const { Shift, User, Commessa, Task, TaskDipendente, Dipendente } = models;
const { Op } = require("sequelize");

/**
 * Controller per la gestione della pianificazione delle risorse
 * Include funzionalità per:
 * - Visualizzare le assegnazioni del personale
 * - Creare/modificare/cancellare assegnazioni
 * - Gestire i turni
 */
const ResourcePlannerController = {
  /**
   * Ottiene tutte le assegnazioni di personale ai task
   */
  async getAllAssignments(req, res) {
    try {
      // Parametri di query opzionali
      const { taskId, commessaId, dipendenteId, startDate, endDate } = req.query;
      
      // Costruisci le condizioni di ricerca per TaskDipendente
      const where = {};
      const include = [
        {
          model: Task,
          as: 'task',
          include: [{
            model: Commessa,
            as: 'commessa'
          }]
        },
        {
          model: Dipendente,
          as: 'dipendente'
        }
      ];
      
      // Filtra per taskId
      if (taskId) {
        where.taskId = taskId;
      }
      
      // Filtra per commessaId
      if (commessaId) {
        include[0].where = { commessaId };
      }
      
      // Filtra per dipendenteId
      if (dipendenteId) {
        where.dipendenteId = dipendenteId;
      }
      
      // Recupera le assegnazioni dai TaskDipendente
      const assignments = await TaskDipendente.findAll({
        where,
        include,
        order: [
          [{ model: Task, as: 'task' }, 'dataInizio', 'ASC'],
          [{ model: Dipendente, as: 'dipendente' }, 'cognome', 'ASC']
        ]
      });
      
      return res.json(assignments);
    } catch (error) {
      console.error('Errore nel recupero delle assegnazioni:', error);
      return res.status(500).json({ error: 'Errore nel recupero delle assegnazioni' });
    }
  },
  
  /**
   * Crea una nuova assegnazione di un dipendente a un task
   */
  async createAssignment(req, res) {
    try {
      const { taskId, dipendenteId, ruolo, note } = req.body;
      
      // Verifica che il task e il dipendente esistano
      const task = await Task.findByPk(taskId);
      const dipendente = await Dipendente.findByPk(dipendenteId);
      
      if (!task) {
        return res.status(404).json({ error: 'Task non trovato' });
      }
      
      if (!dipendente) {
        return res.status(404).json({ error: 'Dipendente non trovato' });
      }
      
      // Verifica se l'assegnazione esiste già
      const existingAssignment = await TaskDipendente.findOne({
        where: { taskId, dipendenteId }
      });
      
      if (existingAssignment) {
        return res.status(400).json({ error: 'Assegnazione già esistente' });
      }
      
      // Crea la nuova assegnazione
      const assignment = await TaskDipendente.create({
        taskId,
        dipendenteId,
        ruolo,
        note
      });
      
      return res.status(201).json(assignment);
    } catch (error) {
      console.error('Errore nella creazione dell\'assegnazione:', error);
      return res.status(500).json({ error: 'Errore nella creazione dell\'assegnazione' });
    }
  },
  
  /**
   * Aggiorna un'assegnazione esistente
   */
  async updateAssignment(req, res) {
    try {
      const { id } = req.params;
      const { ruolo, note } = req.body;
      
      // Verifica che l'assegnazione esista
      const assignment = await TaskDipendente.findByPk(id);
      
      if (!assignment) {
        return res.status(404).json({ error: 'Assegnazione non trovata' });
      }
      
      // Aggiorna l'assegnazione
      await assignment.update({
        ruolo,
        note
      });
      
      return res.json(assignment);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'assegnazione:', error);
      return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'assegnazione' });
    }
  },
  
  /**
   * Elimina un'assegnazione
   */
  async deleteAssignment(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica che l'assegnazione esista
      const assignment = await TaskDipendente.findByPk(id);
      
      if (!assignment) {
        return res.status(404).json({ error: 'Assegnazione non trovata' });
      }
      
      // Elimina l'assegnazione
      await assignment.destroy();
      
      return res.json({ message: 'Assegnazione eliminata con successo' });
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'assegnazione:', error);
      return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'assegnazione' });
    }
  },
  
  /**
   * Crea un nuovo turno per un task e un dipendente
   */
  async createShift(req, res) {
    try {
      const { taskId } = req.params;
      const { userId, date, startTime, endTime, note } = req.body;
      
      // Verifica che il task esista
      const task = await Task.findByPk(taskId);
      
      if (!task) {
        return res.status(404).json({ error: 'Task non trovato' });
      }
      
      // Recupera la commessa associata al task
      const commessaId = task.commessaId;
      
      // Crea il nuovo turno
      const shift = await Shift.create({
        userId,
        taskId,
        commessaId,
        date,
        startTime,
        endTime,
        note
      });
      
      // Carica i dati associati per restituire un oggetto completo
      const shiftWithDetails = await Shift.findByPk(shift.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "nome", "email", "role"],
          },
          {
            model: Commessa,
            as: "commessa",
            attributes: ["id", "codice", "descrizione", "cliente", "stato"],
          },
          {
            model: Task,
            as: "task",
            attributes: [
              "id",
              "nome",
              "descrizione",
              "stato",
              "durataPrevista",
              "numeroRisorse"
            ],
          },
        ]
      });
      
      return res.status(201).json(shiftWithDetails);
    } catch (error) {
      console.error('Errore nella creazione del turno:', error);
      return res.status(500).json({ error: 'Errore nella creazione del turno' });
    }
  }
};

module.exports = ResourcePlannerController;
