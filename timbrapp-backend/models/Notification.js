// models/Notification.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {
    static setupAssociations(models) {
      const { User } = models;
      
      if (User) {
        Notification.belongsTo(User, { foreignKey: 'userId' });
      }
    }
  }
  
  Notification.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // nome tabella minuscolo
        key: 'id',
      }
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'system'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    timestamps: true,
    tableName: 'notifications'
  });
  
  return Notification;
};