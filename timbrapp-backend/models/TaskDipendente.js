// File: models/TaskDipendente.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TaskDipendente extends Model {
    static setupAssociations(models) {
      const { Task, Dipendente } = models;
      
      if (Task && Dipendente) {
        // Creiamo le relazioni many-to-many tra Task e Dipendente
        Task.belongsToMany(Dipendente, { 
          through: TaskDipendente, 
          foreignKey: 'taskId', 
          otherKey: 'dipendenteId',
          as: 'dipendenti'
        });

        Dipendente.belongsToMany(Task, { 
          through: TaskDipendente, 
          foreignKey: 'dipendenteId', 
          otherKey: 'taskId',
          as: 'tasks'
        });
      }
    }
  }
  
  TaskDipendente.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    dipendenteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dipendenti',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    ruolo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Ruolo del dipendente nel task (es. "Project Manager", "Sviluppatore")'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Note aggiuntive sull\'assegnazione'
    }
  }, {
    sequelize,
    modelName: 'TaskDipendente',
    tableName: 'task_dipendenti',
    timestamps: true
  });
  
  return TaskDipendente;
};
