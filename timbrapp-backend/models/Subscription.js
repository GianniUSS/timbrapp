// models/Subscription.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Subscription extends Model {
    static setupAssociations(models) {
      const { User } = models;
      
      if (User) {
        Subscription.belongsTo(User, { foreignKey: 'userId' });
      }
    }
  }
  
  Subscription.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users', // nome tabella minuscolo
        key: 'id',
      }
    },
    endpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    p256dh: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    auth: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Subscription',
    timestamps: true,
    tableName: 'subscriptions'
  });
  
  return Subscription;
};