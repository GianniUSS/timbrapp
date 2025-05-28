// models/Request.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Request extends Model {
    static setupAssociations(models) {
      const { User } = models;
      
      if (User) {
        Request.belongsTo(User, { foreignKey: 'userId' });
      }
    }
  }
  
  Request.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('ferie', 'permesso', 'sts'),
      allowNull: false,
      comment: 'Tipo di richiesta: ferie, permesso o stipendio (sts)'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Data di inizio'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Data di fine'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Note aggiuntive'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Stato della richiesta'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // nome tabella minuscolo
        key: 'id',
      },
      comment: 'ID utente associato'
    }
  }, {
    sequelize,
    modelName: 'Request',
    timestamps: true, // aggiunge createdAt, updatedAt
    tableName: 'requests' // nome esatto della tabella
  });
  
  return Request;
};