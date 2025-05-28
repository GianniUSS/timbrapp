// timbrapp-backend/models/Shift.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Shift extends Model {
    static setupAssociations(models) {
      const { User, Commessa, Task } = models;
      
      // Associazione con User
      Shift.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      
      // Associazione con Commessa
      if (Commessa) {
        Shift.belongsTo(Commessa, { foreignKey: 'commessaId', as: 'commessa' });
      }
      
      // Associazione con Task
      if (Task) {
        Shift.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
      }
    }
  }
  
  Shift.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users', // nome tabella minuscolo
      key: 'id',
    }
  },
  startTime: {
    type: DataTypes.TIME, // Solo orario
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME, // Solo orario
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY, // Solo data
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  commessaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'commesse',
      key: 'id',
    }
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id',
    },
    comment: 'Riferimento al task associato a questo turno'
  },
    resourceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: 'Riferimento alla risorsa/dipendente assegnato al turno',
    references: {
      model: 'users',
      key: 'id'
    }
  }
  }, {
    sequelize,
    modelName: 'Shift',
    tableName: 'shifts', // Nome esplicito della tabella tutto minuscolo
    timestamps: true // Per createdAt e updatedAt
  });
    return Shift;
};
