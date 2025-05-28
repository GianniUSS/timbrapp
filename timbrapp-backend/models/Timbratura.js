// models/Timbratura.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Timbratura extends Model {
    static setupAssociations(models) {
      const { User } = models;
      
      if (User) {
        Timbratura.belongsTo(User, { foreignKey: 'userId' });
      }
    }
  }
  
  Timbratura.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('start', 'break_start','break_end','end'),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    lon: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // nome tabella minuscolo
        key: 'id',
      }
    }
  }, {
    sequelize,
    modelName: 'Timbratura',
    timestamps: true, // aggiunge createdAt, updatedAt
    tableName: 'timbrature' // Specifichi esattamente il nome della tabella
  });
  
  return Timbratura;
};