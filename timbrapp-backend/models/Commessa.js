// timbrapp-backend/models/Commessa.js
const { Model, DataTypes } = require('sequelize');

/**
 * Modello Commessa
 * Rappresenta una commessa di lavoro con codice, descrizione e stato
 */
module.exports = (sequelize) => {
  class Commessa extends Model {
    static setupAssociations(models) {
      const { Location, Task, Shift } = models;
      
      // Associazione con Location (una commessa può avere molte sedi)
      if (Location) {
        Commessa.hasMany(Location, { foreignKey: 'commessaId', as: 'location' });
      }
      
      // Associazione con Task (una commessa può avere molti task)
      if (Task) {
        Commessa.hasMany(Task, { foreignKey: 'commessaId', as: 'tasks' });
      }
      
      // Associazione con Shift
      if (Shift) {
        Commessa.hasMany(Shift, { foreignKey: 'commessaId', as: 'shifts' });
      }
    }
  }
  
  Commessa.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    codice: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Codice identificativo della commessa'
    },
    descrizione: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Descrizione della commessa'
    },
    cliente: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nome del cliente'
    },
    dataInizio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Data di inizio della commessa'
    },
    dataFine: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Data di fine della commessa (opzionale)'
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Budget allocato per la commessa'
    },
    stato: {
      type: DataTypes.ENUM('attiva', 'completata', 'sospesa', 'annullata'),
      allowNull: false,
      defaultValue: 'attiva',
      comment: 'Stato corrente della commessa'
    }
  }, {
    sequelize,
    modelName: 'Commessa',
    tableName: 'commesse',
    timestamps: true
  });
  
  return Commessa;
};
