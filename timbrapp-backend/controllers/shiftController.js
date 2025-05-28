// timbrapp-backend/controllers/shiftController.js
const models = require('../models');
const { Shift, User, Commessa, Task } = models;
const { Op } = require("sequelize");

/**
 * Controller per la gestione dei turni
 */
const ShiftController = {
  // Ottenere tutti i turni
  async getAllShifts(req, res) {
    try {
      // Parametri di query opzionali
      const { startDate, endDate, userId, commessaId, taskId } = req.query;

      // Costruisci le condizioni di ricerca
      const where = {};

      // Filtra per intervallo di date se specificato
      if (startDate && endDate) {
        where.date = {
          [Op.between]: [startDate, endDate],
        };
      } else if (startDate) {
        where.date = {
          [Op.gte]: startDate,
        };
      } else if (endDate) {
        where.date = {
          [Op.lte]: endDate,
        };
      }

      // Filtra per userId se specificato
      if (userId) {
        where.userId = userId;
      }

      // Filtra per commessaId se specificato
      if (commessaId) {
        where.commessaId = commessaId;
      }

      // Filtra per taskId se specificato
      if (taskId) {
        where.taskId = taskId;
      }
      const shifts = await Shift.findAll({
        where,
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
              "numeroRisorse",
              "skills",
            ],
          },
        ],
        order: [
          ["date", "ASC"],
          ["startTime", "ASC"],
        ],
      });

      res.json(shifts);
    } catch (error) {
      console.error("Errore nel recupero dei turni:", error);
      res.status(500).json({ error: "Errore nel recupero dei turni" });
    }
  },

  // Ottenere un turno specifico per ID
  async getShiftById(req, res) {
    try {
      const shiftId = req.params.id;
      const shift = await Shift.findByPk(shiftId, {
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
              "numeroRisorse",
              "skills",
            ],
          },
        ],
      });

      if (!shift) {
        return res.status(404).json({ error: "Turno non trovato" });
      }

      res.json(shift);
    } catch (error) {
      console.error("Errore nel recupero del turno:", error);
      res.status(500).json({ error: "Errore nel recupero del turno" });
    }
  },

  // Creare un nuovo turno
  async createShift(req, res) {
    try {
      const {
        userId,
        resourceId,
        startTime,
        endTime,
        date,
        role,
        location,
        notes,
        commessaId,
        taskId,
      } = req.body;

      // Verifica che i campi obbligatori siano presenti
      if (!userId || !startTime || !endTime || !date) {
        return res.status(400).json({ error: "Campi obbligatori mancanti" });
      }

      // Verifica che l'utente esista
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Verifica che la commessa esista se specificata
      if (commessaId) {
        const commessa = await Commessa.findByPk(commessaId);
        if (!commessa) {
          return res.status(404).json({ error: "Commessa non trovata" });
        }
      }

      // Verifica che il task esista se specificato
      if (taskId) {
        const task = await Task.findByPk(taskId);
        if (!task) {
          return res.status(404).json({ error: "Task non trovato" });
        }

        // Verifica che il task appartenga alla commessa specificata
        if (commessaId && task.commessaId !== parseInt(commessaId)) {
          return res
            .status(400)
            .json({
              error: "Il task non appartiene alla commessa specificata",
            });
        }
      }

      // Crea il nuovo turno
      const newShift = await Shift.create({
        userId,
        resourceId: resourceId || userId,
        startTime,
        endTime,
        date,
        role,
        location,
        notes,
        commessaId,
        taskId,
      });
      // Recupera il turno appena creato con tutte le relazioni
      const shift = await Shift.findByPk(newShift.id, {
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
              "numeroRisorse",
              "skills",
            ],
          },
        ],
      });

      res.status(201).json(shift);
    } catch (error) {
      console.error("Errore nella creazione del turno:", error);
      res.status(500).json({ error: "Errore nella creazione del turno" });
    }
  },

  // Aggiornare un turno esistente
  async updateShift(req, res) {
    try {
      const shiftId = req.params.id;
      const {
        userId,
        resourceId,
        startTime,
        endTime,
        date,
        role,
        location,
        notes,
        commessaId,
        taskId,
      } = req.body;

      // Verifica che il turno esista
      const shift = await Shift.findByPk(shiftId);
      if (!shift) {
        return res.status(404).json({ error: "Turno non trovato" });
      }

      // Verifica che l'utente esista se specificato
      if (userId) {
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({ error: "Utente non trovato" });
        }
      }

      // Verifica che la commessa esista se specificata
      if (commessaId) {
        const commessa = await Commessa.findByPk(commessaId);
        if (!commessa) {
          return res.status(404).json({ error: "Commessa non trovata" });
        }
      }

      // Verifica che il task esista se specificato
      if (taskId) {
        const task = await Task.findByPk(taskId);
        if (!task) {
          return res.status(404).json({ error: "Task non trovato" });
        }

        // Verifica che il task appartenga alla commessa specificata
        if (commessaId && task.commessaId !== parseInt(commessaId)) {
          return res
            .status(400)
            .json({
              error: "Il task non appartiene alla commessa specificata",
            });
        }
      }

      // Aggiorna il turno
      await shift.update({
        userId: userId || shift.userId,
        resourceId: resourceId || shift.resourceId,
        startTime: startTime || shift.startTime,
        endTime: endTime || shift.endTime,
        date: date || shift.date,
        role: role !== undefined ? role : shift.role,
        location: location !== undefined ? location : shift.location,
        notes: notes !== undefined ? notes : shift.notes,
        commessaId: commessaId !== undefined ? commessaId : shift.commessaId,
        taskId: taskId !== undefined ? taskId : shift.taskId,
      });
      // Recupera il turno aggiornato con tutte le relazioni
      const updatedShift = await Shift.findByPk(shiftId, {
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
              "numeroRisorse",
              "skills",
            ],
          },
        ],
      });

      res.json(updatedShift);
    } catch (error) {
      console.error("Errore nell'aggiornamento del turno:", error);
      res.status(500).json({ error: "Errore nell'aggiornamento del turno" });
    }
  },

  // Eliminare un turno
  async deleteShift(req, res) {
    try {
      const shiftId = req.params.id;

      const shift = await Shift.findByPk(shiftId);
      if (!shift) {
        return res.status(404).json({ error: "Turno non trovato" });
      }

      await shift.destroy();

      res.json({ message: "Turno eliminato con successo" });
    } catch (error) {
      console.error("Errore nell'eliminazione del turno:", error);
      res.status(500).json({ error: "Errore nell'eliminazione del turno" });
    }
  },
};

module.exports = ShiftController;
