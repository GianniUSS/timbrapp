// timbrapp-backend/models/Task.js
const { Model, DataTypes } = require('sequelize');

/**
 * Modello Task
 * Rappresenta un'attività/task collegata a una commessa
 */
module.exports = (sequelize) => {
  class Task extends Model {
    static setupAssociations(models) {
      const { Location, Commessa, Funzione, Shift } = models;
      
      // Associazione con Commessa
      if (Commessa) {
        Task.belongsTo(Commessa, { foreignKey: 'commessaId', as: 'commessa' });
      }
      
      // Associazione con Location
      if (Location) {
        Task.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
      }
      
      // Associazione con Funzione
      if (Funzione) {
        Task.belongsTo(Funzione, { foreignKey: 'funzioneId', as: 'funzione' });
      }
      
      // Associazione con Shift
      if (Shift) {
        Task.hasMany(Shift, { foreignKey: 'taskId', as: 'shifts' });
      }
      
      // NOTA: Le associazioni many-to-many con Dipendenti sono gestite in TaskDipendente.js
      // per evitare riferimenti circolari
    }
  }
  
  Task.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nome del task/attività'
    },
    descrizione: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Descrizione dettagliata del task'
    },
    commessaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'commesse',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'Collegamento alla commessa di riferimento'
    },
    stato: {
      type: DataTypes.ENUM('attivo', 'completato', 'annullato'),
      allowNull: false,
      defaultValue: 'attivo',
      comment: 'Stato del task'
    },
    durataPrevista: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Durata prevista del task in ore'
    },
    numeroRisorse: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: 'Numero di risorse necessarie per il task'
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Competenze richieste per il task (array di skills)'
    },
    dataInizio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Data di inizio pianificata del task'
    },
    dataFine: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Data di fine pianificata del task'
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'locations', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      comment: 'Collegamento alla location di riferimento'
    },
    funzioneId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'funzioni', // nome tabella minuscolo
        key: 'id',
      },
      onDelete: 'RESTRICT',
      comment: 'Collegamento alla funzione (macro-attività)'
    },
    priorita: {
      type: DataTypes.ENUM('bassa', 'media', 'alta', 'urgente'),
      allowNull: false,
      defaultValue: 'media',
      comment: 'Livello di priorità del task'
    }
  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true
  });
  
  return Task;
};
